"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  FileCode, 
  Users, 
  Server, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Plus,
  RefreshCw
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type DashboardStats = {
  totalProblems: number;
  activeContests: number;
  registeredUsers: number;
  workersOnline: number;
  workersTotal: number;
  queueStats: {
    pending: number;
    judging: number;
    completed: number;
    failed: number;
  };
  recentSubmissions: Array<{
    id: string;
    user: string;
    problem: string;
    verdict: string;
    time: string;
  }>;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchStats = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      const res = await apiFetch("/admin/stats")
      if (res && res.data) {
        setStats(res.data)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error fetching stats",
        description: err.message || "Failed to load dashboard statistics",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => {
      fetchStats()
    }, 10000) // Auto-refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statsConfig = [
    { label: "Active Contests", value: stats?.activeContests ?? 0, icon: Trophy, color: "text-primary" },
    { label: "Total Problems", value: stats?.totalProblems ?? 0, icon: FileCode, color: "text-info" },
    { label: "Registered Users", value: stats?.registeredUsers ?? 0, icon: Users, color: "text-success" },
    { label: "Worker Nodes", value: stats ? `${stats.workersOnline}/${stats.workersTotal}` : "0/0", icon: Server, color: "text-warning" },
  ]

  const queueStats = stats?.queueStats ?? {
    pending: 0,
    judging: 0,
    completed: 0,
    failed: 0,
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your competitive programming platform</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchStats(true)} 
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/problems">
              <Plus className="mr-2 h-4 w-4" />
              Add Problem
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/contests">
              <Plus className="mr-2 h-4 w-4" />
              Create Contest
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Queue Status */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="font-semibold">Queue Status</h2>
              <p className="text-sm text-muted-foreground">Submission processing overview</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/queue">View Details</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 p-6">
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <div className="mt-2 text-3xl font-bold">{queueStats.pending}</div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-info" />
                <span className="text-sm text-muted-foreground">Judging</span>
              </div>
              <div className="mt-2 text-3xl font-bold">{queueStats.judging}</div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <div className="mt-2 text-3xl font-bold">{queueStats.completed.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-error" />
                <span className="text-sm text-muted-foreground">Failed</span>
              </div>
              <div className="mt-2 text-3xl font-bold">{queueStats.failed}</div>
            </div>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="font-semibold">Recent Submissions</h2>
              <p className="text-sm text-muted-foreground">Latest judged submissions</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/queue">View All</Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {stats?.recentSubmissions && stats.recentSubmissions.length > 0 ? (
              stats.recentSubmissions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">#{sub.id.slice(-6)}</span>
                      <span className="font-medium">{sub.user}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{sub.problem}</div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      sub.verdict === "Accepted" ? "bg-success/10 text-success" :
                      sub.verdict === "Wrong Answer" ? "bg-error/10 text-error" :
                      "bg-warning/10 text-warning"
                    }`}>
                      {sub.verdict === "Accepted" ? "AC" : sub.verdict === "Wrong Answer" ? "WA" : sub.verdict}
                    </span>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">{sub.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No recent submissions found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}