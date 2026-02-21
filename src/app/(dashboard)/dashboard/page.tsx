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
  const { stats, pnlHistory, recentTrades, taxComparison, activePositions } =
    useDashboardData();

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
