import { ReportBuilder } from "@/components/reports/report-builder"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Tax Reports</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Generate, compare, and export your Polymarket tax reports across all treatment modes
        </p>
      </div>
      <ReportBuilder />
    </div>
  )
}
