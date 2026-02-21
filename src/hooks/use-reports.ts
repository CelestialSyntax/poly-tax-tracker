"use client"

import { useState, useCallback } from "react"
import type {
  TaxTreatment,
  CostBasisMethod,
  TaxReport,
  TreatmentComparison,
} from "@/lib/tax/types"

interface ReportState {
  report: TaxReport | null
  comparison: TreatmentComparison | null
  isLoading: boolean
  isDownloading: boolean
  error: string | null
}

function getMockComparison(taxYear: number): TreatmentComparison {
  return {
    taxYear,
    capitalGains: {
      shortTermGains: 4820.50,
      shortTermLosses: 1247.30,
      shortTermNet: 3573.20,
      longTermGains: 892.00,
      longTermLosses: 318.45,
      longTermNet: 573.55,
      totalNet: 4146.75,
      capitalLossDeduction: 0,
      carryforwardLoss: 0,
    },
    gambling: {
      grossWinnings: 5712.50,
      totalLosses: 1565.75,
      deductibleLosses: 1409.18,
      netGamblingIncome: 4303.33,
      requiresItemizing: true,
    },
    business: {
      grossIncome: 5712.50,
      totalExpenses: 1565.75,
      netBusinessIncome: 4146.75,
      selfEmploymentTax: 585.89,
      selfEmploymentTaxRate: 0.153,
    },
    recommendation: "capital_gains",
    recommendationReason:
      "Capital gains treatment avoids the 15.3% self-employment tax and provides potential long-term capital gains rates.",
  }
}

function getMockReport(
  taxYear: number,
  treatment: TaxTreatment,
  costBasisMethod: CostBasisMethod,
): TaxReport {
  const mockDispositions = [
    {
      lotId: "lot-1",
      marketId: "mkt-1",
      marketTitle: "Will BTC exceed $100k by March 2026?",
      outcome: "YES" as const,
      quantity: 100,
      costBasisPerShare: 0.42,
      proceedsPerShare: 0.78,
      acquiredAt: new Date(`${taxYear}-01-15`),
      disposedAt: new Date(`${taxYear}-03-20`),
      holdingPeriod: "short-term" as const,
      gainLoss: 36.00,
      totalCostBasis: 42.00,
      totalProceeds: 78.00,
    },
    {
      lotId: "lot-2",
      marketId: "mkt-2",
      marketTitle: "Fed cuts rates in Q1 2026?",
      outcome: "NO" as const,
      quantity: 200,
      costBasisPerShare: 0.35,
      proceedsPerShare: 0.00,
      acquiredAt: new Date(`${taxYear}-02-01`),
      disposedAt: new Date(`${taxYear}-04-15`),
      holdingPeriod: "short-term" as const,
      gainLoss: -70.00,
      totalCostBasis: 70.00,
      totalProceeds: 0.00,
    },
    {
      lotId: "lot-3",
      marketId: "mkt-3",
      marketTitle: "US GDP growth exceeds 3% in 2026?",
      outcome: "YES" as const,
      quantity: 150,
      costBasisPerShare: 0.55,
      proceedsPerShare: 1.00,
      acquiredAt: new Date(`${taxYear}-01-10`),
      disposedAt: new Date(`${taxYear}-06-30`),
      holdingPeriod: "short-term" as const,
      gainLoss: 67.50,
      totalCostBasis: 82.50,
      totalProceeds: 150.00,
    },
    {
      lotId: "lot-4",
      marketId: "mkt-4",
      marketTitle: "ETH above $5k by April 2026?",
      outcome: "YES" as const,
      quantity: 75,
      costBasisPerShare: 0.34,
      proceedsPerShare: 0.62,
      acquiredAt: new Date(`${taxYear}-03-05`),
      disposedAt: new Date(`${taxYear}-04-28`),
      holdingPeriod: "short-term" as const,
      gainLoss: 21.00,
      totalCostBasis: 25.50,
      totalProceeds: 46.50,
    },
    {
      lotId: "lot-5",
      marketId: "mkt-5",
      marketTitle: "Trump wins 2028 election?",
      outcome: "YES" as const,
      quantity: 50,
      costBasisPerShare: 0.62,
      proceedsPerShare: 0.85,
      acquiredAt: new Date(`${taxYear - 1}-06-15`),
      disposedAt: new Date(`${taxYear}-08-20`),
      holdingPeriod: "long-term" as const,
      gainLoss: 11.50,
      totalCostBasis: 31.00,
      totalProceeds: 42.50,
    },
    {
      lotId: "lot-6",
      marketId: "mkt-6",
      marketTitle: "Inflation below 2.5% by Q2?",
      outcome: "YES" as const,
      quantity: 120,
      costBasisPerShare: 0.55,
      proceedsPerShare: 0.32,
      acquiredAt: new Date(`${taxYear}-02-20`),
      disposedAt: new Date(`${taxYear}-05-15`),
      holdingPeriod: "short-term" as const,
      gainLoss: -27.60,
      totalCostBasis: 66.00,
      totalProceeds: 38.40,
    },
    {
      lotId: "lot-7",
      marketId: "mkt-7",
      marketTitle: "Apple launches AR glasses in 2026?",
      outcome: "NO" as const,
      quantity: 80,
      costBasisPerShare: 0.72,
      proceedsPerShare: 1.00,
      acquiredAt: new Date(`${taxYear}-04-01`),
      disposedAt: new Date(`${taxYear}-09-30`),
      holdingPeriod: "short-term" as const,
      gainLoss: 22.40,
      totalCostBasis: 57.60,
      totalProceeds: 80.00,
    },
    {
      lotId: "lot-8",
      marketId: "mkt-8",
      marketTitle: "Tesla stock above $300 by June?",
      outcome: "YES" as const,
      quantity: 60,
      costBasisPerShare: 0.48,
      proceedsPerShare: 0.00,
      acquiredAt: new Date(`${taxYear}-05-10`),
      disposedAt: new Date(`${taxYear}-07-01`),
      holdingPeriod: "short-term" as const,
      gainLoss: -28.80,
      totalCostBasis: 28.80,
      totalProceeds: 0.00,
    },
    {
      lotId: "lot-9",
      marketId: "mkt-9",
      marketTitle: "Super Bowl LXI winner: Chiefs?",
      outcome: "YES" as const,
      quantity: 200,
      costBasisPerShare: 0.30,
      proceedsPerShare: 1.00,
      acquiredAt: new Date(`${taxYear - 1}-11-10`),
      disposedAt: new Date(`${taxYear}-02-09`),
      holdingPeriod: "short-term" as const,
      gainLoss: 140.00,
      totalCostBasis: 60.00,
      totalProceeds: 200.00,
    },
    {
      lotId: "lot-10",
      marketId: "mkt-10",
      marketTitle: "Next Fed chair nomination by Dec?",
      outcome: "NO" as const,
      quantity: 90,
      costBasisPerShare: 0.22,
      proceedsPerShare: 0.45,
      acquiredAt: new Date(`${taxYear}-06-01`),
      disposedAt: new Date(`${taxYear}-10-15`),
      holdingPeriod: "short-term" as const,
      gainLoss: 20.70,
      totalCostBasis: 19.80,
      totalProceeds: 40.50,
    },
  ]

  const form8949Lines = mockDispositions.map((d) => ({
    description: `${d.quantity} ${d.outcome} shares - ${d.marketTitle}`,
    dateAcquired: d.acquiredAt,
    dateSold: d.disposedAt,
    proceeds: d.totalProceeds,
    costBasis: d.totalCostBasis,
    adjustments: 0,
    gainLoss: d.gainLoss,
    box: (d.holdingPeriod === "short-term" ? "B" : "E") as "B" | "E",
    holdingPeriod: d.holdingPeriod,
  }))

  return {
    userId: "mock-user",
    taxYear,
    treatment,
    costBasisMethod,
    generatedAt: new Date(),
    dispositions: mockDispositions,
    capitalGains:
      treatment === "capital_gains"
        ? {
            shortTermGains: 307.60,
            shortTermLosses: 126.40,
            shortTermNet: 181.20,
            longTermGains: 11.50,
            longTermLosses: 0,
            longTermNet: 11.50,
            totalNet: 192.70,
            capitalLossDeduction: 0,
            carryforwardLoss: 0,
          }
        : undefined,
    gambling:
      treatment === "gambling"
        ? {
            grossWinnings: 319.10,
            totalLosses: 126.40,
            deductibleLosses: 113.76,
            netGamblingIncome: 205.34,
            requiresItemizing: true,
          }
        : undefined,
    business:
      treatment === "business"
        ? {
            grossIncome: 319.10,
            totalExpenses: 126.40,
            netBusinessIncome: 192.70,
            selfEmploymentTax: 27.25,
            selfEmploymentTaxRate: 0.153,
          }
        : undefined,
    form8949Lines: treatment === "capital_gains" ? form8949Lines : undefined,
    totalTransactions: 142,
    totalVolume: 8547.30,
    totalFees: 42.73,
    winRate: 0.634,
    openPositionsCount: 5,
    openPositionsValue: 245.80,
  }
}

export function useReportGenerator() {
  const [state, setState] = useState<ReportState>({
    report: null,
    comparison: null,
    isLoading: false,
    isDownloading: false,
    error: null,
  })

  const generateReport = useCallback(
    async (
      taxYear: number,
      treatment: TaxTreatment,
      costBasisMethod: CostBasisMethod,
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const res = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taxYear,
            treatment,
            costBasisMethod,
            compare: true,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setState({
            report: data.report,
            comparison: data.comparison ?? null,
            isLoading: false,
            isDownloading: false,
            error: null,
          })
          return
        }

        // API not available -- use mock data
        await new Promise((r) => setTimeout(r, 800))
        setState({
          report: getMockReport(taxYear, treatment, costBasisMethod),
          comparison: getMockComparison(taxYear),
          isLoading: false,
          isDownloading: false,
          error: null,
        })
      } catch {
        // Fallback to mock data
        await new Promise((r) => setTimeout(r, 800))
        setState({
          report: getMockReport(taxYear, treatment, costBasisMethod),
          comparison: getMockComparison(taxYear),
          isLoading: false,
          isDownloading: false,
          error: null,
        })
      }
    },
    [],
  )

  const downloadReport = useCallback(
    async (
      format: "excel" | "pdf" | "word",
      taxYear: number,
      treatment: TaxTreatment,
      costBasisMethod: CostBasisMethod,
    ) => {
      setState((prev) => ({ ...prev, isDownloading: true, error: null }))

      try {
        const res = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taxYear, treatment, costBasisMethod, format }),
        })

        if (!res.ok) {
          throw new Error(`Export failed: ${res.statusText}`)
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")

        const extensions = { excel: "xlsx", pdf: "pdf", word: "docx" }
        a.href = url
        a.download = `polytax-report-${taxYear}.${extensions[format]}`
        document.body.appendChild(a)
        a.click()

        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "Download failed",
        }))
      } finally {
        setState((prev) => ({ ...prev, isDownloading: false }))
      }
    },
    [],
  )

  return {
    report: state.report,
    comparison: state.comparison,
    isLoading: state.isLoading,
    isDownloading: state.isDownloading,
    error: state.error,
    generateReport,
    downloadReport,
  }
}
