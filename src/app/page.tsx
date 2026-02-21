import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { CTA } from "@/components/landing/cta"

export default function LandingPage() {
  return (
    <div className="bg-[#09090b]">
      <Hero />
      <Features />
      <CTA />
    </div>
  )
}
