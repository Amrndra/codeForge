import { Trophy, Target, CheckCircle2, TrendingUp } from "lucide-react"

const stats = [
  {
    label: "Rating",
    value: "1847",
    change: "+52",
    trend: "up",
    icon: Trophy,
    color: "text-primary",
  },
  {
    label: "Problems Solved",
    value: "342",
    change: "+12 this week",
    trend: "up",
    icon: CheckCircle2,
    color: "text-success",
  },
  {
    label: "Contests Participated",
    value: "28",
    change: "3 upcoming",
    trend: "neutral",
    icon: Target,
    color: "text-accent",
  },
  {
    label: "Global Rank",
    value: "#1,247",
    change: "+89 positions",
    trend: "up",
    icon: TrendingUp,
    color: "text-warning",
  },
]

export function UserStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <span className="text-xs text-muted-foreground">{stat.change}</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
