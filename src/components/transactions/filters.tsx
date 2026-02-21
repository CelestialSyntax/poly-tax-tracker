"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface FilterValues {
  dateFrom: string
  dateTo: string
  market: string
  type: string
  outcome: string
  source: string
}

const defaultFilters: FilterValues = {
  dateFrom: "",
  dateTo: "",
  market: "",
  type: "ALL",
  outcome: "ALL",
  source: "ALL",
}

interface FiltersProps {
  onFilterChange: (filters: FilterValues) => void
}

export function Filters({ onFilterChange }: FiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(defaultFilters)

  function update(partial: Partial<FilterValues>) {
    const next = { ...filters, ...partial }
    setFilters(next)
    onFilterChange(next)
  }

  function clearFilters() {
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const hasActiveFilters =
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.market !== "" ||
    filters.type !== "ALL" ||
    filters.outcome !== "ALL" ||
    filters.source !== "ALL"

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">From</label>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
          className="h-8 w-36 border-white/10 bg-white/5 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">To</label>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
          className="h-8 w-36 border-white/10 bg-white/5 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">Market</label>
        <Input
          placeholder="Search markets..."
          value={filters.market}
          onChange={(e) => update({ market: e.target.value })}
          className="h-8 w-48 border-white/10 bg-white/5 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">Type</label>
        <Select value={filters.type} onValueChange={(v) => update({ type: v })}>
          <SelectTrigger className="h-8 w-32 border-white/10 bg-white/5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="SELL">Sell</SelectItem>
            <SelectItem value="SETTLEMENT">Settlement</SelectItem>
            <SelectItem value="REDEEM">Redeem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">Outcome</label>
        <Select value={filters.outcome} onValueChange={(v) => update({ outcome: v })}>
          <SelectTrigger className="h-8 w-24 border-white/10 bg-white/5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="YES">Yes</SelectItem>
            <SelectItem value="NO">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-400">Source</label>
        <Select value={filters.source} onValueChange={(v) => update({ source: v })}>
          <SelectTrigger className="h-8 w-28 border-white/10 bg-white/5 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="api">API</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="bot">Bot</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 gap-1 text-xs text-zinc-400 hover:text-white"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
