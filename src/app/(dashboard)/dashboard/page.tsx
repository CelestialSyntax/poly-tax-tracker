"use client";

import { motion } from "framer-motion";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PnlChart } from "@/components/dashboard/pnl-chart";
import { TaxSummary } from "@/components/dashboard/tax-summary";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { ActivePositions } from "@/components/dashboard/active-positions";
import { WinRateRing } from "@/components/dashboard/win-rate-ring";
import { useDashboardData } from "@/hooks/use-dashboard";

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
        <div className="text-center">
          <div className="text-[#3BFF82] font-mono text-sm mb-2 animate-pulse">
            $ polytax load --dashboard
          </div>
          <div className="text-[#44445A] text-xs font-mono">
            Fetching your data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-[#FF3F5C]">Failed to load dashboard</p>
          <p className="text-xs text-[#8890A8]">{error}</p>
          <button
            onClick={refresh}
            className="mt-2 bg-[#111120] border border-[rgba(255,255,255,0.07)] text-[#F8F8FC] hover:border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-2 text-sm transition-colors"
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.15em] uppercase text-[#3BFF82]">
              Overview
            </p>
            <h2 className="text-2xl font-black text-[#F8F8FC] mt-0.5">
              Dashboard
            </h2>
            <p className="text-sm text-[#8890A8] mt-1">
              Tax year {new Date().getFullYear()} · FIFO cost basis
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[#111120] border border-[rgba(255,255,255,0.07)] px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-[#3BFF82] animate-pulse" />
            <span className="text-xs text-[#8890A8]">Live sync</span>
          </div>
        </div>
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
