"use client";

import { motion } from "framer-motion";
import { Scale, Dices, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { TaxComparison } from "@/hooks/use-dashboard";

const treatments = [
  {
    key: "capitalGains" as const,
    label: "Capital Gains",
    icon: Scale,
    color: "text-indigo-400",
    accentBg: "from-indigo-500/20 to-indigo-500/5",
    borderColor: "border-indigo-500/30",
  },
  {
    key: "gambling" as const,
    label: "Gambling",
    icon: Dices,
    color: "text-violet-400",
    accentBg: "from-violet-500/20 to-violet-500/5",
    borderColor: "border-violet-500/30",
  },
  {
    key: "business" as const,
    label: "Business",
    icon: Briefcase,
    color: "text-cyan-400",
    accentBg: "from-cyan-500/20 to-cyan-500/5",
    borderColor: "border-cyan-500/30",
  },
];

export function TaxSummary({ data }: { data: TaxComparison }) {
  const lowestKey = (
    Object.keys(data) as Array<keyof TaxComparison>
  ).reduce((a, b) => (data[a].estimatedTax < data[b].estimatedTax ? a : b));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-indigo-400" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Tax Treatment Comparison
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {treatments.map((t) => {
              const treatmentData = data[t.key];
              const isRecommended = t.key === lowestKey;

              return (
                <div
                  key={t.key}
                  className={`relative rounded-lg border bg-white/[0.03] p-4 ${
                    isRecommended ? t.borderColor : "border-white/5"
                  }`}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2.5 right-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 text-white text-[10px] border-0">
                      Recommended
                    </Badge>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${t.accentBg}`}
                    >
                      <t.icon className={`h-4 w-4 ${t.color}`} />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">
                      {t.label}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500">Net Gain</span>
                      <span className="text-sm font-medium text-zinc-300">
                        {formatCurrency(treatmentData.netGain)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500">Est. Tax</span>
                      <span
                        className={`text-sm font-bold ${
                          isRecommended ? "text-emerald-400" : "text-zinc-200"
                        }`}
                      >
                        {formatCurrency(treatmentData.estimatedTax)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-500">
                        Effective Rate
                      </span>
                      <span className="text-sm font-medium text-zinc-300">
                        {(treatmentData.effectiveRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
