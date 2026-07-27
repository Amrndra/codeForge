import Link from "next/link"
import { Code2, Trophy, BookOpen, Settings } from "lucide-react"

const actions = [
  {
    icon: Code2,
    label: "Practice Problems",
    description: "Solve problems by topic",
    href: "/problems",
  },
  {
    icon: Trophy,
    label: "Join Contest",
    description: "Browse active contests",
    href: "/contests",
  },
  {
    icon: BookOpen,
    label: "Learn",
    description: "Tutorials and guides",
    href: "/learn",
  },
  {
    icon: Settings,
    label: "Settings",
    description: "Account preferences",
    href: "/settings",
  },
]

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-3 p-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex flex-col items-center rounded-lg border border-border bg-secondary/30 p-4 text-center transition-colors hover:bg-secondary"
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm font-medium">{action.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{action.description}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
