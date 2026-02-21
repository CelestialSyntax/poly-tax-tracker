import type {
  Transaction,
  TaxLot,
  TaxEvent,
  TaxSummary,
  TaxTreatment,
  CostBasisMethod,
  HoldingPeriod,
  Disposition,
  ScheduleDSummary,
  LegacyScheduleDSummary,
  GamblingIncomeSummary,
  BusinessIncomeSummary,
  TaxReport,
  Form8949Entry,
  Form8949Line,
  TreatmentComparison,
} from "./types";
import {
  disposeLots,
  selectLots,
  getHoldingPeriod,
  calculateGainLoss,
} from "./cost-basis";
import { nanoid } from "nanoid";

// ─── Tax Rate Constants (2026) ──────────────────────────
const MAX_ORDINARY_RATE = 0.37;
const MAX_LTCG_RATE = 0.20;
const SE_TAX_RATE = 0.153;
const SE_TAXABLE_FACTOR = 0.9235; // 92.35% of net income is SE-taxable
const SE_WAGE_BASE = 168600; // 2026 SS wage base
const MEDICARE_RATE = 0.029;
const CAPITAL_LOSS_DEDUCTION_LIMIT = 3000;
const GAMBLING_LOSS_DEDUCTION_RATE = 0.90; // 2026: 90% of losses deductible (One Big Beautiful Bill Act)

// ─── TaxCalculator Class ────────────────────────────────

export class TaxCalculator {
  constructor(
    private treatment: TaxTreatment,
    private costBasisMethod: CostBasisMethod,
    private taxYear: number,
  ) {}

  /**
   * Process all transactions chronologically, return tax events and summary.
   */
  calculate(transactions: Transaction[]): { events: TaxEvent[]; summary: TaxSummary } {
    // Sort transactions chronologically
    const sorted = [...transactions].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const events: TaxEvent[] = [];
    // Track open lots per market+outcome
    const openLotsByKey = new Map<string, TaxLot[]>();

    for (const tx of sorted) {
      // Filter to the relevant tax year for disposals
      const txYear = tx.timestamp.getFullYear();

      if (tx.type === "BUY") {
        const lot = this.createTaxLot(tx);
        const key = `${tx.marketId}:${tx.outcome}`;
        const existing = openLotsByKey.get(key) ?? [];
        existing.push(lot);
        openLotsByKey.set(key, existing);
      } else {
        // SELL, SETTLEMENT, REDEEM
        const key = `${tx.marketId}:${tx.outcome}`;
        const lots = openLotsByKey.get(key) ?? [];

        if (lots.length === 0) {
          // No open lots to dispose -- skip
          continue;
        }

        const event = this.processDisposal(tx, lots);

        // Update the open lots with remaining after disposal
        const disposedLotIds = new Set(event.lots.map((d) => d.lotId));
        const remaining: TaxLot[] = [];

        for (const lot of lots) {
          if (disposedLotIds.has(lot.id)) {
            const disposed = event.lots.find((d) => d.lotId === lot.id);
            if (!disposed) continue;
            const leftover = lot.quantity - disposed.quantity;
            if (leftover > 0.000001) {
              remaining.push({ ...lot, quantity: leftover });
            }
          } else {
            remaining.push(lot);
          }
        }

        openLotsByKey.set(key, remaining);

        // Only include events for the target tax year
        if (txYear === this.taxYear) {
          events.push(event);
        }
      }
    }

    const summary = this.calculateSummary(events);
    return { events, summary };
  }

  /**
   * Create a tax lot from a BUY transaction.
   */
  private createTaxLot(tx: Transaction): TaxLot {
    return {
      id: nanoid(),
      transactionId: tx.id,
      marketId: tx.marketId,
      marketTitle: tx.marketTitle,
      outcome: tx.outcome,
      quantity: tx.quantity,
      originalQuantity: tx.quantity,
      costBasisPerShare: tx.pricePerShare,
      acquiredAt: tx.timestamp,
      holdingPeriod: "short-term", // will be determined at disposal
      isOpen: true,
    };
  }

  /**
   * Process a disposal (SELL, SETTLEMENT, REDEEM).
   */
  private processDisposal(tx: Transaction, openLots: TaxLot[]): TaxEvent {
    const proceedsPerShare =
      tx.type === "SETTLEMENT"
        ? this.getSettlementProceeds(tx)
        : tx.pricePerShare;

    const { disposed } = disposeLots(
      this.costBasisMethod,
      openLots,
      tx.quantity,
      proceedsPerShare,
      tx.timestamp,
    );

    const totalProceeds = disposed.reduce(
      (sum, d) => sum + d.proceedsPerShare * d.quantity,
      0,
    );
    const totalCostBasis = disposed.reduce(
      (sum, d) => sum + d.costBasisPerShare * d.quantity,
      0,
    );
    const totalGainLoss = disposed.reduce((sum, d) => sum + d.gainLoss, 0);

    // Determine aggregate holding period: long-term only if ALL lots are long-term
    const holdingPeriod: HoldingPeriod = disposed.every(
      (d) => d.holdingPeriod === "long-term",
    )
      ? "long-term"
      : "short-term";

    return {
      transaction: tx,
      lots: disposed,
      totalProceeds,
      totalCostBasis,
      totalGainLoss,
      holdingPeriod,
      isSettlement: tx.type === "SETTLEMENT",
    };
  }

  /**
   * For settlements: $1.00 if won (favorable), $0.00 if lost (unfavorable).
   */
  private getSettlementProceeds(tx: Transaction): number {
    // Settlement with price = 1.00 means favorable (won), price = 0.00 means unfavorable (lost)
    return tx.pricePerShare >= 0.5 ? 1.0 : 0.0;
  }

  /**
   * Calculate summary based on treatment mode.
   */
  private calculateSummary(events: TaxEvent[]): TaxSummary {
    let shortTermGains = 0;
    let shortTermLosses = 0;
    let longTermGains = 0;
    let longTermLosses = 0;
    let totalProceeds = 0;
    let totalCostBasis = 0;

    for (const event of events) {
      totalProceeds += event.totalProceeds;
      totalCostBasis += event.totalCostBasis;

      for (const lot of event.lots) {
        if (lot.holdingPeriod === "short-term") {
          if (lot.gainLoss >= 0) shortTermGains += lot.gainLoss;
          else shortTermLosses += Math.abs(lot.gainLoss);
        } else {
          if (lot.gainLoss >= 0) longTermGains += lot.gainLoss;
          else longTermLosses += Math.abs(lot.gainLoss);
        }
      }
    }

    const netShortTerm = shortTermGains - shortTermLosses;
    const netLongTerm = longTermGains - longTermLosses;
    const totalGainLoss = netShortTerm + netLongTerm;

    const baseSummary: TaxSummary = {
      treatment: this.treatment,
      taxYear: this.taxYear,
      totalProceeds,
      totalCostBasis,
      totalGainLoss,
      shortTermGains,
      shortTermLosses,
      longTermGains,
      longTermLosses,
      netShortTerm,
      netLongTerm,
      estimatedTaxLiability: 0,
    };

    switch (this.treatment) {
      case "capital_gains":
        return { ...baseSummary, ...this.calculateCapitalGains(events) };
      case "gambling":
        return { ...baseSummary, ...this.calculateGambling(events) };
      case "business":
        return { ...baseSummary, ...this.calculateBusiness(events) };
    }
  }

  /**
   * Generate Form 8949 entries from tax events.
   * Each disposed lot becomes a line item with columns (a)-(h).
   */
  generateForm8949Entries(events: TaxEvent[]): Form8949Entry[] {
    const entries: Form8949Entry[] = [];

    for (const event of events) {
      for (const lot of event.lots) {
        const proceeds = lot.proceedsPerShare * lot.quantity;
        const costBasis = lot.costBasisPerShare * lot.quantity;

        entries.push({
          // (a) Description of property
          description: `${lot.quantity} ${event.transaction.outcome} - ${event.transaction.marketTitle}`,
          // (b) Date acquired
          dateAcquired: lot.acquiredAt,
          // (c) Date sold or disposed of
          dateSold: lot.disposedAt,
          // (d) Proceeds
          proceeds,
          // (e) Cost or other basis
          costBasis,
          // (f) Adjustments (e.g., wash sales - not applicable here)
          adjustments: 0,
          // (h) Gain or loss: (d) - (e) + (f)
          gainLoss: lot.gainLoss,
          holdingPeriod: lot.holdingPeriod,
          // Polymarket does not issue 1099-B:
          // Box B = short-term, basis NOT reported to IRS
          // Box E = long-term, basis NOT reported to IRS
          box: lot.holdingPeriod === "short-term" ? "B" : "E",
        });
      }
    }

    return entries;
  }

  /**
   * Generate Schedule D summary from tax events.
   * Combines Form 8949 totals into Parts I, II, and III.
   */
  generateScheduleDSummary(
    events: TaxEvent[],
    priorYearCarryforward: number = 0,
  ): ScheduleDSummary {
    let shortTermFromForm8949 = 0;
    let longTermFromForm8949 = 0;

    for (const event of events) {
      for (const lot of event.lots) {
        if (lot.holdingPeriod === "short-term") {
          shortTermFromForm8949 += lot.gainLoss;
        } else {
          longTermFromForm8949 += lot.gainLoss;
        }
      }
    }

    const netShortTermGainLoss = shortTermFromForm8949;
    const netLongTermGainLoss = longTermFromForm8949;
    const netCapitalGainLoss =
      netShortTermGainLoss + netLongTermGainLoss - priorYearCarryforward;

    const capitalLossDeduction =
      netCapitalGainLoss < 0
        ? Math.min(Math.abs(netCapitalGainLoss), CAPITAL_LOSS_DEDUCTION_LIMIT)
        : 0;
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

  /**
   * Capital gains mode: short-term at 37%, long-term at 20%.
   * Loss carryforward and $3,000 annual deduction.
   */
  private calculateCapitalGains(events: TaxEvent[]): Partial<TaxSummary> {
    let netST = 0;
    let netLT = 0;

    for (const event of events) {
      for (const lot of event.lots) {
        if (lot.holdingPeriod === "short-term") netST += lot.gainLoss;
        else netLT += lot.gainLoss;
      }
    }

    const totalNet = netST + netLT;
    let lossCarryforward = 0;
    let netCapitalLossDeduction = 0;
    let estimatedTaxLiability = 0;

    if (totalNet < 0) {
      netCapitalLossDeduction = Math.min(
        Math.abs(totalNet),
        CAPITAL_LOSS_DEDUCTION_LIMIT,
      );
      lossCarryforward = Math.abs(totalNet) - netCapitalLossDeduction;
      // Deduction reduces ordinary income, so tax savings at ordinary rate
      estimatedTaxLiability = -(netCapitalLossDeduction * MAX_ORDINARY_RATE);
    } else {
      // Tax on gains
      const stTax = Math.max(0, netST) * MAX_ORDINARY_RATE;
      const ltTax = Math.max(0, netLT) * MAX_LTCG_RATE;
      estimatedTaxLiability = stTax + ltTax;
    }

    return {
      lossCarryforward,
      netCapitalLossDeduction,
      estimatedTaxLiability,
    };
  }

  /**
   * Gambling mode: gross winnings taxed at ordinary rate.
   * 2026: losses limited to 90% of winnings.
   */
  private calculateGambling(events: TaxEvent[]): Partial<TaxSummary> {
    let grossWinnings = 0;
    let totalLosses = 0;

    for (const event of events) {
      if (event.totalGainLoss > 0) grossWinnings += event.totalGainLoss;
      else totalLosses += Math.abs(event.totalGainLoss);
    }

    const maxDeductible = Math.min(totalLosses, grossWinnings);
    const deductibleLosses = maxDeductible * GAMBLING_LOSS_DEDUCTION_RATE;
    const taxableIncome = grossWinnings - deductibleLosses;
    const estimatedTaxLiability = Math.max(0, taxableIncome) * MAX_ORDINARY_RATE;

    return {
      grossWinnings,
      deductibleLosses,
      estimatedTaxLiability,
    };
  }

  /**
   * Business mode: net income at 37% + SE tax (15.3% on 92.35% of net income).
   */
  private calculateBusiness(events: TaxEvent[]): Partial<TaxSummary> {
    let grossIncome = 0;
    let totalLosses = 0;

    for (const event of events) {
      if (event.totalGainLoss > 0) grossIncome += event.totalGainLoss;
      else totalLosses += Math.abs(event.totalGainLoss);
    }

    const netBusinessIncome = grossIncome - totalLosses;
    let selfEmploymentTax = 0;

    if (netBusinessIncome > 0) {
      const seTaxableIncome = netBusinessIncome * SE_TAXABLE_FACTOR;
      if (seTaxableIncome <= SE_WAGE_BASE) {
        selfEmploymentTax = seTaxableIncome * SE_TAX_RATE;
      } else {
        selfEmploymentTax =
          SE_WAGE_BASE * SE_TAX_RATE +
          (seTaxableIncome - SE_WAGE_BASE) * MEDICARE_RATE;
      }
    }

    const incomeTax = Math.max(0, netBusinessIncome) * MAX_ORDINARY_RATE;
    const estimatedTaxLiability = incomeTax + selfEmploymentTax;

    return {
      selfEmploymentTax,
      netBusinessIncome,
      estimatedTaxLiability,
    };
  }
}

// ─── Legacy Functions (preserved for backward compatibility) ─────

export function calculateCapitalGains(
  dispositions: Disposition[],
): LegacyScheduleDSummary {
  let shortTermGains = 0;
  let shortTermLosses = 0;
  let longTermGains = 0;
  let longTermLosses = 0;

  for (const d of dispositions) {
    if (d.holdingPeriod === "short-term") {
      if (d.gainLoss >= 0) shortTermGains += d.gainLoss;
      else shortTermLosses += Math.abs(d.gainLoss);
    } else {
      if (d.gainLoss >= 0) longTermGains += d.gainLoss;
      else longTermLosses += Math.abs(d.gainLoss);
    }
  }

  const shortTermNet = shortTermGains - shortTermLosses;
  const longTermNet = longTermGains - longTermLosses;
  const totalNet = shortTermNet + longTermNet;

  const capitalLossDeduction =
    totalNet < 0 ? Math.min(Math.abs(totalNet), 3000) : 0;
  const carryforwardLoss =
    totalNet < 0 ? Math.abs(totalNet) - capitalLossDeduction : 0;

  return {
    shortTermGains,
    shortTermLosses,
    shortTermNet,
    longTermGains,
    longTermLosses,
    longTermNet,
    totalNet,
    capitalLossDeduction,
    carryforwardLoss,
  };
}

export function calculateGamblingIncome(
  dispositions: Disposition[],
): GamblingIncomeSummary {
  let grossWinnings = 0;
  let totalLosses = 0;

  for (const d of dispositions) {
    if (d.gainLoss > 0) grossWinnings += d.gainLoss;
    else totalLosses += Math.abs(d.gainLoss);
  }

  const maxDeductible = grossWinnings;
  const lossLimitedByWinnings = Math.min(totalLosses, maxDeductible);
  const deductibleLosses = lossLimitedByWinnings * 0.9;

  return {
    grossWinnings,
    totalLosses,
    deductibleLosses,
    netGamblingIncome: grossWinnings - deductibleLosses,
    requiresItemizing: totalLosses > 0,
  };
}

export function calculateBusinessIncome(
  dispositions: Disposition[],
  additionalExpenses: number = 0,
): BusinessIncomeSummary {
  let grossIncome = 0;
  let tradingLosses = 0;

  for (const d of dispositions) {
    if (d.gainLoss > 0) grossIncome += d.gainLoss;
    else tradingLosses += Math.abs(d.gainLoss);
  }

  const totalExpenses = tradingLosses + additionalExpenses;
  const netBusinessIncome = grossIncome - totalExpenses;

  let selfEmploymentTax = 0;
  if (netBusinessIncome > 0) {
    const seTaxableIncome = netBusinessIncome * SE_TAXABLE_FACTOR;
    if (seTaxableIncome <= SE_WAGE_BASE) {
      selfEmploymentTax = seTaxableIncome * SE_TAX_RATE;
    } else {
      selfEmploymentTax =
        SE_WAGE_BASE * SE_TAX_RATE +
        (seTaxableIncome - SE_WAGE_BASE) * MEDICARE_RATE;
    }
  }

  return {
    grossIncome,
    totalExpenses,
    netBusinessIncome,
    selfEmploymentTax,
    selfEmploymentTaxRate: SE_TAX_RATE,
  };
}

export function generateForm8949Lines(
  dispositions: Disposition[],
): Form8949Line[] {
  return dispositions.map((d) => ({
    description: `${d.quantity} ${d.outcome} shares - ${d.marketTitle}`,
    dateAcquired: d.acquiredAt,
    dateSold: d.disposedAt,
    proceeds: d.totalProceeds,
    costBasis: d.totalCostBasis,
    adjustments: 0,
    gainLoss: d.gainLoss,
    box: d.holdingPeriod === "short-term" ? "B" : ("E" as const),
    holdingPeriod: d.holdingPeriod,
  }));
}

export function processDisposition(
  openLots: TaxLot[],
  marketId: string,
  outcome: string,
  quantity: number,
  proceedsPerShare: number,
  disposedAt: Date,
  method: CostBasisMethod,
  specificLotIds?: string[],
): { dispositions: Disposition[]; updatedLots: TaxLot[] } {
  const marketLots = openLots.filter(
    (l) => l.marketId === marketId && l.outcome === outcome && l.isOpen,
  );

  const selected = selectLots(marketLots, method, quantity, specificLotIds);
  const dispositions: Disposition[] = [];
  const updatedLots = [...openLots];

  for (const { lot, quantityFromLot } of selected) {
    const holdingPeriod = getHoldingPeriod(lot.acquiredAt, disposedAt);
    const gainLoss = calculateGainLoss(
      quantityFromLot,
      lot.costBasisPerShare,
      proceedsPerShare,
    );

    dispositions.push({
      lotId: lot.id,
      marketId: lot.marketId,
      marketTitle: lot.marketTitle,
      outcome: lot.outcome as "YES" | "NO",
      quantity: quantityFromLot,
      costBasisPerShare: lot.costBasisPerShare,
      proceedsPerShare,
      acquiredAt: lot.acquiredAt,
      disposedAt,
      holdingPeriod,
      gainLoss,
      totalCostBasis: lot.costBasisPerShare * quantityFromLot,
      totalProceeds: proceedsPerShare * quantityFromLot,
    });

    const idx = updatedLots.findIndex((l) => l.id === lot.id);
    if (idx !== -1) {
      const remaining = updatedLots[idx].quantity - quantityFromLot;
      if (remaining <= 0.000001) {
        updatedLots[idx] = {
          ...updatedLots[idx],
          quantity: 0,
          isOpen: false,
          disposedAt,
          proceedsPerShare,
          gainLoss,
          holdingPeriod,
        };
      } else {
        updatedLots[idx] = { ...updatedLots[idx], quantity: remaining };
      }
    }
  }

  return { dispositions, updatedLots };
}

export function generateTaxReport(
  userId: string,
  taxYear: number,
  dispositions: Disposition[],
  treatment: TaxTreatment,
  costBasisMethod: CostBasisMethod,
  totalTransactions: number,
  totalVolume: number,
  totalFees: number,
  winCount: number,
  lossCount: number,
  openPositionsCount: number,
  openPositionsValue: number,
): TaxReport {
  const report: TaxReport = {
    userId,
    taxYear,
    treatment,
    costBasisMethod,
    generatedAt: new Date(),
    dispositions,
    totalTransactions,
    totalVolume,
    totalFees,
    winRate: winCount + lossCount > 0 ? winCount / (winCount + lossCount) : 0,
    openPositionsCount,
    openPositionsValue,
  };

  switch (treatment) {
    case "capital_gains":
      report.capitalGains = calculateCapitalGains(dispositions);
      report.form8949Lines = generateForm8949Lines(dispositions);
      break;
    case "gambling":
      report.gambling = calculateGamblingIncome(dispositions);
      break;
    case "business":
      report.business = calculateBusinessIncome(dispositions);
      break;
  }

  return report;
}

export function compareTreatments(
  dispositions: Disposition[],
  taxYear: number,
): TreatmentComparison {
  const capitalGains = calculateCapitalGains(dispositions);
  const gambling = calculateGamblingIncome(dispositions);
  const business = calculateBusinessIncome(dispositions);

  let recommendation: TaxTreatment = "capital_gains";
  let recommendationReason =
    "Capital gains treatment provides loss carryforward and potential long-term rates.";

  if (capitalGains.totalNet < 0) {
    recommendation = "capital_gains";
    recommendationReason =
      "Net losses are best handled under capital gains treatment with $3,000 annual deduction and unlimited carryforward.";
  } else if (
    business.netBusinessIncome > 0 &&
    business.netBusinessIncome - business.selfEmploymentTax <
      capitalGains.totalNet
  ) {
    recommendation = "capital_gains";
    recommendationReason =
      "Capital gains treatment avoids the 15.3% self-employment tax.";
  } else if (gambling.netGamblingIncome < capitalGains.totalNet) {
    recommendation = "gambling";
    recommendationReason =
      "Gambling treatment results in lower taxable income for this year.";
  }

  return {
    taxYear,
    capitalGains,
    gambling,
    business,
    recommendation,
    recommendationReason,
  };
}
