'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Lock, Unlock, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Contest {
  _id: string
  title: string
  startTime: string
  endTime: string
  isPublic: boolean
  isRegistered?: boolean
}

const statusStyles = {
  active: 'bg-success/10 text-success border-success/30',
  upcoming: 'bg-info/10 text-info border-info/30',
  ended: 'bg-muted text-muted-foreground border-border',
}

const statusLabels = {
  active: 'Live',
  upcoming: 'Upcoming',
  ended: 'Ended',
}

function formatDuration(start: string, end: string) {
  const diffMs = new Date(end).getTime() - new Date(start).getTime()
  if (diffMs <= 0) return '0m'
  const diffMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMinutes / 60)
  const mins = diffMinutes % 60
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchContests = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiFetch('/contests')
      setContests(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContests()
  }, [])

  const handleRegister = async (contestId: string) => {
    setActionLoading(contestId)
    try {
      await apiFetch(`/contests/${contestId}/register`, { method: 'POST' })
      setContests((prev) =>
        prev.map((c) => (c._id === contestId ? { ...c, isRegistered: true } : c))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnregister = async (contestId: string) => {
    setActionLoading(contestId)
    try {
      await apiFetch(`/contests/${contestId}/unregister`, { method: 'DELETE' })
      setContests((prev) =>
        prev.map((c) => (c._id === contestId ? { ...c, isRegistered: false } : c))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unregistration failed')
    } finally {
      setActionLoading(null)
    }
  }

  const categorizedContests = (() => {
    const now = new Date()
    const active: Contest[] = []
    const upcoming: Contest[] = []
    const ended: Contest[] = []

    contests.forEach((contest) => {
      const start = new Date(contest.startTime)
      const end = new Date(contest.endTime)

      if (now >= start && now <= end) {
        active.push(contest)
      } else if (now < start) {
        upcoming.push(contest)
      } else {
        ended.push(contest)
      }
    })

    return { active, upcoming, ended }
  })()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Contests</h1>
          <p className="text-muted-foreground">Browse and participate in coding competitions</p>
        </div>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
          <AlertTriangle className="mx-auto h-12 w-12 mb-3" />
          <h2 className="text-lg font-semibold mb-1">Failed to load contests</h2>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchContests} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Contests</h1>
        <p className="text-muted-foreground">Browse and participate in coding competitions</p>
      </div>

      {/* Active Contests */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-success" />
          Active Contests
        </h2>
        {categorizedContests.active.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">
            No live contests at the moment.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categorizedContests.active.map((contest) => (
              <div
                key={contest._id}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{contest.title}</h3>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        {contest.isPublic ? (
                          <span className="flex items-center gap-1">
                            <Unlock className="h-3.5 w-3.5" /> Public
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-warning">
                            <Lock className="h-3.5 w-3.5" /> Private
                          </span>
                        )}
                        {contest.isRegistered && (
                          <span className="flex items-center gap-1 text-success font-medium ml-2">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Registered
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles.active}`}>
                      {statusLabels.active}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(contest.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(contest.startTime, contest.endTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center gap-2">
                  <div>
                    {contest.isRegistered ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={actionLoading === contest._id}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleUnregister(contest._id)}
                      >
                        Leave
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === contest._id}
                        onClick={() => handleRegister(contest._id)}
                      >
                        {actionLoading === contest._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Register Now'
                        )}
                      </Button>
                    )}
                  </div>
                  <Button size="sm" asChild disabled={!contest.isRegistered}>
                    {contest.isRegistered ? (
                      <Link href={`/contests/${contest._id}`}>Enter Contest</Link>
                    ) : (
                      <span className="opacity-50 pointer-events-none">Register to Enter</span>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Contests */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Upcoming Contests</h2>
        {categorizedContests.upcoming.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">
            No upcoming contests scheduled.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <div className="divide-y divide-border">
              {categorizedContests.upcoming.map((contest) => (
                <div key={contest._id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{contest.title}</h3>
                      {contest.isPublic ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          <Unlock className="h-3 w-3" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded bg-warning/10 px-2 py-0.5 text-xs text-warning border border-warning/20">
                          <Lock className="h-3 w-3" /> Private
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(contest.startTime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(contest.startTime, contest.endTime)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {contest.isRegistered ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === contest._id}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleUnregister(contest._id)}
                        >
                          Leave
                        </Button>
                        <Button variant="secondary" size="sm" className="gap-1 text-success pointer-events-none">
                          <CheckCircle2 className="h-4 w-4" /> Registered
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        disabled={actionLoading === contest._id}
                        onClick={() => handleRegister(contest._id)}
                      >
                        {actionLoading === contest._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Register'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Past Contests */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Past Contests</h2>
        {categorizedContests.ended.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-muted-foreground">
            No past contests.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card">
            <div className="divide-y divide-border">
              {categorizedContests.ended.map((contest) => (
                <div key={contest._id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{contest.title}</h3>
                      {contest.isPublic ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          <Unlock className="h-3 w-3" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded bg-warning/10 px-2 py-0.5 text-xs text-warning border border-warning/20">
                          <Lock className="h-3 w-3" /> Private
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(contest.startTime).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(contest.startTime, contest.endTime)}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/contests/${contest._id}`}>View Results</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}