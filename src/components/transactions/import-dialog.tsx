"use client"

import { useState, useCallback } from "react"
import { Upload, Wallet, PenLine, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ImportDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Import Trades
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#0a0a0b] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Import Transactions</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Import your Polymarket trades from a wallet, CSV file, or enter them manually.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="wallet" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="wallet" className="flex-1 gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex-1 gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="mt-4">
            <WalletTab onSuccess={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="csv" className="mt-4">
            <CsvTab onSuccess={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="manual" className="mt-4">
            <ManualTab onSuccess={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function WalletTab({ onSuccess }: { onSuccess: () => void }) {
  const [address, setAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; duplicates: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFetch() {
    if (!address.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "wallet", address: address.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to fetch trades")
      }
      const data = await res.json()
      setResult({ imported: data.imported, duplicates: data.duplicates })
      toast.success(`Imported ${data.imported} trades`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    onSuccess()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Wallet Address</label>
        <Input
          placeholder="0x..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border-white/10 bg-white/5 font-mono text-sm"
          disabled={loading}
        />
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          <span className="text-sm text-zinc-400">Fetching trades from Polymarket...</span>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm text-zinc-300">
            {result.imported} trades imported, {result.duplicates} duplicates skipped
          </span>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result ? (
        <Button onClick={handleConfirm} className="w-full">
          Done
        </Button>
      ) : (
        <Button onClick={handleFetch} disabled={loading || !address.trim()} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            "Fetch Trades"
          )}
        </Button>
      )}
    </div>
  )
}

function CsvTab({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string>("")
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        preview: 5,
      })
      setHeaders(result.meta.fields ?? [])
      setPreview(result.data)
    }
    reader.readAsText(f)
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith(".csv")) handleFile(f)
  }

  async function handleUpload() {
    if (!csvData) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "csv", data: csvData }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to import CSV")
      }
      const data = await res.json()
      toast.success(`Imported ${data.imported} trades`)
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragActive ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload className="mb-2 h-8 w-8 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Drag & drop a CSV file, or{" "}
          <label className="cursor-pointer text-indigo-400 hover:underline">
            browse
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </label>
        </p>
        {file && <p className="mt-2 text-xs text-zinc-500">{file.name}</p>}
      </div>

      {preview.length > 0 && headers.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
          <p className="px-3 py-2 text-xs font-medium text-zinc-400 border-b border-white/10">
            Preview ({preview.length} rows shown)
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  {headers.slice(0, 6).map((h) => (
                    <TableHead key={h} className="text-xs text-zinc-500">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((row, i) => (
                  <TableRow key={i} className="border-white/5">
                    {headers.slice(0, 6).map((h) => (
                      <TableCell key={h} className="text-xs text-zinc-400">
                        {row[h] ?? ""}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button onClick={handleUpload} disabled={loading || !file} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          "Import CSV"
        )}
      </Button>
    </div>
  )
}

function ManualTab({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    marketTitle: "",
    marketId: "",
    outcome: "YES",
    type: "BUY",
    quantity: "",
    pricePerShare: "",
    fee: "0",
    timestamp: "",
  })

  function update(partial: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const qty = parseFloat(form.quantity)
      const price = parseFloat(form.pricePerShare)
      const fee = parseFloat(form.fee || "0")
      const total = qty * price

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: form.marketId || `manual-${Date.now()}`,
          marketTitle: form.marketTitle,
          outcome: form.outcome,
          type: form.type,
          quantity: qty,
          pricePerShare: price,
          totalAmount: total,
          fee,
          timestamp: new Date(form.timestamp).toISOString(),
          importSource: "manual",
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create transaction")
      }
      toast.success("Transaction added")
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const isValid = form.marketTitle && form.quantity && form.pricePerShare && form.timestamp

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Market Title</label>
        <Input
          placeholder="Will X happen by Y date?"
          value={form.marketTitle}
          onChange={(e) => update({ marketTitle: e.target.value })}
          className="border-white/10 bg-white/5 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Outcome</label>
          <Select value={form.outcome} onValueChange={(v) => update({ outcome: v })}>
            <SelectTrigger className="border-white/10 bg-white/5 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YES">YES</SelectItem>
              <SelectItem value="NO">NO</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Type</label>
          <Select value={form.type} onValueChange={(v) => update({ type: v })}>
            <SelectTrigger className="border-white/10 bg-white/5 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
              <SelectItem value="SETTLEMENT">Settlement</SelectItem>
              <SelectItem value="REDEEM">Redeem</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Quantity</label>
          <Input
            type="number"
            step="0.0001"
            placeholder="100"
            value={form.quantity}
            onChange={(e) => update({ quantity: e.target.value })}
            className="border-white/10 bg-white/5 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Price</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.65"
            value={form.pricePerShare}
            onChange={(e) => update({ pricePerShare: e.target.value })}
            className="border-white/10 bg-white/5 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Fee</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.fee}
            onChange={(e) => update({ fee: e.target.value })}
            className="border-white/10 bg-white/5 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-400">Date & Time</label>
        <Input
          type="datetime-local"
          value={form.timestamp}
          onChange={(e) => update({ timestamp: e.target.value })}
          className="border-white/10 bg-white/5 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button onClick={handleSubmit} disabled={loading || !isValid} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Add Transaction"
        )}
      </Button>
    </div>
  )
}
