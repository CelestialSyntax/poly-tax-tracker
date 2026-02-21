// ─── Tax Treatment Modes ────────────────────────────────
export type TaxTreatment = "capital_gains" | "gambling" | "business";
export type CostBasisMethod = "fifo" | "lifo" | "specific_id";
export type HoldingPeriod = "short-term" | "long-term";
export type TransactionType = "BUY" | "SELL" | "SETTLEMENT" | "REDEEM";
export type Outcome = "YES" | "NO";

// ─── Tax Lot ────────────────────────────────────────────
export interface TaxLot {
  id: string;
  transactionId: string;
  marketId: string;
  marketTitle: string;
  outcome: Outcome;
  quantity: number;
  originalQuantity: number;
  costBasisPerShare: number;
  acquiredAt: Date;
  disposedAt?: Date;
  proceedsPerShare?: number;
  gainLoss?: number;
  holdingPeriod: HoldingPeriod;
  isOpen: boolean;
}

// ─── Transaction ────────────────────────────────────────
export interface Transaction {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: Outcome;
  type: TransactionType;
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  fee: number;
  timestamp: Date;
}

// ─── Disposed Lot (individual lot portion in a disposal) ─
export interface DisposedLot {
  lotId: string;
  quantity: number;
  costBasisPerShare: number;
  proceedsPerShare: number;
  gainLoss: number;
  holdingPeriod: HoldingPeriod;
  acquiredAt: Date;
  disposedAt: Date;
}

// ─── Tax Event (a disposal transaction with its lots) ────
export interface TaxEvent {
  transaction: Transaction;
  lots: DisposedLot[];
  totalProceeds: number;
  totalCostBasis: number;
  totalGainLoss: number;
  holdingPeriod: HoldingPeriod;
  isSettlement: boolean;
}

// ─── Tax Summary ────────────────────────────────────────
export interface TaxSummary {
  treatment: TaxTreatment;
  taxYear: number;
  totalProceeds: number;
  totalCostBasis: number;
  totalGainLoss: number;
  shortTermGains: number;
  shortTermLosses: number;
  longTermGains: number;
  longTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  // Capital gains specific
  lossCarryforward?: number;
  netCapitalLossDeduction?: number; // max $3,000
  // Gambling specific
  grossWinnings?: number;
  deductibleLosses?: number; // 90% limit for 2026
  // Business specific
  selfEmploymentTax?: number; // 15.3%
  netBusinessIncome?: number;
  estimatedTaxLiability: number;
}

// ─── Form 8949 Entry ────────────────────────────────────
export interface Form8949Entry {
  description: string; // market title + outcome
  dateAcquired: Date;
  dateSold: Date;
  proceeds: number;
  costBasis: number;
  adjustments: number;
  gainLoss: number;
  holdingPeriod: HoldingPeriod;
  box: "A" | "B" | "C" | "D" | "E" | "F"; // Form 8949 box
}

// ─── Schedule D Summary ─────────────────────────────────
export interface ScheduleDSummary {
  shortTermFromForm8949: number;
  longTermFromForm8949: number;
  netShortTermGainLoss: number;
  netLongTermGainLoss: number;
  netCapitalGainLoss: number;
  capitalLossDeduction: number;
  lossCarryforwardToNextYear: number;
}

// ─── Legacy types (used by existing report/comparison) ──

export interface Disposition {
  lotId: string;
  marketId: string;
  marketTitle: string;
  outcome: Outcome;
  quantity: number;
  costBasisPerShare: number;
  proceedsPerShare: number;
  acquiredAt: Date;
  disposedAt: Date;
  holdingPeriod: HoldingPeriod;
  gainLoss: number;
  totalCostBasis: number;
  totalProceeds: number;
}

export interface Form8949Line {
  description: string;
  dateAcquired: Date;
  dateSold: Date;
  proceeds: number;
  costBasis: number;
  adjustments: number;
  gainLoss: number;
  box: "A" | "B" | "C" | "D" | "E" | "F";
  holdingPeriod: HoldingPeriod;
}

export interface LegacyScheduleDSummary {
  shortTermGains: number;
  shortTermLosses: number;
  shortTermNet: number;
  longTermGains: number;
  longTermLosses: number;
  longTermNet: number;
  totalNet: number;
  capitalLossDeduction: number;
  carryforwardLoss: number;
}

export interface GamblingIncomeSummary {
  grossWinnings: number;
  totalLosses: number;
  deductibleLosses: number;
  netGamblingIncome: number;
  requiresItemizing: boolean;
}

export interface BusinessIncomeSummary {
  grossIncome: number;
  totalExpenses: number;
  netBusinessIncome: number;
  selfEmploymentTax: number;
  selfEmploymentTaxRate: number;
}

export interface TaxReport {
  userId: string;
  taxYear: number;
  treatment: TaxTreatment;
  costBasisMethod: CostBasisMethod;
  generatedAt: Date;
  dispositions: Disposition[];
  capitalGains?: LegacyScheduleDSummary;
  gambling?: GamblingIncomeSummary;
  business?: BusinessIncomeSummary;
  form8949Lines?: Form8949Line[];
  totalTransactions: number;
  totalVolume: number;
  totalFees: number;
  winRate: number;
  openPositionsCount: number;
  openPositionsValue: number;
}

export interface TreatmentComparison {
  taxYear: number;
  capitalGains: LegacyScheduleDSummary;
  gambling: GamblingIncomeSummary;
  business: BusinessIncomeSummary;
  recommendation: TaxTreatment;
  recommendationReason: string;
}
