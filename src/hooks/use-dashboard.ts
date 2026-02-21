export interface DashboardStats {
  totalTrades: number;
  netPnl: number;
  estimatedTax: number;
  winRate: number;
  pnlChange: number;
  tradesChange: number;
  taxChange: number;
  winRateChange: number;
}

export interface PnlHistoryItem {
  month: string;
  pnl: number;
  cumulative: number;
}

export interface RecentTrade {
  id: string;
  market: string;
  type: "BUY" | "SELL" | "SETTLEMENT";
  outcome: "YES" | "NO";
  qty: number;
  price: number;
  total: number;
  time: string;
}

export interface TaxTreatment {
  netGain: number;
  estimatedTax: number;
  effectiveRate: number;
}

export interface TaxComparison {
  capitalGains: TaxTreatment;
  gambling: TaxTreatment;
  business: TaxTreatment;
}

export interface ActivePosition {
  id: string;
  market: string;
  outcome: "YES" | "NO";
  qty: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
}

export interface DashboardData {
  stats: DashboardStats;
  pnlHistory: PnlHistoryItem[];
  recentTrades: RecentTrade[];
  taxComparison: TaxComparison;
  activePositions: ActivePosition[];
}

export function useDashboardData(): DashboardData {
  return {
    stats: {
      totalTrades: 142,
      netPnl: 3847.52,
      estimatedTax: 1423.18,
      winRate: 63.4,
      pnlChange: 12.5,
      tradesChange: 8.3,
      taxChange: -4.2,
      winRateChange: 2.1,
    },
    pnlHistory: [
      { month: "Mar", pnl: 320, cumulative: 320 },
      { month: "Apr", pnl: -150, cumulative: 170 },
      { month: "May", pnl: 480, cumulative: 650 },
      { month: "Jun", pnl: 210, cumulative: 860 },
      { month: "Jul", pnl: -90, cumulative: 770 },
      { month: "Aug", pnl: 560, cumulative: 1330 },
      { month: "Sep", pnl: 390, cumulative: 1720 },
      { month: "Oct", pnl: -220, cumulative: 1500 },
      { month: "Nov", pnl: 870, cumulative: 2370 },
      { month: "Dec", pnl: 640, cumulative: 3010 },
      { month: "Jan", pnl: 420, cumulative: 3430 },
      { month: "Feb", pnl: 417, cumulative: 3847 },
    ],
    recentTrades: [
      { id: "t1", market: "Trump wins 2028 election", type: "BUY", outcome: "YES", qty: 50, price: 0.62, total: 31.0, time: "2h ago" },
      { id: "t2", market: "BTC above $100k by March", type: "SELL", outcome: "YES", qty: 100, price: 0.78, total: 78.0, time: "3h ago" },
      { id: "t3", market: "Fed cuts rates in March", type: "SETTLEMENT", outcome: "NO", qty: 200, price: 1.0, total: 200.0, time: "5h ago" },
      { id: "t4", market: "ETH above $5k by April", type: "BUY", outcome: "YES", qty: 75, price: 0.34, total: 25.5, time: "8h ago" },
      { id: "t5", market: "Super Bowl LVIII winner", type: "SELL", outcome: "NO", qty: 30, price: 0.88, total: 26.4, time: "12h ago" },
      { id: "t6", market: "US GDP growth > 3%", type: "BUY", outcome: "YES", qty: 150, price: 0.45, total: 67.5, time: "1d ago" },
      { id: "t7", market: "Tesla stock above $300", type: "SETTLEMENT", outcome: "YES", qty: 80, price: 1.0, total: 80.0, time: "1d ago" },
      { id: "t8", market: "Next Fed chair nomination", type: "BUY", outcome: "NO", qty: 60, price: 0.22, total: 13.2, time: "2d ago" },
      { id: "t9", market: "Inflation below 2.5%", type: "SELL", outcome: "YES", qty: 120, price: 0.55, total: 66.0, time: "2d ago" },
      { id: "t10", market: "Apple launches AR glasses", type: "BUY", outcome: "YES", qty: 40, price: 0.15, total: 6.0, time: "3d ago" },
    ],
    taxComparison: {
      capitalGains: { netGain: 3847.52, estimatedTax: 1423.18, effectiveRate: 0.37 },
      gambling: { netGain: 3847.52, estimatedTax: 1508.92, effectiveRate: 0.392 },
      business: { netGain: 3847.52, estimatedTax: 2012.44, effectiveRate: 0.523 },
    },
    activePositions: [
      { id: "p1", market: "Trump wins 2028 election", outcome: "YES", qty: 50, avgPrice: 0.62, currentPrice: 0.68, unrealizedPnl: 3.0 },
      { id: "p2", market: "ETH above $5k by April", outcome: "YES", qty: 75, avgPrice: 0.34, currentPrice: 0.41, unrealizedPnl: 5.25 },
      { id: "p3", market: "US GDP growth > 3%", outcome: "YES", qty: 150, avgPrice: 0.45, currentPrice: 0.52, unrealizedPnl: 10.5 },
      { id: "p4", market: "Next Fed chair nomination", outcome: "NO", qty: 60, avgPrice: 0.22, currentPrice: 0.18, unrealizedPnl: -2.4 },
      { id: "p5", market: "Apple launches AR glasses", outcome: "YES", qty: 40, avgPrice: 0.15, currentPrice: 0.21, unrealizedPnl: 2.4 },
    ],
  };
}
