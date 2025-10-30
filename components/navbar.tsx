"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import {
  Bell,
  Search,
  Menu,
  X,
  Home,
  FileText,
  Brain,
  MessageSquare,
  BookOpen,
  LogOut,
  Briefcase
} from "lucide-react"
import ProfileMenu from "@/components/profile-menu"
import Link from "next/link"

export function Navbar() {
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mountedState, setMountedState] = useState(false)

  // Keep the same hydration-guard behaviour but use the auth context
  // mountedState is only used to avoid rendering interactive elements during SSR -> CSR hydration
  useEffect(() => {
    setMountedState(true)
  }, [])

  const handleLogout = () => {
    try {
      logout()
    } catch (e) {
      // If context logout fails for any reason, fallback to clearing storage and routing
      try {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
      } catch {}
      router.push("/login")
    }
    toast.success("Logged out successfully")
  }

  const navigationItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Resume", href: "/resume", icon: FileText },
    { name: "Assessments", href: "/assessments", icon: Brain },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Jobs", href: "/jobs", icon: Briefcase },
    { name: "Chat", href: "/chat", icon: MessageSquare },
  ]

  // Prevent hydration mismatch
  if (!mountedState) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">ProPath</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg border border-border/50 bg-background/80" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden font-bold sm:inline-block">ProPath</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center">
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                size="sm"
                onClick={() => router.push(item.href)}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Right side items */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            {/* <Search className="h-4 w-4" /> */}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            {/* <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge> */}
          </Button>

          {/* Theme Switcher - Prominent top corner positioning */}
          <div className="flex items-center ml-2">
            <ThemeSwitcher />
          </div>

          {/* User Menu - always show profile icon + menu (logout available) */}
          <ProfileMenu user={user} />

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigationItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  router.push(item.href)
                  setIsMobileMenuOpen(false)
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Button>
            ))}
          </div>
          <div className="border-t px-2 py-3">
            {/* Mobile Theme Switcher */}
            <div className="flex justify-center mb-3">
              <ThemeSwitcher />
            </div>
            
            {user ? (
              <div className="space-y-2">
                {/* <div className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt={user.name} />
                    <AvatarFallback>
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div> */}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/login")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/register")
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
