import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, Users, ArrowRight } from "lucide-react"

const activeContests = [
  {
    id: "weekly-25",
    name: "Weekly Contest #25",
    type: "ICPC",
    participants: 1247,
    timeRemaining: "1h 23m",
    problems: 4,
    solvedByYou: 2,
  },
  {
    id: "algo-masters",
    name: "Algorithm Masters Round 3",
    type: "Codeforces",
    participants: 856,
    timeRemaining: "45m",
    problems: 6,
    solvedByYou: 3,
  },
]

export function ActiveContests() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="font-semibold">Active Contests</h2>
          <p className="text-sm text-muted-foreground">Contests you&apos;re currently participating in</p>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {activeContests.length}
        </span>
      </div>
      
      <div className="divide-y divide-border">
        {activeContests.map((contest) => (
          <div key={contest.id} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{contest.name}</h3>
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {contest.type}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {contest.timeRemaining} left
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {contest.participants.toLocaleString()} participants
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {contest.solvedByYou}/{contest.problems} solved
                  </div>
                  <div className="h-1.5 w-24 rounded-full bg-secondary">
                    <div 
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(contest.solvedByYou / contest.problems) * 100}%` }}
                    />
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href={`/contests/${contest.id}`}>
                    Continue
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
