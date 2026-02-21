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

const features = [
  {
    icon: Calculator,
    title: "Multi-Treatment Tax Engine",
    description:
      "Automatically compute taxes under gambling income (Schedule C), capital gains (Schedule D), or Section 1256 swap contracts -- all in one place.",
  },
  {
    icon: Bot,
    title: "Real-Time Bot Integration",
    description:
      "Connect your Polymarket wallet or import CSVs. Our system syncs your trades in real-time and categorizes each position automatically.",
  },
  {
    icon: TrendingDown,
    title: "Smart Tax-Loss Harvesting",
    description:
      "Identify unrealized losses across your portfolio and optimize your tax position with intelligent harvesting recommendations.",
  },
  {
    icon: FileSpreadsheet,
    title: "Professional Exports",
    description:
      "Generate IRS-ready Form 8949, Schedule D, and custom reports in PDF, Excel, and Word formats for your accountant.",
  },
  {
    icon: Sparkles,
    title: "AI Tax Assistant",
    description:
      "Ask questions about your tax situation in plain English. Our AI assistant understands prediction market tax law and your portfolio.",
  },
  {
    icon: Wallet,
    title: "Multi-Wallet Support",
    description:
      "Track multiple Ethereum wallets and Polymarket accounts. Consolidate all your trading activity into a single tax report.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
}

export function Features() {
  return (
    <section id="features" className="relative bg-[#09090b] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need for{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
              prediction market taxes
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            From importing trades to filing reports, PolyTax Tracker handles the
            entire tax workflow.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_0_40px_-12px_rgba(99,102,241,0.3)]"
            >
              <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 p-3">
                <feature.icon className="size-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
