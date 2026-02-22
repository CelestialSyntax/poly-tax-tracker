"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Settings, LogOut } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/reports": "Reports",
  "/assistant": "AI Assistant",
  "/settings": "Settings",
}

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const title = pageTitles[pathname] ?? "Dashboard"

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PT"

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#0C0C18]/90 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-2.5">
        <h1 className="text-sm font-semibold text-[#F8F8FC]">{title}</h1>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3BFF82]" />
          <span className="text-xs text-[#8890A8]">Live</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="size-8 cursor-pointer ring-2 ring-[rgba(255,255,255,0.08)] transition-all hover:ring-[rgba(59,255,130,0.4)]">
            <AvatarFallback className="bg-gradient-to-br from-[#3BFF82] to-[#06D6A0] text-xs font-medium text-[#06060C]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 border-[rgba(255,255,255,0.08)] bg-[#111120] backdrop-blur-xl"
        >
          {session?.user && (
            <>
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[#F8F8FC]">
                  {session.user.name}
                </p>
                {session.user.email && (
                  <p className="text-xs text-[#8890A8]">{session.user.email}</p>
                )}
              </div>
              <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
            </>
          )}
          <DropdownMenuItem asChild className="cursor-pointer text-[#8890A8]">
            <Link href="/settings">
              <Settings className="mr-2 size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.06)]" />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="cursor-pointer text-red-400 focus:text-red-400"
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
