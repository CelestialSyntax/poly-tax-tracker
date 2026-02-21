import type {
  Form8949Line,
  LegacyScheduleDSummary,
  TaxEvent,
  Form8949Entry,
  ScheduleDSummary,
} from "./types";
import { format } from "date-fns";

// ─── New Form Generation Functions ──────────────────────

/**
 * Generate Form 8949 entries from tax events.
 * Each disposed lot becomes a separate line item.
 *
 * Box assignments (no 1099-B from Polymarket, so basis not reported to IRS):
 *   - Box B: short-term, basis NOT reported to IRS
 *   - Box E: long-term, basis NOT reported to IRS
 */
export function generateForm8949Entries(events: TaxEvent[]): Form8949Entry[] {
  const entries: Form8949Entry[] = [];

  for (const event of events) {
    for (const lot of event.lots) {
      const proceeds = lot.proceedsPerShare * lot.quantity;
      const costBasis = lot.costBasisPerShare * lot.quantity;

      entries.push({
        description: `${lot.quantity} ${event.transaction.outcome} shares - ${event.transaction.marketTitle}`,
        dateAcquired: lot.acquiredAt,
        dateSold: lot.disposedAt,
        proceeds,
        costBasis,
        adjustments: 0,
        gainLoss: lot.gainLoss,
        holdingPeriod: lot.holdingPeriod,
        box: lot.holdingPeriod === "short-term" ? "B" : "E",
      });
    }
  }

  return entries;
}

/**
 * Generate Schedule D summary from Form 8949 entries.
 * Aggregates all entries into short-term and long-term totals.
 */
export function generateScheduleD(entries: Form8949Entry[]): ScheduleDSummary {
  let shortTermFromForm8949 = 0;
  let longTermFromForm8949 = 0;

  for (const entry of entries) {
    if (entry.holdingPeriod === "short-term") {
      shortTermFromForm8949 += entry.gainLoss;
    } else {
      longTermFromForm8949 += entry.gainLoss;
    }
  }

  const netShortTermGainLoss = shortTermFromForm8949;
  const netLongTermGainLoss = longTermFromForm8949;
  const netCapitalGainLoss = netShortTermGainLoss + netLongTermGainLoss;

  const capitalLossDeduction =
    netCapitalGainLoss < 0 ? Math.min(Math.abs(netCapitalGainLoss), 3000) : 0;

  const lossCarryforwardToNextYear =
    netCapitalGainLoss < 0
      ? Math.abs(netCapitalGainLoss) - capitalLossDeduction
      : 0;

  return {
    shortTermFromForm8949,
    longTermFromForm8949,
    netShortTermGainLoss,
    netLongTermGainLoss,
    netCapitalGainLoss,
    capitalLossDeduction,
    lossCarryforwardToNextYear,
  };
}

// ─── Form 8949 Entry Formatting (new types) ─────────────

/**
 * Format a Form 8949 entry for display/export, with IRS column labels.
 */
export function formatForm8949Entry(entry: Form8949Entry) {
  return {
    a_description: entry.description,
    b_dateAcquired: format(entry.dateAcquired, "MM/dd/yyyy"),
    c_dateSold: format(entry.dateSold, "MM/dd/yyyy"),
    d_proceeds: entry.proceeds.toFixed(2),
    e_costBasis: entry.costBasis.toFixed(2),
    f_adjustments: entry.adjustments.toFixed(2),
    g_code: "",
    h_gainLoss: entry.gainLoss.toFixed(2),
    box: entry.box,
  };
}

/**
 * Group Form 8949 entries by box type for IRS filing.
 */
export function groupEntriesByBox(entries: Form8949Entry[]) {
  return {
    boxA: entries.filter((e) => e.box === "A"),
    boxB: entries.filter((e) => e.box === "B"),
    boxC: entries.filter((e) => e.box === "C"),
    boxD: entries.filter((e) => e.box === "D"),
    boxE: entries.filter((e) => e.box === "E"),
    boxF: entries.filter((e) => e.box === "F"),
  };
}

/**
 * Calculate totals for each Form 8949 box group.
 */
export function calculateBoxTotals(entries: Form8949Entry[]) {
  const groups = groupEntriesByBox(entries);
  const sumGroup = (group: Form8949Entry[]) => ({
    totalProceeds: group.reduce((sum, e) => sum + e.proceeds, 0),
    totalCostBasis: group.reduce((sum, e) => sum + e.costBasis, 0),
    totalAdjustments: group.reduce((sum, e) => sum + e.adjustments, 0),
    totalGainLoss: group.reduce((sum, e) => sum + e.gainLoss, 0),
    count: group.length,
  });

  return {
    boxA: sumGroup(groups.boxA),
    boxB: sumGroup(groups.boxB),
    boxC: sumGroup(groups.boxC),
    boxD: sumGroup(groups.boxD),
    boxE: sumGroup(groups.boxE),
    boxF: sumGroup(groups.boxF),
  };
}

/**
 * Format Schedule D summary for display, mapped to IRS line numbers.
 */
export function formatScheduleDSummary(summary: ScheduleDSummary) {
  return {
    // Part I - Short-Term Capital Gains and Losses
    line1b: summary.shortTermFromForm8949.toFixed(2),
    line7: summary.netShortTermGainLoss.toFixed(2),
    // Part II - Long-Term Capital Gains and Losses
    line8b: summary.longTermFromForm8949.toFixed(2),
    line15: summary.netLongTermGainLoss.toFixed(2),
    // Part III - Summary
    line16: summary.netCapitalGainLoss.toFixed(2),
    line21:
      summary.capitalLossDeduction > 0
        ? (-summary.capitalLossDeduction).toFixed(2)
        : "0.00",
    hasCarryforward: summary.lossCarryforwardToNextYear > 0,
    carryforwardAmount: summary.lossCarryforwardToNextYear.toFixed(2),
  };
}

// ─── Legacy Form Formatting Functions ───────────────────

/**
 * Format Form 8949 line for display/export.
 */
export function formatForm8949Line(line: Form8949Line) {
  return {
    description: line.description,
    dateAcquired: format(line.dateAcquired, "MM/dd/yyyy"),
    dateSold: format(line.dateSold, "MM/dd/yyyy"),
    proceeds: line.proceeds.toFixed(2),
    costBasis: line.costBasis.toFixed(2),
    adjustments: line.adjustments.toFixed(2),
    gainLoss: line.gainLoss.toFixed(2),
    box: line.box,
  };
}

/**
 * Group Form 8949 lines by box type for IRS filing.
 */
export function groupByBox(lines: Form8949Line[]) {
  return {
    boxA: lines.filter((l) => l.box === "A"),
    boxB: lines.filter((l) => l.box === "B"),
    boxC: lines.filter((l) => l.box === "C"),
    boxD: lines.filter((l) => l.box === "D"),
    boxE: lines.filter((l) => l.box === "E"),
    boxF: lines.filter((l) => l.box === "F"),
  };
}

/**
 * Format Schedule D summary for display (legacy type).
 */
export function formatScheduleD(summary: LegacyScheduleDSummary) {
  return {
    // Part I - Short-Term
    line1b: summary.shortTermNet.toFixed(2),
    // Part II - Long-Term
    line8b: summary.longTermNet.toFixed(2),
    // Part III - Summary
    line16: summary.totalNet.toFixed(2),
    line21:
      summary.capitalLossDeduction > 0
        ? (-summary.capitalLossDeduction).toFixed(2)
        : "0.00",
    hasCarryforward: summary.carryforwardLoss > 0,
    carryforwardAmount: summary.carryforwardLoss.toFixed(2),
  };
}

/**
 * IRS disclaimer text for generated reports.
 */
export const TAX_DISCLAIMER = `
IMPORTANT DISCLAIMER: The IRS has not issued specific guidance on the tax treatment
of prediction market event contracts. This report is generated based on one of three
possible interpretations of tax law. Consult a qualified tax professional before
filing. This software is not a substitute for professional tax advice.

Polymarket does not issue 1099 forms. All income from Polymarket must be self-reported.
Polymarket operates through a non-US entity. Depending on account balances, you may have
FBAR (FinCEN 114) and/or FATCA (Form 8938) filing obligations.
`.trim();
