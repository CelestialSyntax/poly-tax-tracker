"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Transaction } from "@/hooks/use-transactions"

interface TradeDetailSheetProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function outcomeBadgeClass(outcome: string) {
  return outcome === "YES"
    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    : "bg-red-500/20 text-red-400 border-red-500/30"
}

function typeBadgeClass(type: string) {
  switch (type) {
    case "BUY":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    case "SELL":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    case "SETTLEMENT":
      return "bg-violet-500/20 text-violet-400 border-violet-500/30"
    case "REDEEM":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    default:
      return ""
  }
}

interface DetailRowProps {
  label: string
  children: React.ReactNode
}

function DetailRow({ label, children }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm font-medium text-zinc-200">{children}</span>
    </div>
  )
}

export function TradeDetailSheet({ transaction, open, onOpenChange }: TradeDetailSheetProps) {
  if (!transaction) return null

  const isDisposal = transaction.type === "SELL" || transaction.type === "SETTLEMENT" || transaction.type === "REDEEM"
  const costBasis = transaction.type === "BUY" ? transaction.totalAmount : transaction.pricePerShare * transaction.quantity
  const proceeds = isDisposal ? transaction.totalAmount : 0
  const gainLoss = isDisposal ? proceeds - costBasis : 0

  const holdingPeriodDays = 45 // placeholder for mock
  const holdingPeriod = holdingPeriodDays > 365 ? "Long-term" : "Short-term"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full border-white/10 bg-[#0a0a0b] sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-lg text-white">Trade Details</SheetTitle>
          <SheetDescription className="line-clamp-2 text-zinc-400">
            {transaction.marketTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto px-1">
          {/* Badges */}
          <div className="flex gap-2">
            <Badge className={outcomeBadgeClass(transaction.outcome)}>
              {transaction.outcome}
            </Badge>
            <Badge className={typeBadgeClass(transaction.type)}>
              {transaction.type}
            </Badge>
            <Badge variant="outline" className="border-white/10 text-zinc-400">
              {transaction.importSource.toUpperCase()}
            </Badge>
          </div>

          {/* Details */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <DetailRow label="Date">{formatDate(transaction.timestamp)}</DetailRow>
            <DetailRow label="Quantity">{transaction.quantity.toFixed(4)}</DetailRow>
            <DetailRow label="Price per Share">{formatCurrency(transaction.pricePerShare)}</DetailRow>
            <DetailRow label="Total Amount">{formatCurrency(transaction.totalAmount)}</DetailRow>
            <DetailRow label="Fee">{formatCurrency(transaction.fee)}</DetailRow>
            <DetailRow label="Market ID">
              <span className="max-w-[180px] truncate text-xs">{transaction.marketId}</span>
            </DetailRow>
            {transaction.transactionHash && (
              <DetailRow label="Tx Hash">
                <span className="max-w-[180px] truncate text-xs font-mono">
                  {transaction.transactionHash}
                </span>
              </DetailRow>
            )}
          </div>

          {/* Tax Lot Breakdown (for disposals) */}
          {isDisposal && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-zinc-300">Tax Lot Breakdown</h4>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <DetailRow label="Cost Basis">{formatCurrency(costBasis)}</DetailRow>
                <DetailRow label="Proceeds">{formatCurrency(proceeds)}</DetailRow>
                <DetailRow label="Gain / Loss">
                  <span className={gainLoss >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {gainLoss >= 0 ? "+" : ""}
                    {formatCurrency(gainLoss)}
                  </span>
                </DetailRow>
                <DetailRow label="Holding Period">{holdingPeriod}</DetailRow>
                <DetailRow label="Days Held">{holdingPeriodDays}</DetailRow>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
