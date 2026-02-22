"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { DashboardStats } from "@/hooks/use-dashboard";

interface StatCardConfig {
  label: string;
  value: number;
  prefix: string;
  suffix: string;
  change: number;
  accentColor: string;
  valueColor: string;
  bgChar: string;
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
      accentColor: "bg-[#7B61FF]",
      valueColor: "text-[#F8F8FC]",
      bgChar: "#",
    },
    {
      label: "Net P&L",
      value: stats.netPnl,
      prefix: "$",
      suffix: "",
      change: stats.pnlChange,
      accentColor: stats.netPnl >= 0 ? "bg-[#3BFF82]" : "bg-[#FF3F5C]",
      valueColor: stats.netPnl >= 0 ? "text-[#3BFF82]" : "text-[#FF3F5C]",
      bgChar: "$",
    },
    {
      label: "Est. Tax Liability",
      value: stats.estimatedTax,
      prefix: "$",
      suffix: "",
      change: stats.taxChange,
      accentColor: "bg-[#F7B731]",
      valueColor: "text-[#F7B731]",
      bgChar: "$",
    },
    {
      label: "Win Rate",
      value: stats.winRate,
      prefix: "",
      suffix: "%",
      change: stats.winRateChange,
      accentColor: "bg-[#7B61FF]",
      valueColor: "text-[#7B61FF]",
      bgChar: "%",
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
          <div className="bg-[#111120] border border-[rgba(255,255,255,0.07)] rounded-2xl p-5 card-glow relative overflow-hidden">
            {/* Left accent bar */}
            <div
              className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${stat.accentColor}`}
            />

            {/* Large background character */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl font-black opacity-[0.04] text-mono-num select-none text-[#F8F8FC]">
              {stat.bgChar}
            </div>

            <div className="pl-3">
              {/* Label */}
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[#8890A8]">
                {stat.label}
              </p>

              {/* Value */}
              <p className={`text-3xl font-black text-mono-num mt-1 ${stat.valueColor}`}>
                <AnimatedNumber
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </p>

              {/* Change badge */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    stat.change >= 0
                      ? "bg-[rgba(59,255,130,0.1)] text-[#3BFF82]"
                      : "bg-[rgba(255,63,92,0.1)] text-[#FF3F5C]"
                  }`}
                >
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(stat.change).toFixed(1)}%
                </span>
                <span className="text-xs text-[#44445A]">vs last month</span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
