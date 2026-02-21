import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { transactions, taxLots } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import {
  generateTaxReport,
  compareTreatments,
  processDisposition,
} from "@/lib/tax/calculator";
import { generateExcelReport } from "@/lib/export/excel";
import { generatePdfReport } from "@/lib/export/pdf";
import { generateWordReport } from "@/lib/export/word";
import type {
  TaxTreatment,
  CostBasisMethod,
  Disposition,
  TaxLot,
} from "@/lib/tax/types";

/**
 * POST /api/reports/generate
 * Generate a tax report for a given year and treatment.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const taxYear: number = body.taxYear ?? new Date().getFullYear();
  const treatment: TaxTreatment = body.treatment ?? "capital_gains";
  const costBasisMethod: CostBasisMethod = body.costBasisMethod ?? "fifo";
  const compare: boolean = body.compare ?? false;

  const yearStart = new Date(`${taxYear}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${taxYear}-12-31T23:59:59Z`);

  // Get all transactions for the year
  const yearTxs = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, session.user.id),
        gte(transactions.timestamp, yearStart),
        lte(transactions.timestamp, yearEnd)
      )
    )
    .orderBy(transactions.timestamp);

  // Get all tax lots (open + previously created)
  const allLots = await db
    .select()
    .from(taxLots)
    .where(eq(taxLots.userId, session.user.id));

  // Convert DB lots to TaxLot type
  let workingLots: TaxLot[] = allLots.map((l) => ({
    id: l.id,
    transactionId: l.transactionId,
    marketId: l.marketId,
    marketTitle: "",
    outcome: l.outcome as "YES" | "NO",
    quantity: parseFloat(l.quantity),
    originalQuantity: parseFloat(l.originalQuantity),
    costBasisPerShare: parseFloat(l.costBasisPerShare),
    acquiredAt: l.acquiredAt,
    disposedAt: l.disposedAt ?? undefined,
    proceedsPerShare: l.proceedsPerShare
      ? parseFloat(l.proceedsPerShare)
      : undefined,
    gainLoss: l.gainLoss ? parseFloat(l.gainLoss) : undefined,
    holdingPeriod: (l.holdingPeriod as "short-term" | "long-term") ?? "short-term",
    isOpen: l.isOpen,
  }));

  const dispositions: Disposition[] = [];
  let totalVolume = 0;
  let totalFees = 0;
  let winCount = 0;
  let lossCount = 0;

  // Process each transaction
  for (const tx of yearTxs) {
    const qty = parseFloat(tx.quantity);
    const price = parseFloat(tx.pricePerShare);
    const fee = parseFloat(tx.fee);
    totalVolume += parseFloat(tx.totalAmount);
    totalFees += fee;

    if (tx.type === "BUY") {
      // Create a new tax lot
      workingLots.push({
        id: `temp-${tx.id}`,
        transactionId: tx.id,
        marketId: tx.marketId,
        marketTitle: tx.marketTitle,
        outcome: tx.outcome as "YES" | "NO",
        quantity: qty,
        originalQuantity: qty,
        costBasisPerShare: price,
        acquiredAt: tx.timestamp,
        holdingPeriod: "short-term",
        isOpen: true,
      });
    } else if (
      tx.type === "SELL" ||
      tx.type === "SETTLEMENT" ||
      tx.type === "REDEEM"
    ) {
      const proceedsPerShare =
        tx.type === "SETTLEMENT"
          ? 1.0 // Winning settlement
          : tx.type === "REDEEM"
            ? 0.0 // Losing settlement (redeem)
            : price;

      try {
        const result = processDisposition(
          workingLots,
          tx.marketId,
          tx.outcome,
          qty,
          proceedsPerShare,
          tx.timestamp,
          costBasisMethod
        );
        dispositions.push(...result.dispositions);
        workingLots = result.updatedLots;

        for (const d of result.dispositions) {
          if (d.gainLoss >= 0) winCount++;
          else lossCount++;
        }
      } catch {
        // Skip if insufficient lots (data inconsistency)
      }
    }
  }

  const openLots = workingLots.filter((l) => l.isOpen);

  const report = generateTaxReport(
    session.user.id,
    taxYear,
    dispositions,
    treatment,
    costBasisMethod,
    yearTxs.length,
    totalVolume,
    totalFees,
    winCount,
    lossCount,
    openLots.length,
    openLots.reduce((sum, l) => sum + l.quantity * l.costBasisPerShare, 0)
  );

  if (compare) {
    const comparison = compareTreatments(dispositions, taxYear);
    return NextResponse.json({ report, comparison });
  }

  // Handle file exports
  const exportFormat = body.format as string | undefined;
  if (exportFormat === "excel") {
    const buffer = await generateExcelReport(report);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="polytax-report-${taxYear}.xlsx"`,
      },
    });
  }
  if (exportFormat === "pdf") {
    const buffer = await generatePdfReport(report);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="polytax-report-${taxYear}.pdf"`,
      },
    });
  }
  if (exportFormat === "word") {
    const buffer = await generateWordReport(report);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="polytax-report-${taxYear}.docx"`,
      },
    });
  }

  return NextResponse.json({ report });
}
