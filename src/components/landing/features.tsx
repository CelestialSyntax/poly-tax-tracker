"use client"

import { motion } from "framer-motion"
import {
  Calculator,
  Bot,
  TrendingDown,
  FileSpreadsheet,
  Sparkles,
  Wallet,
} from "lucide-react"

/* ─── Treatment bar visual (Feature 1) ─────────────────────────────────── */
function TreatmentBars() {
  const bars = [
    { label: "Capital Gains", pct: 72, color: "#3BFF82" },
    { label: "Gambling Income", pct: 48, color: "#F7B731" },
    { label: "Business Income", pct: 61, color: "#7B61FF" },
  ]
  return (
    <div className="mt-5 space-y-3">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex justify-between text-xs text-[#8890A8]">
            <span>{b.label}</span>
            <span style={{ color: b.color }}>{b.pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${b.pct}%`, backgroundColor: b.color, opacity: 0.85 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Mini chat bubbles visual (Feature 2) ──────────────────────────────── */
function ChatBubbles() {
  return (
    <div className="mt-5 space-y-2">
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-tr-sm bg-[rgba(59,255,130,0.1)] border border-[rgba(59,255,130,0.15)] px-3 py-2 text-xs text-[#3BFF82] max-w-[80%]">
          Am I taxed on losses?
        </div>
      </div>
      <div className="flex justify-start">
        <div className="rounded-2xl rounded-tl-sm bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] px-3 py-2 text-xs text-[#8890A8] max-w-[85%]">
          Yes — deductible under Schedule C if treated as business income.
        </div>
      </div>
    </div>
  )
}

/* ─── Harvesting visual (Feature 3) ────────────────────────────────────── */
function HarvestVisual() {
  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="rounded-xl border border-[rgba(59,255,130,0.2)] bg-[rgba(59,255,130,0.06)] px-4 py-2.5 text-center">
        <div className="text-mono-num text-lg font-bold text-[#3BFF82]">-$2,340</div>
        <div className="text-xs text-[#8890A8]">harvested</div>
      </div>
      <div className="text-xs text-[#44445A] leading-relaxed">
        Unrealized losses identified across your open positions.
      </div>
    </div>
  )
}

/* ─── Format badges visual (Feature 4) ────────────────────────────────── */
function FormatBadges() {
  const fmts = [
    { label: "PDF", color: "rgba(255,63,92,0.1)", border: "rgba(255,63,92,0.2)", text: "#FF3F5C" },
    { label: "Excel", color: "rgba(59,255,130,0.08)", border: "rgba(59,255,130,0.2)", text: "#3BFF82" },
    { label: "Word", color: "rgba(123,97,255,0.1)", border: "rgba(123,97,255,0.2)", text: "#7B61FF" },
  ]
  return (
    <div className="mt-5 flex items-center gap-2 flex-wrap">
      {fmts.map((f) => (
        <span
          key={f.label}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold border"
          style={{
            backgroundColor: f.color,
            borderColor: f.border,
            color: f.text,
          }}
        >
          {f.label}
        </span>
      ))}
      <span className="text-xs text-[#44445A] ml-1">Form 8949 · Schedule D</span>
    </div>
  )
}

/* ─── Wallet address pills (Feature 5) ─────────────────────────────────── */
function WalletPills() {
  const wallets = ["0x1a2b...9c4f", "0x7f3e...2a1d"]
  return (
    <div className="mt-5 space-y-2">
      {wallets.map((w) => (
        <div
          key={w}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs font-mono text-[#8890A8] mr-2"
        >
          <span className="size-1.5 rounded-full bg-[#3BFF82] inline-block" />
          {w}
        </div>
      ))}
    </div>
  )
}

/* ─── Flow diagram (Feature 6) ─────────────────────────────────────────── */
function FlowDiagram() {
  const nodes = ["Polymarket", "PolyTax API", "Your Report"]
  return (
    <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
      {nodes.map((node, i) => (
        <div key={node} className="flex items-center gap-3">
          <div className="rounded-xl border border-[rgba(59,255,130,0.2)] bg-[rgba(59,255,130,0.06)] px-4 py-2.5 text-sm font-semibold text-[#F8F8FC]">
            {node}
          </div>
          {i < nodes.length - 1 && (
            <div className="flex items-center gap-1 text-[#44445A]">
              <div className="h-px w-6 bg-[rgba(59,255,130,0.3)]" />
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M0 4h7M4 0l4 4-4 4" stroke="#3BFF82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
              </svg>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ─── Feature card definitions ──────────────────────────────────────────── */
const features = [
  {
    id: "engine",
    icon: Calculator,
    title: "Multi-Treatment Tax Engine",
    description:
      "Automatically computes taxes under 3 IRS treatments: gambling income (Schedule C), capital gains (Schedule D), or Section 1256 contracts.",
    visual: <TreatmentBars />,
    colSpan: "lg:col-span-2",
    tall: true,
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "AI Tax Assistant",
    description:
      "Ask plain-English questions about your tax situation.",
    visual: <ChatBubbles />,
    colSpan: "lg:col-span-1",
    tall: false,
  },
  {
    id: "harvest",
    icon: TrendingDown,
    title: "Smart Tax-Loss Harvesting",
    description:
      "Identify unrealized losses and optimize your tax position.",
    visual: <HarvestVisual />,
    colSpan: "lg:col-span-1",
    tall: false,
  },
  {
    id: "exports",
    icon: FileSpreadsheet,
    title: "Professional Exports",
    description:
      "IRS-ready Form 8949, Schedule D. PDF, Excel, Word.",
    visual: <FormatBadges />,
    colSpan: "lg:col-span-1",
    tall: false,
  },
  {
    id: "wallet",
    icon: Wallet,
    title: "Multi-Wallet Support",
    description:
      "Track multiple Ethereum wallets in one consolidated report.",
    visual: <WalletPills />,
    colSpan: "lg:col-span-1",
    tall: false,
  },
]

/* ─── Section ────────────────────────────────────────────────────────────── */
export function Features() {
  return (
    <section id="features" className="relative bg-[#0C0C18] py-32">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#3BFF82]">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F8F8FC]">
            Everything You Need to File with Confidence
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#8890A8]">
            From raw on-chain trades to IRS-ready exports — PolyTax handles the
            entire tax workflow so you don&apos;t have to.
          </p>
        </motion.div>

        {/* Bento grid — rows 1 & 2 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ scale: 1.01 }}
              className={`card-glow group relative flex flex-col rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#111120] p-6 transition-all duration-300 ${f.colSpan}`}
            >
              {/* Icon */}
              <div className="mb-4 inline-flex w-fit rounded-xl bg-[rgba(59,255,130,0.1)] p-2.5">
                <f.icon className="size-5 text-[#3BFF82]" />
              </div>

              {/* Text */}
              <h3 className="text-base font-semibold text-[#F8F8FC]">{f.title}</h3>
              <p className="mt-1.5 text-sm text-[#8890A8]">{f.description}</p>

              {/* Visual supplement */}
              {f.visual}
            </motion.div>
          ))}

          {/* Row 3 — wide banner (col-span-3) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.35 }}
            whileHover={{ scale: 1.005 }}
            className="card-glow group relative rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#111120] p-6 transition-all duration-300 lg:col-span-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1">
                <div className="mb-4 inline-flex w-fit rounded-xl bg-[rgba(59,255,130,0.1)] p-2.5">
                  <Bot className="size-5 text-[#3BFF82]" />
                </div>
                <h3 className="text-base font-semibold text-[#F8F8FC]">
                  Real-Time Bot Integration
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-[#8890A8]">
                  Connect your Telegram bot or Polymarket wallet. Trades sync
                  automatically — no manual imports.
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center sm:justify-end">
                <FlowDiagram />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
