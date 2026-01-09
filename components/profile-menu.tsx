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
import { LogOut, User } from "lucide-react"
import { toast } from "sonner"

interface ProfileMenuProps {
  user?: { name?: string; email?: string } | null
}

export default function ProfileMenu({ user: initialUser }: ProfileMenuProps) {
  const { logout } = useAuth()
  const [user, setUser] = useState<any>(initialUser ?? null)

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser)
    } else {
      try {
        const raw = localStorage.getItem("user")
        if (raw) setUser(JSON.parse(raw))
      } catch (e) {
        // ignore
      }
    }
  }, [initialUser])

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex items-center justify-center h-10 w-10 rounded-full border border-border/50 bg-background/80 hover:bg-accent/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50">
        <Avatar className="h-8 w-8 pointer-events-none">
          <AvatarImage src="/placeholder-user.jpg" alt={user?.name || "User"} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 z-[100]" align="end" sideOffset={8}>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{user?.name ?? "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email ?? "—"}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem 
          className="text-destructive cursor-pointer p-3 focus:bg-destructive/10" 
          onSelect={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
