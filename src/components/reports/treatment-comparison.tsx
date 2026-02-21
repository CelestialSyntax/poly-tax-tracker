"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  Dice5,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Scale,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { TreatmentComparison as TreatmentComparisonType } from "@/lib/tax/types"

function AnimatedCurrency({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (
        (increment > 0 && current >= value) ||
        (increment < 0 && current <= value) ||
        increment === 0
      ) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(current)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  return <span>{formatCurrency(display)}</span>
}

interface TreatmentCardProps {
  title: string
  icon: React.ReactNode
  borderColor: string
  bgGlow: string
  badgeBg: string
  badgeText: string
  gradientBar: string
  recommended: boolean
  rows: { label: string; value: number; bold?: boolean }[]
  estimatedTax: number
  learnMore: string
}

function TreatmentCard({
  title,
  icon,
  borderColor,
  bgGlow,
  badgeBg,
  badgeText,
  gradientBar,
  recommended,
  rows,
  estimatedTax,
  learnMore,
}: TreatmentCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={`bg-white/5 backdrop-blur-xl border rounded-xl relative overflow-hidden transition-all duration-300 ${
          recommended
            ? `${borderColor} ${bgGlow} shadow-lg`
            : "border-white/10 hover:border-white/20"
        }`}
      >
        {recommended && (
          <div
            className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${gradientBar}`}
          />
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon}
              {title}
            </CardTitle>
            {recommended && (
              <Badge className={`${badgeBg} ${badgeText} text-[10px]`}>
                Recommended
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between py-1.5 text-sm ${
                row.bold ? "font-semibold pt-2 border-t border-white/10" : ""
              }`}
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span
                className={`font-medium ${
                  row.value < 0
                    ? "text-red-400"
                    : row.bold
                      ? "text-white"
                      : "text-emerald-400"
                }`}
              >
                <AnimatedCurrency value={row.value} />
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between py-1.5 text-sm font-bold pt-3 border-t border-white/10">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span
              className={
                recommended
                  ? "text-emerald-400"
                  : estimatedTax < 0
                    ? "text-emerald-400"
                    : "text-amber-400"
              }
            >
              <AnimatedCurrency value={estimatedTax} />
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full pt-2"
          >
            {expanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
            Learn More
          </button>
          {expanded && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              {learnMore}
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

interface TreatmentComparisonProps {
  comparison?: TreatmentComparisonType
}

export function TreatmentComparison({ comparison }: TreatmentComparisonProps) {
  const cg = comparison?.capitalGains ?? {
    shortTermGains: 4250.0,
    shortTermLosses: 1800.0,
    shortTermNet: 2450.0,
    longTermGains: 1200.0,
    longTermLosses: 350.0,
    longTermNet: 850.0,
    totalNet: 3300.0,
    capitalLossDeduction: 0,
    carryforwardLoss: 0,
  }
  const gb = comparison?.gambling ?? {
    grossWinnings: 5450.0,
    totalLosses: 2150.0,
    deductibleLosses: 1935.0,
    netGamblingIncome: 3515.0,
    requiresItemizing: true,
  }
  const biz = comparison?.business ?? {
    grossIncome: 5450.0,
    totalExpenses: 2150.0,
    netBusinessIncome: 3300.0,
    selfEmploymentTax: 504.9,
    selfEmploymentTaxRate: 0.153,
  }

  const recommendation = comparison?.recommendation ?? "capital_gains"
  const reason =
    comparison?.recommendationReason ??
    "Capital gains treatment provides loss carryforward and potential long-term rates."
  const taxYear = comparison?.taxYear ?? new Date().getFullYear()

  const cgTax =
    cg.totalNet < 0
      ? -(Math.min(Math.abs(cg.totalNet), 3000) * 0.37)
      : Math.max(0, cg.shortTermNet) * 0.37 +
        Math.max(0, cg.longTermNet) * 0.2
  const gbTax = Math.max(0, gb.netGamblingIncome) * 0.37
  const bizIncomeTax = Math.max(0, biz.netBusinessIncome) * 0.37
  const bizTotalTax = bizIncomeTax + biz.selfEmploymentTax

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Scale className="size-5 text-violet-400" />
        <h3 className="text-lg font-semibold">Treatment Comparison</h3>
        <span className="text-sm text-muted-foreground">
          -- {taxYear} Tax Year
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{reason}</p>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-3"
      >
        <TreatmentCard
          title="Capital Gains"
          icon={<TrendingUp className="size-4 text-indigo-400" />}
          borderColor="border-indigo-500/40"
          bgGlow="bg-indigo-500/[0.03]"
          badgeBg="bg-indigo-500/20"
          badgeText="text-indigo-300 border-indigo-500/30"
          gradientBar="from-indigo-500 to-purple-500"
          recommended={recommendation === "capital_gains"}
          rows={[
            { label: "Short-Term Net", value: cg.shortTermNet },
            { label: "Long-Term Net", value: cg.longTermNet },
            { label: "Total Net", value: cg.totalNet, bold: true },
            {
              label: "Loss Deduction",
              value:
                cg.capitalLossDeduction > 0 ? -cg.capitalLossDeduction : 0,
            },
            { label: "Carryforward", value: cg.carryforwardLoss },
          ]}
          estimatedTax={cgTax}
          learnMore="Capital gains treatment reports prediction market profits as investment gains. Short-term holdings (under 1 year) are taxed at ordinary income rates up to 37%. Long-term holdings qualify for preferential rates of 0%, 15%, or 20%. Net capital losses can offset up to $3,000 of ordinary income annually, with unlimited carryforward."
        />

        <TreatmentCard
          title="Gambling Income"
          icon={<Dice5 className="size-4 text-amber-400" />}
          borderColor="border-amber-500/40"
          bgGlow="bg-amber-500/[0.03]"
          badgeBg="bg-amber-500/20"
          badgeText="text-amber-300 border-amber-500/30"
          gradientBar="from-amber-500 to-orange-500"
          recommended={recommendation === "gambling"}
          rows={[
            { label: "Gross Winnings", value: gb.grossWinnings },
            {
              label: "Deductible Losses (90%)",
              value: -gb.deductibleLosses,
            },
            {
              label: "Net Income",
              value: gb.netGamblingIncome,
              bold: true,
            },
          ]}
          estimatedTax={gbTax}
          learnMore="Gambling income treatment reports all winning trades as gambling winnings on Schedule 1. Losses are deductible only if you itemize. Under the 2026 One Big Beautiful Bill Act, gambling losses are limited to 90% of winnings. All gambling income is taxed at ordinary rates with no long-term preferential treatment."
        />

        <TreatmentCard
          title="Business Income"
          icon={<Briefcase className="size-4 text-emerald-400" />}
          borderColor="border-emerald-500/40"
          bgGlow="bg-emerald-500/[0.03]"
          badgeBg="bg-emerald-500/20"
          badgeText="text-emerald-300 border-emerald-500/30"
          gradientBar="from-emerald-500 to-green-500"
          recommended={recommendation === "business"}
          rows={[
            { label: "Gross Income", value: biz.grossIncome },
            { label: "Expenses", value: -biz.totalExpenses },
            {
              label: "Net Income",
              value: biz.netBusinessIncome,
              bold: true,
            },
            { label: "SE Tax (15.3%)", value: biz.selfEmploymentTax },
          ]}
          estimatedTax={bizTotalTax}
          learnMore="Business income treatment reports trading activity on Schedule C as a sole proprietorship. All expenses (including losses) are fully deductible against income. However, net profit is subject to both income tax and self-employment tax (15.3% on 92.35% of net income). This is generally the most expensive treatment unless expenses significantly exceed income."
        />
      </motion.div>
    </div>
  )
}
