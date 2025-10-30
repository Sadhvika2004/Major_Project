"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { toast } from "sonner"

interface ProfileMenuProps {
  user?: { name?: string; email?: string; role?: string } | null
}

export default function ProfileMenu({ user: initialUser }: ProfileMenuProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const [user, setUser] = useState<any>(initialUser ?? null)

  useEffect(() => {
    if (!initialUser) {
      try {
        const raw = localStorage.getItem("user")
        if (raw) setUser(JSON.parse(raw))
      } catch (e) {
        // ignore
      }
    }
  }, [initialUser])

  const handleLogout = () => {
    try {
      // Use central auth logout to ensure consistent behavior (clears storage + redirects)
      logout()
      toast.success("Logged out")
    } catch (e) {
      // Fallback: clear storage and navigate to login
      try {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("token")
      } catch {}
      toast.success("Logged out")
    }
  }

  return (
    <DropdownMenu>
      {/* Use Radix trigger directly to avoid asChild/Slot event forwarding issues */}
      <DropdownMenuTrigger className="relative h-8 w-8 rounded-full">
        <div className="h-8 w-8">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt={user?.name || "User"} />
            <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
          </Avatar>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <p className="text-sm font-medium leading-none">{user?.name ?? "Unknown User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email ?? "—"}</p>
            {user?.role && (
              <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Keep a simple, clear action area */}
        <DropdownMenuItem className="text-destructive cursor-pointer" onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
