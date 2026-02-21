// ─── Polymarket CLOB API Types ──────────────────────────

export interface PolymarketTrade {
  id: string;
  taker_order_id: string;
  market: string;           // condition ID
  asset_id: string;         // token ID
  side: "BUY" | "SELL";
  size: string;             // quantity as string
  price: string;            // price as string
  status: string;
  match_time: string;       // ISO timestamp
  last_update: string;
  outcome: string;          // "Yes" | "No"
  fee_rate_bps: string;
  trader_side: "TAKER" | "MAKER";
  transaction_hash: string;
  bucket_index: number;
  owner: string;            // wallet address
  type: "TRADE";
  timestamp: string;
}

export interface PolymarketTradesResponse {
  data: PolymarketTrade[];
  next_cursor?: string;
  limit: number;
  count: number;
}

export interface PolymarketMarket {
  condition_id: string;
  question_id: string;
  tokens: PolymarketToken[];
  question: string;
  description: string;
  market_slug: string;
  end_date_iso: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  accepting_orders: boolean;
  minimum_order_size?: string;
  minimum_tick_size?: string;
}

export interface PolymarketToken {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface PolymarketOrder {
  id: string;
  market: string;
  asset_id: string;
  side: "BUY" | "SELL";
  original_size: string;
  size_matched: string;
  price: string;
  outcome: string;
  timestamp: string;
  status: string;
  fee_rate_bps: string;
  type: string;
  associate_trades: PolymarketTrade[];
}

export interface PolymarketPosition {
  asset: {
    id: string;
    condition_id: string;
  };
  market: string;
  outcome: string;
  size: string;
  avgPrice: string;
  currentPrice: string;
  pnl: string;
  realizedPnl: string;
  curVal: string;
  percentPnl: string;
}

// ─── Normalized Transaction (from any source) ───────────

export interface NormalizedTransaction {
  marketId: string;
  marketTitle: string;
  outcome: "YES" | "NO";
  type: "BUY" | "SELL" | "SETTLEMENT" | "REDEEM";
  quantity: number;
  pricePerShare: number;
  totalAmount: number;
  fee: number;
  transactionHash: string | null;
  timestamp: Date;
  importSource?: "api" | "csv" | "manual" | "bot";
}
