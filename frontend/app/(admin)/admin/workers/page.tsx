"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  Server, 
  Activity, 
  RefreshCw, 
  CheckCircle2,
  XCircle
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type WorkerStatus = "busy" | "idle" | "offline"

type WorkerType = {
  id: string;
  workerId: string;
  status: WorkerStatus;
  currentJob: string | null;
  jobsProcessed: number;
  startedAt: string;
  uptime: string;
  lastSeen: string;
};

const statusConfig = {
  idle: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Idle" },
  busy: { icon: Activity, color: "text-info", bg: "bg-info/10", label: "Busy" },
  offline: { icon: XCircle, color: "text-error", bg: "bg-error/10", label: "Offline" },
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerType[]>([])
  const [stats, setStats] = useState({ activeCount: 0, busyCount: 0, idleCount: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchWorkers = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      const res = await apiFetch("/admin/workers")
      if (res && res.data) {
        setWorkers(res.data.workers || [])
        setStats({
          activeCount: res.data.activeCount || 0,
          busyCount: res.data.busyCount || 0,
          idleCount: res.data.idleCount || 0
        })
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error fetching workers",
        description: err.message || "Failed to load worker status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
    const interval = setInterval(() => {
      fetchWorkers()
    }, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && workers.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Worker Nodes</h1>
          <p className="text-muted-foreground">Monitor state and throughput of platform judge processes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchWorkers(true)} 
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top-Level Worker Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Server className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.activeCount}</div>
              <div className="text-sm text-muted-foreground">Active/Online Workers</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Activity className="h-5 w-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold text-info">{stats.busyCount}</div>
              <div className="text-sm text-muted-foreground">Busy Workers</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{stats.idleCount}</div>
              <div className="text-sm text-muted-foreground">Idle Workers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Worker List Grid */}
      {workers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {workers.map((worker) => {
            const status = statusConfig[worker.status] || statusConfig.offline
            const StatusIcon = status.icon

            return (
              <div
                key={worker.id}
                className={`rounded-xl border bg-card p-6 transition-all duration-200 hover:shadow-md ${
                  worker.status === "offline" ? "border-border opacity-60" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${status.bg}`}>
                      <Server className={`h-5 w-5 ${status.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold font-mono truncate text-sm md:text-base">{worker.workerId}</h3>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Last heartbeat: {worker.lastSeen}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.bg} ${status.color}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-secondary/30 p-3">
                      <div className="text-xs text-muted-foreground">Jobs Processed</div>
                      <div className="text-xl font-bold mt-1">{worker.jobsProcessed}</div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3">
                      <div className="text-xs text-muted-foreground">Running Uptime</div>
                      <div className="text-xl font-bold mt-1">{worker.uptime}</div>
                    </div>
                  </div>

                  {worker.status === "busy" && worker.currentJob && (
                    <div className="rounded-lg bg-info/5 border border-info/10 px-4 py-3">
                      <div className="text-xs text-info/70 font-semibold uppercase tracking-wider">Current Job</div>
                      <div className="font-mono text-sm mt-1 text-info font-medium break-all">{worker.currentJob}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3">
                    <span>Started At: {worker.startedAt ? new Date(worker.startedAt).toLocaleString() : "-"}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <Server className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">No active workers found</h3>
          <p className="mt-1 text-sm">Start your judge workers to see their details here.</p>
        </div>
      )}
    </div>
  )
}
