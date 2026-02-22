import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { transactions, userSettings } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { TaxCalculator, compareTreatments } from "@/lib/tax/calculator";
import type { Transaction } from "@/lib/tax/types";
import type { TaxTreatment, CostBasisMethod } from "@/lib/tax/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [rows, settingsRows] = await Promise.all([
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

  // Run tax calculator
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
  // Build dispositions from events for compareTreatments()
  const dispositions = events.flatMap((ev) =>
    ev.lots.map((lot) => ({
      lotId: lot.lotId,
      marketId: ev.transaction.marketId,
      marketTitle: ev.transaction.marketTitle,
      outcome: ev.transaction.outcome,
      quantity: lot.quantity,
      costBasisPerShare: lot.costBasisPerShare,
      proceedsPerShare: lot.proceedsPerShare,
      acquiredAt: lot.acquiredAt,
      disposedAt: lot.disposedAt,
      holdingPeriod: lot.holdingPeriod,
      gainLoss: lot.gainLoss,
      totalCostBasis: lot.costBasisPerShare * lot.quantity,
      totalProceeds: lot.proceedsPerShare * lot.quantity,
    })),
  );

  const comparison = compareTreatments(dispositions, taxYear);

  const totalGain = summary.totalGainLoss;
  const taxComparison = {
    capitalGains: {
      netGain: comparison.capitalGains.totalNet,
      estimatedTax:
        comparison.capitalGains.totalNet > 0
          ? comparison.capitalGains.shortTermNet * 0.37 +
            comparison.capitalGains.longTermNet * 0.2
          : -(
              Math.min(Math.abs(comparison.capitalGains.totalNet), 3000) * 0.37
            ),
      effectiveRate:
        totalGain !== 0
          ? Math.abs(
              (comparison.capitalGains.totalNet > 0
                ? comparison.capitalGains.shortTermNet * 0.37 +
                  comparison.capitalGains.longTermNet * 0.2
                : -(
                    Math.min(
                      Math.abs(comparison.capitalGains.totalNet),
                      3000,
                    ) * 0.37
                  )) / totalGain,
            )
          : 0,
    },
    gambling: {
      netGain: comparison.gambling.netGamblingIncome,
      estimatedTax:
        Math.max(0, comparison.gambling.netGamblingIncome) * 0.37,
      effectiveRate:
        comparison.gambling.grossWinnings > 0
          ? (Math.max(0, comparison.gambling.netGamblingIncome) * 0.37) /
            comparison.gambling.grossWinnings
          : 0,
    },
    business: {
      netGain: comparison.business.netBusinessIncome,
      estimatedTax:
        Math.max(0, comparison.business.netBusinessIncome) * 0.37 +
        comparison.business.selfEmploymentTax,
      effectiveRate:
        comparison.business.grossIncome > 0
          ? (Math.max(0, comparison.business.netBusinessIncome) * 0.37 +
              comparison.business.selfEmploymentTax) /
            comparison.business.grossIncome
          : 0,
    },
  };

  // --- Active Positions ---
  // Replay transactions to find remaining open lots
  const sorted = [...txs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
  const lotTracker = new Map<
    string,
    { qty: number; cost: number; marketTitle: string }[]
  >();

  for (const tx of sorted) {
    const key = `${tx.marketId}:${tx.outcome}`;
    if (tx.type === "BUY") {
      const existing = lotTracker.get(key) ?? [];
      existing.push({
        qty: tx.quantity,
        cost: tx.pricePerShare,
        marketTitle: tx.marketTitle,
      });
      lotTracker.set(key, existing);
    } else {
      const lots = lotTracker.get(key);
      if (!lots || lots.length === 0) continue;
      let remaining = tx.quantity;
      // FIFO disposal
      while (remaining > 0.000001 && lots.length > 0) {
        const lot = lots[0];
        if (lot.qty <= remaining) {
          remaining -= lot.qty;
          lots.shift();
        } else {
          lot.qty -= remaining;
          remaining = 0;
        }
      }
    }
  }

  const activePositions = [...lotTracker.entries()]
    .filter(([, lots]) => lots.length > 0 && lots.some((l) => l.qty > 0.000001))
    .map(([key, lots]) => {
      const [, outcome] = key.split(":");
      const totalQty = lots.reduce((s, l) => s + l.qty, 0);
      const totalCost = lots.reduce((s, l) => s + l.qty * l.cost, 0);
      const avgPrice = totalQty > 0 ? totalCost / totalQty : 0;
      return {
        id: key,
        market: lots[0].marketTitle,
        outcome: outcome as "YES" | "NO",
        qty: Math.round(totalQty * 100) / 100,
        avgPrice: Math.round(avgPrice * 10000) / 10000,
        currentPrice: 0,
        unrealizedPnl: 0,
      };
    });

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
