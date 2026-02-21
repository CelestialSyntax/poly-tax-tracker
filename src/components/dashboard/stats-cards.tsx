"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  Calculator,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/hooks/use-dashboard";

interface StatCardConfig {
  label: string;
  value: number;
  prefix: string;
  suffix: string;
  change: number;
  icon: LucideIcon;
  color: string;
  iconBg: string;
}

function AnimatedNumber({
  value,
  prefix,
  suffix,
}: {
  value: number;
  prefix: string;
  suffix: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  const formatted =
    prefix === "$"
      ? display.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : display >= 100
        ? Math.round(display).toLocaleString("en-US")
        : display.toFixed(1);

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

function buildStatCards(stats: DashboardStats): StatCardConfig[] {
  return [
    {
      label: "Total Trades",
      value: stats.totalTrades,
      prefix: "",
      suffix: "",
      change: stats.tradesChange,
      icon: Activity,
      color: "text-indigo-400",
      iconBg: "from-indigo-500/20 to-indigo-500/5",
    },
    {
      label: "Net P&L",
      value: stats.netPnl,
      prefix: "$",
      suffix: "",
      change: stats.pnlChange,
      icon: stats.netPnl >= 0 ? TrendingUp : TrendingDown,
      color: stats.netPnl >= 0 ? "text-emerald-400" : "text-red-400",
      iconBg:
        stats.netPnl >= 0
          ? "from-emerald-500/20 to-emerald-500/5"
          : "from-red-500/20 to-red-500/5",
    },
    {
      label: "Est. Tax Liability",
      value: stats.estimatedTax,
      prefix: "$",
      suffix: "",
      change: stats.taxChange,
      icon: Calculator,
      color: "text-amber-400",
      iconBg: "from-amber-500/20 to-amber-500/5",
    },
    {
      label: "Win Rate",
      value: stats.winRate,
      prefix: "",
      suffix: "%",
      change: stats.winRateChange,
      icon: DollarSign,
      color: "text-violet-400",
      iconBg: "from-violet-500/20 to-violet-500/5",
    },
  ];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const cards = buildStatCards(stats);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((stat) => (
        <motion.div key={stat.label} variants={item}>
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.iconBg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-500">
                  {stat.label}
                </p>
                <p
                  className={`text-xl font-bold ${
                    stat.label === "Net P&L"
                      ? stat.value >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                      : "text-white"
                  }`}
                >
                  <AnimatedNumber
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-400" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      stat.change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {Math.abs(stat.change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-zinc-600">vs last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
