"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FileText, ChevronDown, ChevronUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import type { Form8949Line } from "@/lib/tax/types"

const PREVIEW_LIMIT = 20

interface EntryTableProps {
  entries: Form8949Line[]
  title: string
  showAll: boolean
}

function EntryTable({ entries, title, showAll }: EntryTableProps) {
  const displayEntries = showAll ? entries : entries.slice(0, PREVIEW_LIMIT)
  const totalProceeds = entries.reduce((s, e) => s + e.proceeds, 0)
  const totalCostBasis = entries.reduce((s, e) => s + e.costBasis, 0)
  const totalAdjustments = entries.reduce((s, e) => s + e.adjustments, 0)
  const totalGainLoss = entries.reduce((s, e) => s + e.gainLoss, 0)

  if (entries.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <Badge variant="outline" className="text-[10px]">
          Box {entries[0]?.box} - basis NOT reported to IRS
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-xs font-mono">(a) Description</TableHead>
              <TableHead className="text-xs font-mono">(b) Acquired</TableHead>
              <TableHead className="text-xs font-mono">(c) Sold</TableHead>
              <TableHead className="text-right text-xs font-mono">(d) Proceeds</TableHead>
              <TableHead className="text-right text-xs font-mono">(e) Cost Basis</TableHead>
              <TableHead className="text-right text-xs font-mono">(f) Code</TableHead>
              <TableHead className="text-right text-xs font-mono">(g) Adjust.</TableHead>
              <TableHead className="text-right text-xs font-mono">(h) Gain/Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayEntries.map((entry, i) => (
              <TableRow
                key={i}
                className="border-white/5 hover:bg-white/[0.02]"
              >
                <TableCell className="text-sm max-w-[280px] truncate">
                  {entry.description}
                </TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {format(new Date(entry.dateAcquired), "MM/dd/yyyy")}
                </TableCell>
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {format(new Date(entry.dateSold), "MM/dd/yyyy")}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {formatCurrency(entry.proceeds)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {formatCurrency(entry.costBasis)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono text-muted-foreground">
                  --
                </TableCell>
                <TableCell className="text-right text-sm font-mono text-muted-foreground">
                  {formatCurrency(entry.adjustments)}
                </TableCell>
                <TableCell
                  className={`text-right text-sm font-mono font-medium ${
                    entry.gainLoss >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(entry.gainLoss)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="border-white/10 bg-white/5">
            <TableRow className="hover:bg-white/5">
              <TableCell colSpan={3} className="font-semibold text-sm">
                Totals ({entries.length} entries)
              </TableCell>
              <TableCell className="text-right font-semibold text-sm font-mono">
                {formatCurrency(totalProceeds)}
              </TableCell>
              <TableCell className="text-right font-semibold text-sm font-mono">
                {formatCurrency(totalCostBasis)}
              </TableCell>
              <TableCell className="text-right text-sm font-mono">--</TableCell>
              <TableCell className="text-right font-semibold text-sm font-mono">
                {formatCurrency(totalAdjustments)}
              </TableCell>
              <TableCell
                className={`text-right font-semibold text-sm font-mono ${
                  totalGainLoss >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatCurrency(totalGainLoss)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

interface Form8949PreviewProps {
  lines?: Form8949Line[]
}

export function Form8949Preview({ lines }: Form8949PreviewProps) {
  const [showAll, setShowAll] = useState(false)

  const entries = lines ?? []
  const shortTerm = entries.filter((e) => e.holdingPeriod === "short-term")
  const longTerm = entries.filter((e) => e.holdingPeriod === "long-term")
  const totalEntries = entries.length
  const hasMore = totalEntries > PREVIEW_LIMIT

  if (entries.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-cyan-400" />
              <CardTitle>Form 8949 Preview</CardTitle>
              <Badge variant="outline" className="text-[10px]">
                Draft
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sales and Other Dispositions of Capital Assets
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <EntryTable
            entries={shortTerm}
            title="Part I -- Short-Term Capital Gains and Losses"
            showAll={showAll}
          />
          <EntryTable
            entries={longTerm}
            title="Part II -- Long-Term Capital Gains and Losses"
            showAll={showAll}
          />

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="size-3 mr-1" />
                    Show fewer entries
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3 mr-1" />
                    Show all {totalEntries} entries
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
