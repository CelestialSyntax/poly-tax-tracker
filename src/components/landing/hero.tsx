"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Calculator, TrendingUp, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

const floatingCards = [
  {
    icon: TrendingUp,
    label: "Capital Gains",
    value: "+$2,340.50",
    color: "from-emerald-500/20 to-emerald-500/5",
    borderColor: "border-emerald-500/20",
    delay: 0.8,
    position: "top-[15%] left-[8%] lg:left-[12%]",
    drift: { y: [0, -15, 0], x: [0, 8, 0] },
  },
  {
    icon: Shield,
    label: "Tax Saved",
    value: "$890.00",
    color: "from-violet-500/20 to-violet-500/5",
    borderColor: "border-violet-500/20",
    delay: 1.0,
    position: "top-[20%] right-[8%] lg:right-[12%]",
    drift: { y: [0, 12, 0], x: [0, -10, 0] },
  },
  {
    icon: Calculator,
    label: "Transactions",
    value: "1,247",
    color: "from-cyan-500/20 to-cyan-500/5",
    borderColor: "border-cyan-500/20",
    delay: 1.2,
    position: "bottom-[28%] left-[5%] lg:left-[15%]",
    drift: { y: [0, 10, 0], x: [0, -6, 0] },
  },
]

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-[#09090b]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] animate-[drift_15s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.4)_0%,_transparent_70%)]" />
          <div className="absolute top-[20%] right-[-5%] h-[500px] w-[500px] animate-[drift_18s_ease-in-out_infinite_reverse] rounded-full bg-[radial-gradient(circle,_rgba(139,92,246,0.35)_0%,_transparent_70%)]" />
          <div className="absolute bottom-[-10%] left-[30%] h-[700px] w-[700px] animate-[drift_20s_ease-in-out_infinite_2s] rounded-full bg-[radial-gradient(circle,_rgba(6,182,212,0.3)_0%,_transparent_70%)]" />
          <div className="absolute top-[50%] left-[50%] h-[400px] w-[400px] animate-[drift_12s_ease-in-out_infinite_1s_reverse] rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.2)_0%,_transparent_70%)]" />
        </div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* Floating cards - hidden on small screens */}
      <div className="absolute inset-0 z-10 hidden md:block">
        {floatingCards.map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: card.delay }}
            className={`absolute ${card.position}`}
          >
            <motion.div
              animate={card.drift}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`rounded-xl border ${card.borderColor} bg-gradient-to-br ${card.color} p-4 backdrop-blur-xl`}
            >
              <div className="flex items-center gap-3">
                <card.icon className="size-5 text-zinc-300" />
                <div>
                  <p className="text-xs text-zinc-500">{card.label}</p>
                  <p className="text-sm font-semibold text-white">
                    {card.value}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <div className="relative z-20 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-400 backdrop-blur-sm"
        >
          <Calculator className="size-4 text-indigo-400" />
          <span>IRS-compliant tax tracking for prediction markets</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Track Your Polymarket Taxes{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            with Precision
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400"
        >
          Polymarket doesn&apos;t send 1099s. Whether your trades are taxed as
          gambling income, capital gains, or swap contracts, PolyTax handles all
          three IRS treatment modes automatically. Import, calculate, and export
          your tax reports in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="h-12 bg-gradient-to-r from-indigo-500 to-violet-500 px-8 text-base font-semibold text-white hover:from-indigo-600 hover:to-violet-600"
          >
            <Link href="/register">
              Get Started
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 border-white/10 bg-white/5 px-8 text-base text-zinc-300 backdrop-blur-sm hover:bg-white/10 hover:text-white"
          >
            <Link href="#features">Learn More</Link>
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mx-auto mt-20 grid max-w-3xl grid-cols-3 gap-8"
        >
          {[
            { value: "3", label: "Tax Treatments" },
            { value: "100%", label: "IRS Compliant" },
            { value: "PDF/Excel", label: "Export Formats" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-white sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
