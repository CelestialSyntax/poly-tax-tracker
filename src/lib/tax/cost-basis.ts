import type { TaxLot, CostBasisMethod, HoldingPeriod, DisposedLot } from "./types";
import { differenceInDays } from "date-fns";

/**
 * Determine holding period for a disposition.
 */
export function determineHoldingPeriod(
  acquiredAt: Date,
  disposedAt: Date,
): HoldingPeriod {
  const days = differenceInDays(disposedAt, acquiredAt);
  return days > 365 ? "long-term" : "short-term";
}

// Re-export under legacy name for backward compat
export const getHoldingPeriod = determineHoldingPeriod;

/**
 * Calculate gain/loss for a disposition.
 */
export function calculateGainLoss(
  quantity: number,
  costBasisPerShare: number,
  proceedsPerShare: number,
): number {
  return (proceedsPerShare - costBasisPerShare) * quantity;
}

/**
 * Calculate weighted average cost basis for open lots.
 */
export function weightedAverageCostBasis(lots: TaxLot[]): number {
  if (lots.length === 0) return 0;
  const totalCost = lots.reduce(
    (sum, lot) => sum + lot.costBasisPerShare * lot.quantity,
    0,
  );
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
}

/**
 * Select lots to dispose using the given cost basis method.
 * Returns lots in the order they should be consumed, with quantities to dispose.
 */
export function selectLots(
  openLots: TaxLot[],
  method: CostBasisMethod,
  quantityToDispose: number,
  specificLotIds?: string[],
): { lot: TaxLot; quantityFromLot: number }[] {
  let sortedLots: TaxLot[];

  switch (method) {
    case "fifo":
      sortedLots = [...openLots].sort(
        (a, b) => a.acquiredAt.getTime() - b.acquiredAt.getTime(),
      );
      break;
    case "lifo":
      sortedLots = [...openLots].sort(
        (a, b) => b.acquiredAt.getTime() - a.acquiredAt.getTime(),
      );
      break;
    case "specific_id":
      if (!specificLotIds?.length) {
        throw new Error("Specific lot IDs required for specific_id method");
      }
      sortedLots = specificLotIds
        .map((id) => openLots.find((l) => l.id === id))
        .filter((l): l is TaxLot => l !== undefined);
      break;
  }

  const result: { lot: TaxLot; quantityFromLot: number }[] = [];
  let remaining = quantityToDispose;

  for (const lot of sortedLots) {
    if (remaining <= 0) break;
    const available = lot.quantity;
    const take = Math.min(available, remaining);
    result.push({ lot, quantityFromLot: take });
    remaining -= take;
  }

  if (remaining > 0.000001) {
    throw new Error(
      `Insufficient lots: need ${quantityToDispose}, found ${quantityToDispose - remaining}`,
    );
  }

  return result;
}

// ─── Disposal functions (return DisposedLot[] + updated lots) ────

function applyDisposal(
  sortedLots: TaxLot[],
  quantity: number,
  proceedsPerShare: number,
  disposedAt: Date,
): { disposed: DisposedLot[]; remainingLots: TaxLot[] } {
  const disposed: DisposedLot[] = [];
  const remainingLots: TaxLot[] = [];
  let remaining = quantity;

  for (const lot of sortedLots) {
    if (remaining <= 0) {
      remainingLots.push(lot);
      continue;
    }

    const take = Math.min(lot.quantity, remaining);
    const holdingPeriod = determineHoldingPeriod(lot.acquiredAt, disposedAt);
    const gainLoss = calculateGainLoss(take, lot.costBasisPerShare, proceedsPerShare);

    disposed.push({
      lotId: lot.id,
      quantity: take,
      costBasisPerShare: lot.costBasisPerShare,
      proceedsPerShare,
      gainLoss,
      holdingPeriod,
      acquiredAt: lot.acquiredAt,
      disposedAt,
    });

    remaining -= take;
    const leftover = lot.quantity - take;

    if (leftover > 0.000001) {
      // Partial disposal: lot remains open with reduced quantity
      remainingLots.push({ ...lot, quantity: leftover });
    }
    // If fully consumed, the lot is not added to remainingLots
  }

  if (remaining > 0.000001) {
    throw new Error(
      `Insufficient lots: need ${quantity}, found ${quantity - remaining}`,
    );
  }

  return { disposed, remainingLots };
}

/**
 * FIFO: dispose oldest lots first
 */
export function disposeFIFO(
  openLots: TaxLot[],
  quantity: number,
  proceedsPerShare: number,
  disposedAt: Date,
): { disposed: DisposedLot[]; remainingLots: TaxLot[] } {
  const sorted = [...openLots].sort(
    (a, b) => a.acquiredAt.getTime() - b.acquiredAt.getTime(),
  );
  return applyDisposal(sorted, quantity, proceedsPerShare, disposedAt);
}

/**
 * LIFO: dispose newest lots first
 */
export function disposeLIFO(
  openLots: TaxLot[],
  quantity: number,
  proceedsPerShare: number,
  disposedAt: Date,
): { disposed: DisposedLot[]; remainingLots: TaxLot[] } {
  const sorted = [...openLots].sort(
    (a, b) => b.acquiredAt.getTime() - a.acquiredAt.getTime(),
  );
  return applyDisposal(sorted, quantity, proceedsPerShare, disposedAt);
}

/**
 * Specific ID: dispose specified lots in the given order
 */
export function disposeSpecificId(
  openLots: TaxLot[],
  specificLotIds: string[],
  quantity: number,
  proceedsPerShare: number,
  disposedAt: Date,
): { disposed: DisposedLot[]; remainingLots: TaxLot[] } {
  if (!specificLotIds.length) {
    throw new Error("Specific lot IDs required for specific_id method");
  }

  // Order lots by the specified IDs, then append any not listed
  const specified = specificLotIds
    .map((id) => openLots.find((l) => l.id === id))
    .filter((l): l is TaxLot => l !== undefined);
  const unspecified = openLots.filter((l) => !specificLotIds.includes(l.id));
  const sorted = [...specified, ...unspecified];

  return applyDisposal(sorted, quantity, proceedsPerShare, disposedAt);
}

/**
 * Dispatch to the correct disposal method.
 */
export function disposeLots(
  method: CostBasisMethod,
  openLots: TaxLot[],
  quantity: number,
  proceedsPerShare: number,
  disposedAt: Date,
  specificLotIds?: string[],
): { disposed: DisposedLot[]; remainingLots: TaxLot[] } {
  switch (method) {
    case "fifo":
      return disposeFIFO(openLots, quantity, proceedsPerShare, disposedAt);
    case "lifo":
      return disposeLIFO(openLots, quantity, proceedsPerShare, disposedAt);
    case "specific_id":
      return disposeSpecificId(
        openLots,
        specificLotIds ?? [],
        quantity,
        proceedsPerShare,
        disposedAt,
      );
  }
}
