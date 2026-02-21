"use client"
import { useState, useEffect, useCallback } from "react"

export interface Transaction {
  id: string
  userId: string
  walletId: string | null
  marketId: string
  marketTitle: string
  outcome: "YES" | "NO"
  type: "BUY" | "SELL" | "SETTLEMENT" | "REDEEM"
  quantity: number
  pricePerShare: number
  totalAmount: number
  fee: number
  transactionHash: string | null
  timestamp: Date
  importSource: "api" | "csv" | "manual" | "bot"
  createdAt: Date
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UseTransactionsParams {
  page?: number
  limit?: number
  type?: string
  outcome?: string
  source?: string
  market?: string
  dateFrom?: string
  dateTo?: string
}

interface UseTransactionsReturn {
  transactions: Transaction[]
  pagination: Pagination
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useTransactions(params?: UseTransactionsParams): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.set("page", String(params.page))
      if (params?.limit) searchParams.set("limit", String(params.limit))
      if (params?.type && params.type !== "ALL") searchParams.set("type", params.type)
      if (params?.outcome && params.outcome !== "ALL") searchParams.set("outcome", params.outcome)
      if (params?.source && params.source !== "ALL") searchParams.set("source", params.source)
      if (params?.market) searchParams.set("market", params.market)
      if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom)
      if (params?.dateTo) searchParams.set("dateTo", params.dateTo)

      const res = await fetch(`/api/transactions?${searchParams.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch transactions")

      const data = await res.json()
      setTransactions(
        data.transactions.map((t: Transaction & { timestamp: string; createdAt: string }) => ({
          ...t,
          timestamp: new Date(t.timestamp),
          createdAt: new Date(t.createdAt),
        }))
      )
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }, [
    params?.page,
    params?.limit,
    params?.type,
    params?.outcome,
    params?.source,
    params?.market,
    params?.dateFrom,
    params?.dateTo,
  ])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return { transactions, pagination, isLoading, error, refresh: fetchTransactions }
}
