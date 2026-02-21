"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="relative bg-[#09090b] py-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] animate-[drift_20s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.12)_0%,_transparent_70%)]" />
        <div className="absolute top-0 right-1/4 h-[300px] w-[300px] animate-[drift_15s_ease-in-out_infinite_reverse] rounded-full bg-[radial-gradient(circle,_rgba(6,182,212,0.08)_0%,_transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl md:p-16"
        >
          {/* Gradient border glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-cyan-500/10" />
          <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-500/20 via-transparent to-cyan-500/20 opacity-50" />

          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to simplify your{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Polymarket taxes
              </span>
              ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              Join traders who trust PolyTax Tracker to handle their prediction
              market tax reporting. Get started in under 2 minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-gradient-to-r from-indigo-500 to-violet-500 px-8 text-base font-semibold text-white hover:from-indigo-600 hover:to-violet-600"
              >
                <Link href="/register">
                  Start Tracking Now
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="h-12 px-8 text-base text-zinc-400 hover:text-white"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative mt-20 border-t border-white/[0.06] pt-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
              <span className="text-xs font-bold text-white">PT</span>
            </div>
            <span className="text-sm font-medium text-zinc-400">
              PolyTax Tracker
            </span>
          </div>
          <p className="text-sm text-zinc-600">
            Not tax advice. Consult a qualified tax professional.
          </p>
        </div>
      </div>
    </section>
  )
}
