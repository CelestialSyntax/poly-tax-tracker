"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { FileBarChart, Loader2 } from "lucide-react"
import { TreatmentComparison } from "@/components/reports/treatment-comparison"
import { Form8949Preview } from "@/components/reports/form-8949-preview"
import { ExportButtons } from "@/components/reports/export-buttons"
import { useReportGenerator } from "@/hooks/use-reports"
import type { TaxTreatment, CostBasisMethod } from "@/lib/tax/types"

export function ReportBuilder() {
  const [taxYear, setTaxYear] = useState("2025")
  const [treatment, setTreatment] = useState<TaxTreatment>("capital_gains")
  const [costBasisMethod, setCostBasisMethod] = useState<CostBasisMethod>("fifo")

  const {
    report,
    comparison,
    isLoading,
    isDownloading,
    generateReport,
    downloadReport,
  } = useReportGenerator()

  async function handleGenerate() {
    await generateReport(parseInt(taxYear), treatment, costBasisMethod)
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="size-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tax Year</Label>
              <Select value={taxYear} onValueChange={setTaxYear}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cost Basis Method</Label>
              <Select
                value={costBasisMethod}
                onValueChange={(v) => setCostBasisMethod(v as CostBasisMethod)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                  <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                  <SelectItem value="specific_id">Specific Identification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tax Treatment</Label>
            <Tabs
              value={treatment}
              onValueChange={(v) => setTreatment(v as TaxTreatment)}
            >
              <TabsList>
                <TabsTrigger value="capital_gains">Capital Gains</TabsTrigger>
                <TabsTrigger value="gambling">Gambling Income</TabsTrigger>
                <TabsTrigger value="business">Business Income</TabsTrigger>
              </TabsList>
              <TabsContent value="capital_gains">
                <p className="text-sm text-muted-foreground mt-2">
                  Report prediction market positions as capital assets under Schedule D / Form 8949.
                  Short-term gains taxed at ordinary rates, long-term at preferential rates.
                </p>
              </TabsContent>
              <TabsContent value="gambling">
                <p className="text-sm text-muted-foreground mt-2">
                  Report winnings as gambling income on Schedule 1, with losses deductible up to
                  winnings (90% limit for 2026 under the One Big Beautiful Bill Act).
                </p>
              </TabsContent>
              <TabsContent value="business">
                <p className="text-sm text-muted-foreground mt-2">
                  Report as business income on Schedule C. Allows full loss deduction but subject
                  to self-employment tax (15.3% on 92.35% of net income).
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileBarChart className="size-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-6">
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && report && (
        <>
          <TreatmentComparison comparison={comparison ?? undefined} />
          <Form8949Preview lines={report.form8949Lines} />
          <ExportButtons
            onDownload={(format) =>
              downloadReport(format, parseInt(taxYear), treatment, costBasisMethod)
            }
            isDownloading={isDownloading}
          />
        </>
      )}
    </div>
  )
}
