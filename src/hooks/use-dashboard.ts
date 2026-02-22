"use client";

import { useState, useEffect, useCallback } from "react";

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
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const emptyStats: DashboardStats = {
  totalTrades: 0,
  netPnl: 0,
  estimatedTax: 0,
  winRate: 0,
  pnlChange: 0,
  tradesChange: 0,
  taxChange: 0,
  winRateChange: 0,
};

const emptyTaxComparison: TaxComparison = {
  capitalGains: { netGain: 0, estimatedTax: 0, effectiveRate: 0 },
  gambling: { netGain: 0, estimatedTax: 0, effectiveRate: 0 },
  business: { netGain: 0, estimatedTax: 0, effectiveRate: 0 },
};

export function useDashboardData(): DashboardData {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [pnlHistory, setPnlHistory] = useState<PnlHistoryItem[]>([]);
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [taxComparison, setTaxComparison] =
    useState<TaxComparison>(emptyTaxComparison);
  const [activePositions, setActivePositions] = useState<ActivePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");

      const data = await res.json();
      setStats(data.stats);
      setPnlHistory(data.pnlHistory);
      setRecentTrades(data.recentTrades);
      setTaxComparison(data.taxComparison);
      setActivePositions(data.activePositions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    pnlHistory,
    recentTrades,
    taxComparison,
    activePositions,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}
