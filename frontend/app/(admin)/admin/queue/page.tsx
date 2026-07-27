"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  AlertTriangle
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

type QueueItem = {
  id: string;
  submissionId: string;
  user: string;
  problem: string;
  language: string;
  status: "judging" | "pending";
  worker: string | null;
  elapsed: string;
};

type RecentResult = {
  id: string;
  user: string;
  problem: string;
  verdict: string;
  time: string;
  memory: string;
};

type QueueStats = {
  pending: number;
  judging: number;
};

const statusConfig = {
  judging: { icon: Activity, color: "text-info", bg: "bg-info/10", label: "Judging" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pending" },
  failed: { icon: AlertTriangle, color: "text-error", bg: "bg-error/10", label: "Failed" },
}

export default function QueuePage() {
  const [stats, setStats] = useState<QueueStats>({ pending: 0, judging: 0 })
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [recentResults, setRecentResults] = useState<RecentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchQueueData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      const res = await apiFetch("/admin/queue")
      if (res && res.data) {
        setStats(res.data.stats || { pending: 0, judging: 0 })
        setQueueItems(res.data.queueItems || [])
        setRecentResults(res.data.recentResults || [])
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error fetching queue details",
        description: err.message || "Failed to load queue status",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchQueueData()
    const interval = setInterval(() => {
      fetchQueueData()
    }, 5000) // Auto-refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && queueItems.length === 0 && recentResults.length === 0) {
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
          <h1 className="text-2xl font-bold">Submission Queue</h1>
          <p className="text-muted-foreground">Monitor real-time submission processing</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => fetchQueueData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Activity className="h-5 w-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.judging}</div>
              <div className="text-sm text-muted-foreground">Judging</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Active Queue */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Active Queue</h2>
              {queueItems.filter(i => i.status === "judging").length > 0 && (
                <span className="flex h-2 w-2 animate-pulse rounded-full bg-success" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">{queueItems.length} items</span>
          </div>
          <div className="max-h-[500px] overflow-auto">
            {queueItems.length > 0 ? (
              <div className="divide-y divide-border">
                {queueItems.map((item) => {
                  const status = statusConfig[item.status] || statusConfig.pending
                  const StatusIcon = status.icon
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30">
                      <div className="flex items-center gap-4 overflow-hidden mr-2">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${status.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">#{item.submissionId.slice(-6)}</span>
                            <span className="font-medium truncate">{item.user}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="truncate">{item.problem}</span>
                            <span>&middot;</span>
                            <span className="font-mono">{item.language}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${status.color}`}>{status.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.worker ? item.worker : `Waiting ${item.elapsed}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No active jobs in the queue
              </div>
            )}
          </div>
        </div>

        {/* Recent Results */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold">Recent Results</h2>
            <span className="text-sm text-muted-foreground">Latest submissions</span>
          </div>
          <div className="divide-y divide-border">
            {recentResults.length > 0 ? (
              recentResults.map((result) => (
                <div key={result.id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30">
                  <div className="flex items-center gap-4 overflow-hidden mr-2">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      result.verdict === "Accepted" ? "bg-success/10" :
                      result.verdict === "Wrong Answer" ? "bg-error/10" :
                      "bg-warning/10"
                    }`}>
                      {result.verdict === "Accepted" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : result.verdict === "Wrong Answer" ? (
                        <XCircle className="h-4 w-4 text-error" />
                      ) : (
                        <Clock className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">#{result.id.slice(-6)}</span>
                        <span className="font-medium truncate">{result.user}</span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{result.problem}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-medium ${
                      result.verdict === "Accepted" ? "text-success" :
                      result.verdict === "Wrong Answer" ? "text-error" :
                      "text-warning"
                    }`}>
                      {result.verdict === "Accepted" ? "AC" :
                       result.verdict === "Wrong Answer" ? "WA" : result.verdict}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.time} / {result.memory}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No recent results found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
