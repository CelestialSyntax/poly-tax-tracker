"use client"

import { useState, useMemo } from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react"
import { motion } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TradeDetailSheet } from "@/components/transactions/trade-detail-sheet"
import { Filters, type FilterValues } from "@/components/transactions/filters"
import { useTransactions, type Transaction } from "@/hooks/use-transactions"
import { formatCurrency, formatDate } from "@/lib/utils"

function typeBadgeClass(type: string) {
  switch (type) {
    case "BUY":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    case "SELL":
      return "bg-red-500/20 text-red-400 border-red-500/30"
    case "SETTLEMENT":
      return "bg-violet-500/20 text-violet-400 border-violet-500/30"
    case "REDEEM":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    default:
      return ""
  }
}

function outcomeBadgeClass(outcome: string) {
  return outcome === "YES"
    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20"
}

const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-zinc-300 text-xs">
        {formatDate(row.original.timestamp)}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "marketTitle",
    header: "Market",
    cell: ({ row }) => (
      <span
        className="max-w-[240px] truncate block text-zinc-200 text-xs font-medium"
        title={row.original.marketTitle}
      >
        {row.original.marketTitle}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge className={typeBadgeClass(row.original.type)}>
        {row.original.type}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "outcome",
    header: "Outcome",
    cell: ({ row }) => (
      <Badge variant="outline" className={outcomeBadgeClass(row.original.outcome)}>
        {row.original.outcome}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <span className="text-zinc-300 text-xs tabular-nums">
        {row.original.quantity.toLocaleString()}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "pricePerShare",
    header: "Price",
    cell: ({ row }) => (
      <span className="text-zinc-300 text-xs tabular-nums">
        {formatCurrency(row.original.pricePerShare)}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => (
      <span className="text-zinc-200 text-xs font-medium tabular-nums">
        {formatCurrency(row.original.totalAmount)}
      </span>
    ),
    enableSorting: true,
  },
  {
    id: "pnl",
    header: "P&L",
    cell: ({ row }) => {
      const tx = row.original
      const isDisposal = tx.type === "SELL" || tx.type === "SETTLEMENT" || tx.type === "REDEEM"
      if (!isDisposal) return <span className="text-zinc-500 text-xs">--</span>
      const pnl = tx.totalAmount - tx.pricePerShare * tx.quantity
      return (
        <span
          className={`text-xs font-medium tabular-nums ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {pnl >= 0 ? "+" : ""}
          {formatCurrency(pnl)}
        </span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: "importSource",
    header: "Source",
    cell: ({ row }) => (
      <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px]">
        {row.original.importSource.toUpperCase()}
      </Badge>
    ),
    enableSorting: false,
  },
]

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <FileSpreadsheet className="h-12 w-12 text-zinc-600" />
      </div>
      <h3 className="mt-6 text-lg font-semibold text-zinc-300">No transactions yet</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-zinc-500">
        Import your Polymarket trades from a wallet address, upload a CSV file, or add transactions manually.
      </p>
    </motion.div>
  )
}

export function TransactionTable() {
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ])
  const [filters, setFilters] = useState<FilterValues>({
    dateFrom: "",
    dateTo: "",
    market: "",
    type: "ALL",
    outcome: "ALL",
    source: "ALL",
  })
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { transactions, pagination, isLoading, error } = useTransactions({
    page,
    limit: 20,
    type: filters.type !== "ALL" ? filters.type : undefined,
    outcome: filters.outcome !== "ALL" ? filters.outcome : undefined,
    source: filters.source !== "ALL" ? filters.source : undefined,
    market: filters.market || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  })

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: pagination.totalPages,
  })

  function handleFilterChange(next: FilterValues) {
    setFilters(next)
    setPage(1)
  }

  function handleRowClick(tx: Transaction) {
    setSelectedTx(tx)
    setSheetOpen(true)
  }

  const sortField = sorting[0]?.id
  const sortOrder = sorting[0]?.desc ? "desc" : "asc"

  const sortIcon = useMemo(() => {
    return (columnId: string) => {
      if (sortField !== columnId) return <ArrowUpDown className="ml-1 h-3 w-3 text-zinc-600" />
      return sortOrder === "asc"
        ? <ArrowUp className="ml-1 h-3 w-3 text-zinc-400" />
        : <ArrowDown className="ml-1 h-3 w-3 text-zinc-400" />
    }
  }, [sortField, sortOrder])

  return (
    <div className="space-y-4">
      <Filters onFilterChange={handleFilterChange} />

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        {error && (
          <div className="px-4 py-3 text-sm text-red-400 border-b border-white/10 bg-red-500/5">
            {error}
          </div>
        )}

        {isLoading ? (
          <TableSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-xs text-zinc-500 font-medium"
                      >
                        {header.column.getCanSort() ? (
                          <button
                            className="flex items-center hover:text-zinc-300 transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sortIcon(header.column.id)}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => handleRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <span className="text-xs text-zinc-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}
                {" - "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
                {" of "}
                {pagination.total} transactions
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-zinc-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-zinc-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="text-zinc-400 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <TradeDetailSheet
        transaction={selectedTx}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
