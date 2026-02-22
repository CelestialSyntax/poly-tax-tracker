"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setIsLoading(true)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })

    setIsLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Registration failed.")
      return
    }

    router.push("/login?registered=true")
  }

  return (
    <div className="flex min-h-screen bg-[#06060C]">
      {/* Left panel — hidden on mobile, static (no animation) */}
      <div className="hidden lg:flex flex-col w-[420px] shrink-0 bg-[#0C0C18] border-r border-[rgba(255,255,255,0.07)] relative overflow-hidden">
        {/* Background orb */}
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(59,255,130,0.12)_0%,transparent_70%)] -translate-x-1/2 translate-y-1/2 pointer-events-none" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3BFF82] to-[#2de070]">
              <span className="text-sm font-bold text-[#06060C]">PT</span>
            </div>
            <span className="text-base font-semibold text-[#F8F8FC]">
              PolyTax Tracker
            </span>
          </Link>

          <div className="flex-1" />

          {/* Quote */}
          <div className="space-y-3">
            <p className="text-3xl font-bold text-[#F8F8FC] leading-tight">
              Start on the right side of the IRS.
            </p>
            <p className="text-sm text-[#8890A8]">
              Set up your account in under 2 minutes.
            </p>
          </div>

          <div className="flex-1" />

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              "Import trades via CSV or Telegram bot",
              "Calculate taxes across 3 treatment modes",
              "Export audit-ready reports instantly",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="size-4 shrink-0 text-[#3BFF82]" />
                <span className="text-sm text-[#8890A8]">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="text-xs text-[#44445A]">
              Not financial advice. Consult a tax professional.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#3BFF82] to-[#2de070]">
              <span className="text-sm font-bold text-[#06060C]">PT</span>
            </div>
            <span className="text-base font-semibold text-[#F8F8FC]">
              PolyTax Tracker
            </span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#F8F8FC]">Create your account</h1>
            <p className="text-sm text-[#8890A8] mt-1">
              Start tracking your Polymarket taxes
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-xs font-medium text-[#8890A8] uppercase tracking-wider"
              >
                Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                required
                className="bg-[#111120] border-[rgba(255,255,255,0.08)] text-[#F8F8FC] placeholder:text-[#44445A] focus:border-[#3BFF82] focus:ring-2 focus:ring-[rgba(59,255,130,0.2)] rounded-xl h-11 px-4"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#8890A8] uppercase tracking-wider"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="bg-[#111120] border-[rgba(255,255,255,0.08)] text-[#F8F8FC] placeholder:text-[#44445A] focus:border-[#3BFF82] focus:ring-2 focus:ring-[rgba(59,255,130,0.2)] rounded-xl h-11 px-4"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#8890A8] uppercase tracking-wider"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="bg-[#111120] border-[rgba(255,255,255,0.08)] text-[#F8F8FC] placeholder:text-[#44445A] focus:border-[#3BFF82] focus:ring-2 focus:ring-[rgba(59,255,130,0.2)] rounded-xl h-11 px-4"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-[#8890A8] uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                className="bg-[#111120] border-[rgba(255,255,255,0.08)] text-[#F8F8FC] placeholder:text-[#44445A] focus:border-[#3BFF82] focus:ring-2 focus:ring-[rgba(59,255,130,0.2)] rounded-xl h-11 px-4"
              />
            </div>

            {error && <p className="text-sm text-[#FF3F5C]">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#3BFF82] text-[#06060C] font-bold rounded-xl hover:bg-[#2de070] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center text-sm text-[#8890A8]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#3BFF82] hover:text-[#2de070] transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
