"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame, LayoutDashboard, Trophy, FileCode, Users, Server, Activity, Settings, ArrowLeft } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Contests", href: "/admin/contests", icon: Trophy },
  { name: "Problems", href: "/admin/problems", icon: FileCode },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Workers", href: "/admin/workers", icon: Server },
  { name: "Queue", href: "/admin/queue", icon: Activity },
  // { name: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <Link href="/">
              <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" >CodeForge</span>
              <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">Admin</span>
            </Link>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pl-64">
        {children}
      </main>
    </div>
  )
}
