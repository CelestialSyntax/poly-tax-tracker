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
      className="hidden h-screen flex-col border-r border-white/[0.06] bg-[#0a0a0b] md:flex"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <span className="text-xs font-bold text-white">PT</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-semibold text-white"
            >
              PolyTax
            </motion.span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggle}
          className="text-zinc-500 hover:text-white"
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
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200",
                collapsed && "justify-center"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg border border-indigo-500/20 bg-gradient-to-r from-indigo-500/20 to-violet-500/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon
                className={cn(
                  "relative z-10 size-5 shrink-0",
                  isActive && "text-indigo-400"
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
        <div className="border-t border-white/[0.06] p-3">
          <div className="mb-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
            <p className="text-xs font-medium text-zinc-400">Tax Year 2025</p>
            <p className="mt-1 text-xs text-zinc-500">
              Filing deadline: April 15, 2026
            </p>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div className="border-t border-white/[0.06] p-3">
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-zinc-400 hover:text-red-400"
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
            className="w-full justify-start gap-3 text-zinc-400 hover:text-red-400"
          >
            <LogOut className="size-5" />
            <span>Sign out</span>
          </Button>
        )}
      </div>
    </motion.aside>
  )
}
