"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileSpreadsheet,
  FileText,
  File,
  Download,
  Loader2,
} from "lucide-react"

type ExportFormat = "excel" | "pdf" | "word"

interface ExportButtonsProps {
  onDownload: (format: ExportFormat) => void
  isDownloading: boolean
}

const exportOptions: {
  format: ExportFormat
  label: string
  description: string
  icon: typeof FileSpreadsheet
  borderColor: string
  textColor: string
  hoverBg: string
  hoverText: string
}[] = [
  {
    format: "excel",
    label: "Excel (.xlsx)",
    description: "Spreadsheet with Summary, Dispositions, Form 8949, and Schedule D sheets",
    icon: FileSpreadsheet,
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
    hoverBg: "hover:bg-emerald-500/10",
    hoverText: "hover:text-emerald-300",
  },
  {
    format: "pdf",
    label: "PDF Report",
    description: "Formatted report suitable for printing or sharing with your tax professional",
    icon: FileText,
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
    hoverBg: "hover:bg-red-500/10",
    hoverText: "hover:text-red-300",
  },
  {
    format: "word",
    label: "Word (.docx)",
    description: "Editable document with all report sections and tax form data",
    icon: File,
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    hoverBg: "hover:bg-blue-500/10",
    hoverText: "hover:text-blue-300",
  },
]

export function ExportButtons({ onDownload, isDownloading }: ExportButtonsProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null)

  function handleClick(format: ExportFormat) {
    setActiveFormat(format)
    onDownload(format)
  }

  const isDisabled = isDownloading

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-5 text-violet-400" />
            Export Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {exportOptions.map((option) => {
              const Icon = option.icon
              const isActive = isDownloading && activeFormat === option.format
              return (
                <Button
                  key={option.format}
                  variant="outline"
                  onClick={() => handleClick(option.format)}
                  disabled={isDisabled}
                  className={`h-auto flex-col gap-2 py-4 ${option.borderColor} ${option.textColor} ${option.hoverBg} ${option.hoverText} transition-all duration-200`}
                >
                  {isActive ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Icon className="size-5" />
                  )}
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[10px] text-muted-foreground font-normal text-center leading-tight">
                    {option.description}
                  </span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
