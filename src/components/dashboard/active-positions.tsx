"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ActivePosition } from "@/hooks/use-dashboard";

export function ActivePositions({
  positions,
}: {
  positions: ActivePosition[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Active Positions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Market</TableHead>
                <TableHead className="text-muted-foreground">
                  Outcome
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Qty
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Avg Price
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Current
                </TableHead>
                <TableHead className="text-muted-foreground text-right">
                  Unrealized P&L
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((pos) => (
                <TableRow
                  key={pos.id}
                  className="border-white/5 hover:bg-white/[0.02]"
                >
                  <TableCell className="font-medium text-foreground max-w-[250px] truncate">
                    {pos.market}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${
                        pos.outcome === "YES"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-red-500/20 text-red-300 border-red-500/30"
                      }`}
                    >
                      {pos.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-foreground">
                    {pos.qty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${pos.avgPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    ${pos.currentPrice.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      pos.unrealizedPnl >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {pos.unrealizedPnl >= 0 ? "+" : ""}
                    {formatCurrency(pos.unrealizedPnl)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
