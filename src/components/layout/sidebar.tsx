"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/reports", icon: FileText, label: "Reports" },
  { href: "/assistant", icon: MessageSquare, label: "Assistant" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden h-screen flex-col border-r border-[rgba(255,255,255,0.06)] bg-[#0C0C18] md:flex"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.06)] px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#3BFF82] to-[#06D6A0]">
            <span className="text-xs font-black text-[#06060C]">PT</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-bold tracking-tight text-[#F8F8FC]"
            >
              PolyTax
            </motion.span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggle}
          className="text-[#44445A] hover:text-[#F8F8FC]"
        >
          <ChevronLeft
            className={cn(
              "size-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[rgba(59,255,130,0.08)] text-[#F8F8FC]"
                  : "text-[#8890A8] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#F8F8FC]",
                collapsed && "justify-center"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl border-l-2 border-[#3BFF82] bg-[rgba(59,255,130,0.06)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon
                className={cn(
                  "relative z-10 size-5 shrink-0",
                  isActive ? "text-[#3BFF82]" : ""
                )}
              />
              {!collapsed && (
                <span className="relative z-10">{item.label}</span>
              )}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return <div key={item.href}>{linkContent}</div>
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-[rgba(255,255,255,0.06)] p-3">
          <div className="mb-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111120] p-3">
            <p className="font-mono text-xs font-bold text-[#3BFF82]">
              Tax Year 2025
            </p>
            <p className="mt-1 text-xs text-[#44445A]">
              Filing deadline: April 15, 2026
            </p>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="border-t border-[rgba(255,255,255,0.06)] p-3">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-[#8890A8] hover:text-[#FF3F5C]"
              >
                <LogOut className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Sign out
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full justify-start gap-3 text-[#8890A8] hover:text-[#FF3F5C]"
          >
            <LogOut className="size-5" />
            <span>Sign out</span>
          </Button>
        )}
      </div>
    </motion.aside>
  )
}
