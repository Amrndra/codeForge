'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Lock, Unlock, Timer, Loader2, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { Trophy } from "lucide-react";

interface Problem {
  problem: {
    _id: string
    title: string
    difficulty: 'Easy' | 'Medium' | 'Hard'
    slug: string
  },
  points: number
}

interface Contest {
  _id: string
  title: string
  description: string
  problems: Problem[]
  startTime: string
  endTime: string
  isPublic: boolean
  createdBy: string
}

const difficultyColors = {
  Easy: 'text-success',
  Medium: 'text-warning',
  Hard: 'text-error',
}

function getCountdownText(targetDate: Date) {
  const diffMs = targetDate.getTime() - new Date().getTime()
  if (diffMs <= 0) return '00:00:00'
  const seconds = Math.floor((diffMs / 1000) % 60)
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60)
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24)
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const pad = (num: number) => String(num).padStart(2, '0')
  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
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

export default function ContestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [contest, setContest] = useState<Contest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState('')

  const fetchContestDetails = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiFetch(`/contests/${id}`)
      console.log('Fetched contest details:', response.data)
      setContest(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contest details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchContestDetails()
  }, [id])

  useEffect(() => {
    if (!contest) return

    const updateCountdown = () => {
      const now = new Date()
      const start = new Date(contest.startTime)
      const end = new Date(contest.endTime)

      if (now < start) {
        setCountdown(`Starts in: ${getCountdownText(start)}`)
      } else if (now >= start && now <= end) {
        setCountdown(getCountdownText(end))
      } else {
        setCountdown('Ended')
      }
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [contest])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !contest) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center text-destructive">
          <AlertTriangle className="mx-auto h-12 w-12 mb-3" />
          <h2 className="text-lg font-semibold mb-1">Failed to load contest</h2>
          <p className="mb-4 text-sm text-muted-foreground">{error || 'Contest not found.'}</p>
          <div className="flex justify-center gap-4">
            <Button onClick={fetchContestDetails} variant="outline">
              Try Again
            </Button>
            <Button asChild>
              <Link href="/contests">Back to Contests</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const start = new Date(contest.startTime)
  const end = new Date(contest.endTime)
  const isLive = now >= start && now <= end

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Contest Header */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{contest.title}</h1>
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
                {start.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(contest.startTime, contest.endTime)}
              </span>
            </div>
          </div>

          {/* <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 text-3xl font-mono font-bold text-primary">
                <Timer className="h-6 w-6" />
                {countdown}
              </div>
              <div className="text-sm text-muted-foreground">
                {isLive ? 'Time Remaining' : now < start ? 'Contest Schedule' : 'Status'}
              </div>
            </div>
          </div> */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-2 text-3xl font-mono font-bold text-primary">
                <Timer className="h-6 w-6" />
                {countdown}
              </div>

              <div className="text-sm text-muted-foreground">
                {isLive ? "Time Remaining" : now < start ? "Contest Schedule" : "Status"}
              </div>
            </div>

            <Button asChild>
              <Link href={`/contests/${contest._id}/leaderboard`}>
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Contest Description */}
      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-3">About the Contest</h2>
        <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {contest.description}
        </p>
      </div>

      {/* Problems Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Contest Problems</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="px-6 py-4 font-medium w-16">#</th>
                <th className="px-6 py-4 font-medium">Problem</th>
                <th className="px-6 py-4 font-medium">Difficulty</th>
                <th className="px-6 py-4 font-medium">Points</th>
                <th className="px-6 py-4 font-medium text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contest.problems.map((object, index) => (
                <tr key={object.problem._id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium">
                    {String.fromCharCode(65 + index)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/problems/${object.problem.slug}?contestId=${contest._id}&returnTo=/contests/${contest._id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {object.problem.title}
                    </Link>
                  </td>
                  <td className={`px-6 py-4 font-medium ${difficultyColors[object.problem.difficulty]}`}>
                    {object.problem.difficulty}
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">{object.points}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" asChild>
                      <Link href={`/problems/${object.problem.slug}?contestId=${contest._id}&returnTo=/contests/${contest._id}`}>
                        Solve
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {contest.problems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No problems assigned to this contest.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
