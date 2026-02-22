"use client";

import { motion } from "framer-motion";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { TaxSummary } from "@/components/dashboard/tax-summary";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { ActivePositions } from "@/components/dashboard/active-positions";
import { WinRateRing } from "@/components/dashboard/win-rate-ring";
import { useDashboardData } from "@/hooks/use-dashboard";
import { Loader2 } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const {
    stats,
    pnlHistory,
    recentTrades,
    taxComparison,
    activePositions,
    isLoading,
    error,
    refresh,
  } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p className="text-sm text-zinc-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-400">Failed to load dashboard</p>
          <p className="text-xs text-zinc-500">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Your Polymarket tax overview for {new Date().getFullYear()}
        </p>
      </motion.div>

      <motion.div variants={item}>
        <StatsCards stats={stats} />
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PnlChart data={pnlHistory} />
        </div>
        <div>
          <WinRateRing
            winRate={stats.winRate}
            totalTrades={stats.totalTrades}
          />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <TaxSummary data={taxComparison} />
      </motion.div>

      <motion.div variants={item} className="grid gap-6 lg:grid-cols-2">
        <RecentTrades trades={recentTrades} />
        <ActivePositions positions={activePositions} />
      </motion.div>
    </motion.div>
  );
}
