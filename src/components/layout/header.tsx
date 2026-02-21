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
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#09090b]/80 px-4 backdrop-blur-xl md:px-6">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <Avatar className="size-8 cursor-pointer ring-2 ring-white/10 transition-all hover:ring-indigo-500/50">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-medium text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 border-white/10 bg-[#141416] backdrop-blur-xl"
        >
          {session?.user && (
            <>
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-white">
                  {session.user.name}
                </p>
                {session.user.email && (
                  <p className="text-xs text-zinc-500">{session.user.email}</p>
                )}
              </div>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
            </>
          )}
          <DropdownMenuItem asChild className="cursor-pointer text-zinc-300">
            <Link href="/settings">
              <Settings className="mr-2 size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/[0.06]" />
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
