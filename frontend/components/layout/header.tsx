"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Flame, Menu, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const baseNavigation = [
  { name: "Contests", href: "/contests" },
  { name: "Problems", href: "/problems" },
  { name: "Submissions", href: "/submissions" }
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const resolveAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) {
      return '';
    }

    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }

    return `${BACKEND_BASE_URL}/${avatarUrl}`.replace(/([^:]\/)\/+/g, '$1');
  }
  const { user } = useAuth()

  const navigation = user?.role === "admin"
    ? [
      ...baseNavigation,
      { name: "Admin", href: "/admin/contests" }
    ]
    : baseNavigation

  const initials = user?.fullName
    ? user.fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
    : user?.username?.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CodeForge</span>
          </Link>

          <div className="hidden md:flex md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {!user && (
          <div className="hidden md:flex md:items-center md:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        )}

        {user && (
          <div className="hidden md:flex md:items-center md:gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile" aria-label="Edit profile">
                <Avatar className="size-8 border border-border">
                  <AvatarImage src={resolveAvatarUrl(user.avatarUrl)} alt={user.fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/logout">Logout</Link>
            </Button>
          </div>
        )}

        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {!user && (
              <div className="flex flex-col gap-2 pt-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
            {user && (
              <div className="flex flex-col gap-2 pt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile">
                    <Avatar className="mr-2 size-5">
                      <AvatarImage src={resolveAvatarUrl(user.avatarUrl)} alt={user.fullName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/logout">Logout</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
