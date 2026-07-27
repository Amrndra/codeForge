import Link from "next/link"
import { Button } from "@/components/ui/button"

type Verdict = "Accepted" | "Wrong Answer" | "Time Limit" | "Runtime Error" | "Pending"

const submissions = [
  {
    id: "sub-001",
    problem: "Two Sum",
    problemId: "two-sum",
    verdict: "Accepted" as Verdict,
    language: "C++",
    time: "12ms",
    memory: "8.2 MB",
    submittedAt: "2 min ago",
  },
  {
    id: "sub-002",
    problem: "Binary Search Tree",
    problemId: "bst",
    verdict: "Wrong Answer" as Verdict,
    language: "Python",
    time: "-",
    memory: "-",
    submittedAt: "15 min ago",
  },
  {
    id: "sub-003",
    problem: "Graph Traversal",
    problemId: "graph-dfs",
    verdict: "Time Limit" as Verdict,
    language: "Java",
    time: "2000ms",
    memory: "64 MB",
    submittedAt: "1 hour ago",
  },
  {
    id: "sub-004",
    problem: "Dynamic Programming",
    problemId: "dp-knapsack",
    verdict: "Accepted" as Verdict,
    language: "C++",
    time: "45ms",
    memory: "12 MB",
    submittedAt: "2 hours ago",
  },
]

const verdictStyles: Record<Verdict, string> = {
  "Accepted": "bg-success/10 text-success",
  "Wrong Answer": "bg-error/10 text-error",
  "Time Limit": "bg-warning/10 text-warning",
  "Runtime Error": "bg-error/10 text-error",
  "Pending": "bg-muted text-muted-foreground",
}

const verdictLabels: Record<Verdict, string> = {
  "Accepted": "AC",
  "Wrong Answer": "WA",
  "Time Limit": "TLE",
  "Runtime Error": "RE",
  "Pending": "...",
}

export function RecentSubmissions() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 className="font-semibold">Recent Submissions</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/submissions">View all</Link>
        </Button>
      </div>
      
      <div className="divide-y divide-border">
        {submissions.map((submission) => (
          <Link
            key={submission.id}
            href={`/submissions/${submission.id}`}
            className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-sm">{submission.problem}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{submission.language}</span>
                <span>&middot;</span>
                <span>{submission.submittedAt}</span>
              </div>
            </div>
            <span className={`ml-4 rounded px-2 py-1 text-xs font-medium ${verdictStyles[submission.verdict]}`}>
              {verdictLabels[submission.verdict]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
