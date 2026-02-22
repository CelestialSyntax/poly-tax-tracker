"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Zap } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#06060C] grid-bg">
      {/* Ambient orbs */}
      <div
        className="pointer-events-none absolute -top-32 right-[-10%] h-[600px] w-[600px] rounded-full opacity-100"
        style={{
          background: "radial-gradient(circle, rgba(123,97,255,0.15) 0%, transparent 70%)",
          animation: "drift 18s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-[-15%] left-[-8%] h-[700px] w-[700px] rounded-full opacity-100"
        style={{
          background: "radial-gradient(circle, rgba(59,255,130,0.1) 0%, transparent 70%)",
          animation: "drift 20s ease-in-out infinite reverse 2s",
        }}
      />

      {/* Scanline */}
      <div
        className="pointer-events-none absolute left-0 right-0 h-px z-10"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(59,255,130,0.3), transparent)",
          animation: "scan 8s linear infinite",
        }}
      />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-5xl px-6 text-center flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(59,255,130,0.2)] bg-[rgba(59,255,130,0.08)] px-3 py-1 text-xs text-[#3BFF82]"
        >
          <Zap className="size-3" />
          <span>Prediction Market Tax Intelligence</span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] text-[#F8F8FC]"
        >
          Prediction Market Taxes,
          <br />
          <span className="bg-gradient-to-r from-[#3BFF82] to-[#7B61FF] bg-clip-text text-transparent">
            Finally Solved.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16 }}
          className="mx-auto mt-8 max-w-2xl text-base sm:text-lg leading-relaxed text-[#8890A8]"
        >
          Polymarket doesn&apos;t issue 1099s. PolyTax auto-classifies every trade
          across all 3 IRS treatment modes — capital gains, gambling income, or
          business income — and generates audit-ready reports.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3BFF82] px-8 h-12 text-sm font-bold text-[#06060C] hover:bg-[#2de070] transition-colors duration-200"
          >
            Start Free
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.12)] bg-transparent px-8 h-12 text-sm text-[#8890A8] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all duration-200"
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.34 }}
          className="mt-14 flex items-center justify-center gap-8"
        >
          <div className="text-center">
            <div className="text-mono-num text-2xl sm:text-3xl font-bold text-[#3BFF82]">3</div>
            <div className="mt-1 text-xs text-[#8890A8]">IRS Treatments</div>
          </div>
          <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />
          <div className="text-center">
            <div className="text-mono-num text-2xl sm:text-3xl font-bold text-[#3BFF82]">100%</div>
            <div className="mt-1 text-xs text-[#8890A8]">Audit-Ready</div>
          </div>
          <div className="w-px h-8 bg-[rgba(255,255,255,0.08)]" />
          <div className="text-center">
            <div className="text-mono-num text-2xl sm:text-3xl font-bold text-[#3BFF82]">$0</div>
            <div className="mt-1 text-xs text-[#8890A8]">Setup Cost</div>
          </div>
        </motion.div>

        {/* Terminal window — hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.46 }}
          className="hidden sm:block mt-14 w-full max-w-2xl rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#0C0C18] overflow-hidden shadow-[0_0_60px_rgba(59,255,130,0.04)]"
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <span className="size-3 rounded-full bg-[#FF5F57]" />
            <span className="size-3 rounded-full bg-[#FFBD2E]" />
            <span className="size-3 rounded-full bg-[#28C840]" />
            <span className="ml-3 font-mono text-xs text-[#44445A]">
              polytax — tax calculation
            </span>
          </div>
          {/* Terminal body */}
          <div className="px-5 py-4 font-mono text-xs sm:text-sm leading-relaxed text-left">
            <p className="text-[#8890A8]">
              $ polytax calculate --year 2025 --wallet 0x1a2b...
            </p>
            <p className="mt-1 text-[#3BFF82]">
              ✓ Loaded 1,247 trades from Polymarket
            </p>
            <p className="text-[#3BFF82]">✓ Applied FIFO cost basis method</p>
            <p className="mt-1 text-[rgba(255,255,255,0.25)]">
              ─────────────────────────────────────
            </p>
            <p className="text-[#F8F8FC] font-semibold">
              Capital Gains Treatment:
            </p>
            <p className="text-[#8890A8]">
              {"  "}Short-term:{" "}
              <span className="text-[#F8F8FC]">$4,230.00</span>
            </p>
            <p className="text-[#8890A8]">
              {"  "}Long-term:{"  "}
              <span className="text-[#F8F8FC]">$1,890.50</span>
            </p>
            <p className="text-[#8890A8]">
              {"  "}Tax owed:{"   "}
              <span className="text-[#3BFF82] font-semibold">$1,539.40</span>
            </p>
            <p className="mt-2 flex items-center gap-1 text-[#44445A]">
              <span className="inline-block size-2 rounded-full bg-[#3BFF82] animate-pulse" />
              ready
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
