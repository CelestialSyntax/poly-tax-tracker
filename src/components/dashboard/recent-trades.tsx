"use client";

import { motion } from "framer-motion";
import { ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { RecentTrade } from "@/hooks/use-dashboard";

export function RecentTrades({ trades }: { trades: RecentTrade[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
    >
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-400" />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Recent Trades
              </span>
            </div>
            <Link
              href="/transactions"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trades.slice(0, 5).map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {trade.market}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ${
                      trade.outcome === "YES"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border-red-500/30"
                    }`}
                  >
                    {trade.outcome}
                  </Badge>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ${
                      trade.type === "BUY"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : trade.type === "SELL"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-violet-500/20 text-violet-300 border-violet-500/30"
                    }`}
                  >
                    {trade.type}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {trade.time}
                  </span>
                </div>
              </div>
              <span className="text-sm font-medium text-foreground ml-3 shrink-0">
                {formatCurrency(trade.total)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
