import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Clock } from "lucide-react"

const upcomingContests = [
  {
    id: "div2-round-45",
    name: "Division 2 Round #45",
    type: "Codeforces",
    startsIn: "2 days",
    duration: "2h",
    registeredCount: 2341,
    isRegistered: true,
  },
  {
    id: "monthly-challenge",
    name: "Monthly Challenge May",
    type: "IOI",
    startsIn: "5 days",
    duration: "5h",
    registeredCount: 1876,
    isRegistered: false,
  },
  {
    id: "beginner-contest",
    name: "Beginner Friendly Contest #12",
    type: "Educational",
    startsIn: "1 week",
    duration: "3h",
    registeredCount: 543,
    isRegistered: false,
  },
]

export function UpcomingContests() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="font-semibold">Upcoming Contests</h2>
          <p className="text-sm text-muted-foreground">Register early to get notified</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/contests">View all</Link>
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {upcomingContests.map((contest) => (
          <div key={contest.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{contest.name}</h3>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  {contest.type}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Starts in {contest.startsIn}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {contest.duration}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {contest.registeredCount.toLocaleString()} registered
                </span>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant={contest.isRegistered ? "outline" : "default"}
              asChild
            >
              <Link href={`/contests/${contest.id}`}>
                {contest.isRegistered ? "Registered" : "Register"}
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
