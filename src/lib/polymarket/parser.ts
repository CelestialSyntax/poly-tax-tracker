import type {
  PolymarketTrade,
  PolymarketMarket,
  DataApiActivity,
  NormalizedTransaction,
} from "./types";

/**
 * Detect if a trade represents a settlement (market resolved, price is 0 or 1).
 */
function isSettlement(trade: PolymarketTrade): boolean {
  const price = parseFloat(trade.price);
  return (
    trade.status === "MATCHED" &&
    (price === 0 || price === 1) &&
    trade.side === "SELL"
  );
}

/**
 * Normalize outcome string to uppercase YES/NO.
 */
function normalizeOutcome(raw: string): "YES" | "NO" {
  const upper = raw.toUpperCase().trim();
  if (upper === "YES" || upper === "NO") return upper;
  return "YES";
}

/**
 * Transform Polymarket API trades into normalized transaction format.
 */
export function normalizeTrades(
  trades: PolymarketTrade[],
  markets: Map<string, PolymarketMarket>
): NormalizedTransaction[] {
  return trades
    .map((trade) => {
      const market = markets.get(trade.market);
      const quantity = parseFloat(trade.size);
      const price = parseFloat(trade.price);
      const feeRate = parseFloat(trade.fee_rate_bps) / 10000;
      const totalAmount = quantity * price;
      const fee = totalAmount * feeRate;

      const marketResolved = market?.resolved ?? market?.closed ?? false;

      let type: NormalizedTransaction["type"] = trade.side;
      if (isSettlement(trade) || (marketResolved && trade.side === "SELL")) {
        type = "SETTLEMENT";
      }

      return {
        marketId: trade.market,
        marketTitle: market?.question ?? `Market ${trade.market.slice(0, 8)}...`,
        outcome: normalizeOutcome(trade.outcome),
        type,
        quantity,
        pricePerShare: price,
        totalAmount,
        fee,
        transactionHash: trade.transaction_hash,
        timestamp: new Date(trade.match_time),
      };
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Legacy alias used by transactions/import route.
 */
export function normalizePolymarketTrades(
  trades: PolymarketTrade[],
  marketTitles: Map<string, string>,
  resolvedMarkets?: Map<string, PolymarketMarket>
): NormalizedTransaction[] {
  const quantity = (trade: PolymarketTrade) => parseFloat(trade.size);
  const price = (trade: PolymarketTrade) => parseFloat(trade.price);
  const feeRate = (trade: PolymarketTrade) =>
    parseFloat(trade.fee_rate_bps) / 10000;

  return trades.map((trade) => {
    const q = quantity(trade);
    const p = price(trade);
    const fr = feeRate(trade);
    const totalAmount = q * p;
    const fee = totalAmount * fr;

    const market = resolvedMarkets?.get(trade.market);
    const marketResolved = market?.resolved ?? market?.closed ?? false;

    let type: NormalizedTransaction["type"] = trade.side;
    if (isSettlement(trade) || (marketResolved && trade.side === "SELL")) {
      type = "SETTLEMENT";
    }

    return {
      marketId: trade.market,
      marketTitle: marketTitles.get(trade.market) ?? trade.market,
      outcome: normalizeOutcome(trade.outcome),
      type,
      quantity: q,
      pricePerShare: p,
      totalAmount,
      fee,
      transactionHash: trade.transaction_hash,
      timestamp: new Date(trade.timestamp),
      importSource: "api" as const,
    };
  });
}

/**
 * Transform Polymarket Data API activity records into normalized transactions.
 * Filters out incomplete TRADE records (missing side) and sorts by timestamp.
 */
export function normalizeDataApiActivity(
  activities: DataApiActivity[]
): NormalizedTransaction[] {
  return activities
    .filter((a) => !(a.type === "TRADE" && !a.side))
    .map((a) => {
      const outcome: "YES" | "NO" =
        a.outcomeIndex === 0
          ? "YES"
          : a.outcomeIndex === 1
            ? "NO"
            : normalizeOutcome(a.outcome);

      const type: NormalizedTransaction["type"] =
        a.type === "REDEEM" ? "REDEEM" : (a.side as "BUY" | "SELL");

      return {
        marketId: a.conditionId,
        marketTitle: a.title,
        outcome,
        type,
        quantity: a.size,
        pricePerShare: a.price,
        totalAmount: a.usdcSize,
        fee: 0,
        transactionHash: a.transactionHash,
        timestamp: new Date(a.timestamp * 1000),
        importSource: "api" as const,
      };
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Parse CSV data into normalized transactions.
 * Handles flexible column mapping.
 */
export function parseCSVToTransactions(
  rows: Record<string, string>[],
  columnMap: CSVColumnMap
): NormalizedTransaction[] {
  return rows
    .map((row) => {
      const q = parseFloat(row[columnMap.quantity] ?? "0");
      const p = parseFloat(row[columnMap.pricePerShare] ?? "0");
      const totalAmount = columnMap.totalAmount
        ? parseFloat(row[columnMap.totalAmount] ?? "0")
        : q * p;
      const fee = columnMap.fee
        ? parseFloat(row[columnMap.fee] ?? "0")
        : 0;

      return {
        marketId: row[columnMap.marketId] ?? "",
        marketTitle: row[columnMap.marketTitle] ?? row[columnMap.marketId] ?? "",
        outcome: (row[columnMap.outcome]?.toUpperCase() ?? "YES") as
          | "YES"
          | "NO",
        type: (row[columnMap.type]?.toUpperCase() ?? "BUY") as
          | "BUY"
          | "SELL"
          | "SETTLEMENT"
          | "REDEEM",
        quantity: q,
        pricePerShare: p,
        totalAmount,
        fee,
        transactionHash: columnMap.transactionHash
          ? row[columnMap.transactionHash] ?? null
          : null,
        timestamp: new Date(row[columnMap.timestamp] ?? ""),
        importSource: "csv" as const,
      };
    })
    .filter((tx) => tx.quantity > 0 && !isNaN(tx.timestamp.getTime()));
}

export interface CSVColumnMap {
  marketId: string;
  marketTitle: string;
  outcome: string;
  type: string;
  quantity: string;
  pricePerShare: string;
  totalAmount?: string;
  fee?: string;
  transactionHash?: string;
  timestamp: string;
}

/**
 * Auto-detect CSV column mapping from headers.
 */
export function detectCSVColumns(headers: string[]): Partial<CSVColumnMap> {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const map: Partial<CSVColumnMap> = {};

  const findCol = (keywords: string[]) =>
    headers[
      lower.findIndex((h) => keywords.some((k) => h.includes(k)))
    ] ?? undefined;

  map.marketId = findCol(["market_id", "marketid", "market id", "condition_id"]);
  map.marketTitle = findCol(["market_title", "markettitle", "title", "question", "market"]);
  map.outcome = findCol(["outcome", "side_outcome"]);
  map.type = findCol(["type", "side", "action", "trade_type"]);
  map.quantity = findCol(["quantity", "size", "amount", "shares"]);
  map.pricePerShare = findCol(["price", "price_per_share", "pricepershare", "avg_price"]);
  map.totalAmount = findCol(["total", "total_amount", "totalamount", "value"]);
  map.fee = findCol(["fee", "fees", "commission"]);
  map.transactionHash = findCol(["hash", "transaction_hash", "tx_hash", "txhash"]);
  map.timestamp = findCol(["timestamp", "date", "time", "created_at", "trade_date"]);

  return map;
}
