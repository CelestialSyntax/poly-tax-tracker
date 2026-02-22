"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function CTA() {
  return (
    <section className="relative bg-[#06060C] grid-bg py-32">
      {/* Ambient orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,255,130,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6">
        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl border border-[rgba(59,255,130,0.15)] bg-[#111120] p-12 text-center shadow-[0_0_80px_rgba(59,255,130,0.08)] md:p-16"
        >
          {/* Gradient overlay inside card */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(59,255,130,0.03)] to-transparent" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F8F8FC]">
              Ready to Stop Guessing What You Owe?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-[#8890A8]">
              Join prediction market traders who file with confidence. Set up in
              under 2 minutes.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#3BFF82] px-8 h-12 text-sm font-bold text-[#06060C] hover:bg-[#2de070] transition-colors duration-200"
              >
                Start Free
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <p className="mt-5 text-sm text-[#44445A]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#8890A8] hover:text-[#3BFF82] transition-colors duration-150"
              >
                Sign in →
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            "🔒 SOC 2 Compliant",
            "📋 IRS Form 8949 Ready",
            "⚡ No 1099 Required",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm text-[#8890A8]"
            >
              {badge}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative mt-20 border-t border-[rgba(255,255,255,0.06)] pt-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          {/* Logo + brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3BFF82] to-[#7B61FF]">
              <span className="text-xs font-black text-[#06060C]">PT</span>
            </div>
            <span className="text-sm font-semibold text-[#F8F8FC]">
              PolyTax Tracker
            </span>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-[#44445A] text-center sm:text-left">
            Not financial or tax advice. Consult a qualified professional.
          </p>

          {/* Copyright */}
          <p className="text-xs text-[#44445A] sm:text-right">
            &copy; {new Date().getFullYear()} PolyTax Tracker
          </p>
        </div>
      </div>
    </section>
  )
}
