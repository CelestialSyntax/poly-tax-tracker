import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { transactions, userSettings, wallets } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { TaxCalculator } from "@/lib/tax/calculator";
import type { Transaction } from "@/lib/tax/types";
import type { TaxTreatment, CostBasisMethod } from "@/lib/tax/types";
import { fetchCurrentPositions } from "@/lib/polymarket/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [rows, settingsRows, userWallets] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(asc(transactions.timestamp)),
    db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1),
    db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId)),
  ]);

  const settings = settingsRows[0];
  const treatment: TaxTreatment =
    (settings?.defaultTaxTreatment as TaxTreatment) ?? "capital_gains";
  const costBasis: CostBasisMethod =
    (settings?.defaultCostBasis as CostBasisMethod) ?? "fifo";
  const taxYear = settings?.taxYear ?? new Date().getFullYear();

  // Convert DB rows (string numerics) to Transaction objects
  const txs: Transaction[] = rows.map((r) => ({
    id: r.id,
    marketId: r.marketId,
    marketTitle: r.marketTitle,
    outcome: r.outcome as "YES" | "NO",
    type: r.type as Transaction["type"],
    quantity: Number(r.quantity),
    pricePerShare: Number(r.pricePerShare),
    totalAmount: Number(r.totalAmount),
    fee: Number(r.fee),
    timestamp: new Date(r.timestamp),
  }));

  // Run tax calculator for user's preferred treatment (used for stats)
  const calculator = new TaxCalculator(treatment, costBasis, taxYear);
  const { events, summary } = calculator.calculate(txs);

  // --- Stats ---
  const tradeTxs = txs.filter((t) => t.type === "BUY" || t.type === "SELL");
  const totalTrades = tradeTxs.length;

  // Win rate: group events by market, check if net gain > 0
  const gainByMarket = new Map<string, number>();
  for (const ev of events) {
    const key = ev.transaction.marketId;
    gainByMarket.set(key, (gainByMarket.get(key) ?? 0) + ev.totalGainLoss);
  }
  const marketCount = gainByMarket.size;
  const winCount = [...gainByMarket.values()].filter((g) => g > 0).length;
  const winRate = marketCount > 0 ? (winCount / marketCount) * 100 : 0;

  // --- P&L History ---
  const monthlyPnl = new Map<string, number>();
  for (const ev of events) {
    const d = ev.transaction.timestamp;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyPnl.set(key, (monthlyPnl.get(key) ?? 0) + ev.totalGainLoss);
  }
  const sortedMonths = [...monthlyPnl.keys()].sort();
  let cumulative = 0;
  const pnlHistory = sortedMonths.map((key) => {
    const pnl = monthlyPnl.get(key)!;
    cumulative += pnl;
    const [y, m] = key.split("-");
    const monthLabel = new Date(Number(y), Number(m) - 1).toLocaleString(
      "en-US",
      { month: "short" },
    );
    return {
      month: monthLabel,
      pnl: Math.round(pnl * 100) / 100,
      cumulative: Math.round(cumulative * 100) / 100,
    };
  });

  // --- Recent Trades ---
  const recentRows = [...rows].reverse().slice(0, 10);
  const now = Date.now();
  const recentTrades = recentRows.map((r) => {
    const ts = new Date(r.timestamp).getTime();
    const diffMs = now - ts;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    let time: string;
    if (diffMin < 60) time = `${diffMin}m ago`;
    else if (diffHr < 24) time = `${diffHr}h ago`;
    else time = `${diffDay}d ago`;

    return {
      id: r.id,
      market: r.marketTitle,
      type: r.type as "BUY" | "SELL" | "SETTLEMENT",
      outcome: r.outcome as "YES" | "NO",
      qty: Number(r.quantity),
      price: Number(r.pricePerShare),
      total: Number(r.totalAmount),
      time,
    };
  });

  // --- Tax Comparison ---
  // Run calculator for all 3 treatments so netGain is consistent (actual net P&L)
  const cgCalc = new TaxCalculator("capital_gains", costBasis, taxYear);
  const gambCalc = new TaxCalculator("gambling", costBasis, taxYear);
  const bizCalc = new TaxCalculator("business", costBasis, taxYear);

  const cgResult = cgCalc.calculate(txs);
  const gambResult = gambCalc.calculate(txs);
  const bizResult = bizCalc.calculate(txs);

  const netPnl = cgResult.summary.totalGainLoss;

  const taxComparison = {
    capitalGains: {
      netGain: Math.round(netPnl * 100) / 100,
      estimatedTax: Math.round(cgResult.summary.estimatedTaxLiability * 100) / 100,
      effectiveRate:
        netPnl !== 0
          ? Math.round(Math.abs(cgResult.summary.estimatedTaxLiability / netPnl) * 1000) / 1000
          : 0,
    },
    gambling: {
      netGain: Math.round(netPnl * 100) / 100,
      estimatedTax: Math.round(gambResult.summary.estimatedTaxLiability * 100) / 100,
      effectiveRate:
        netPnl !== 0
          ? Math.round(Math.abs(gambResult.summary.estimatedTaxLiability / netPnl) * 1000) / 1000
          : 0,
    },
    business: {
      netGain: Math.round(netPnl * 100) / 100,
      estimatedTax: Math.round(bizResult.summary.estimatedTaxLiability * 100) / 100,
      effectiveRate:
        netPnl !== 0
          ? Math.round(Math.abs(bizResult.summary.estimatedTaxLiability / netPnl) * 1000) / 1000
          : 0,
    },
  };

  // --- Active Positions ---
  // Fetch real positions from Polymarket Data API (works with EOA addresses)
  let activePositions: {
    id: string;
    market: string;
    outcome: "YES" | "NO";
    qty: number;
    avgPrice: number;
    currentPrice: number;
    unrealizedPnl: number;
  }[] = [];

  if (userWallets.length > 0) {
    try {
      const positionResults = await Promise.all(
        userWallets.map((w) => fetchCurrentPositions(w.address).catch(() => [])),
      );

      activePositions = positionResults
        .flat()
        .filter((p) => p.size > 0.001)
        .map((p) => {
          const outcome = p.outcome.toUpperCase();
          return {
            id: p.conditionId + ":" + outcome,
            market: p.title,
            outcome: (outcome === "YES" || outcome === "UP" ? "YES" : "NO") as
              | "YES"
              | "NO",
            qty: Math.round(p.size * 100) / 100,
            avgPrice: Math.round(p.avgPrice * 10000) / 10000,
            currentPrice: Math.round(p.curPrice * 10000) / 10000,
            unrealizedPnl: Math.round(p.cashPnl * 100) / 100,
          };
        });
    } catch {
      // If Polymarket API fails, return empty positions rather than crashing
    }
  }

  return NextResponse.json({
    stats: {
      totalTrades,
      netPnl: Math.round(summary.totalGainLoss * 100) / 100,
      estimatedTax: Math.round(summary.estimatedTaxLiability * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      pnlChange: 0,
      tradesChange: 0,
      taxChange: 0,
      winRateChange: 0,
    },
    pnlHistory,
    recentTrades,
    taxComparison,
    activePositions,
  });
}
