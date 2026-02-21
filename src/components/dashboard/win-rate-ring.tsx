"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const COLORS = ["#22c55e", "#27272a"];

const chartConfig = {
  wins: {
    label: "Wins",
    color: "#22c55e",
  },
  losses: {
    label: "Losses",
    color: "#27272a",
  },
} satisfies ChartConfig;

export function WinRateRing({
  winRate,
  totalTrades,
}: {
  winRate: number;
  totalTrades: number;
}) {
  const wins = Math.round(totalTrades * (winRate / 100));
  const losses = totalTrades - wins;

  const data = [
    { name: "Wins", value: winRate },
    { name: "Losses", value: 100 - winRate },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-violet-400" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Win Rate
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div className="relative h-[200px] w-[200px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index]}
                      stroke="none"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                {winRate}%
              </span>
              <span className="text-xs text-muted-foreground">Win Rate</span>
            </div>
          </div>

          <div className="mt-4 w-full space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-muted-foreground">Wins</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {wins}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-zinc-700" />
                <span className="text-xs text-muted-foreground">Losses</span>
              </div>
              <span className="text-xs font-medium text-foreground">
                {losses}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
