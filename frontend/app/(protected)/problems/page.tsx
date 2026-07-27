"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiFetch from "@/lib/api"; // adjust path if required

import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

const difficultyColors = {
  Easy: "text-success bg-success/10",
  Medium: "text-warning bg-warning/10",
  Hard: "text-error bg-error/10",
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All Difficulties");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);

        let response = await apiFetch("/problems/all");

        // assign indexes to problems
        response.data = response.data.map((problem: any, index: number) => ({
          ...problem,
          index: index + 1, // Assign index starting from 1
        }));

        setProblems(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []);

  // Filter problems by search query and difficulty
  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === "All Difficulties" || problem.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Problems</h1>
        <p className="text-muted-foreground">Practice coding problems by difficulty and topic</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All Difficulties">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Total: </span>
          <span className="font-medium">{problems.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Solved: </span>
          <span className="font-medium text-success">{problems.filter(p => p.solved).length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Easy: </span>
          <span className="font-medium">{problems.filter(p => p.difficulty === "Easy").length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Medium: </span>
          <span className="font-medium">{problems.filter(p => p.difficulty === "Medium").length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Hard: </span>
          <span className="font-medium">{problems.filter(p => p.difficulty === "Hard").length}</span>
        </div>
      </div>

      {/* Problems Table */}
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="px-6 py-4 font-medium w-12">Index</th>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Difficulty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem) => (
                <tr key={problem._id} className="hover:bg-secondary/30">
                  {/* Index */}
                  <td className="px-6 py-4">
                    <span className="font-medium">{problem.index}</span>
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="font-medium hover:text-primary"
                    >
                      {problem.title}
                    </Link>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${difficultyColors[problem.difficulty as keyof typeof difficultyColors]}`}>
                      {problem.difficulty}
                    </span>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No problems match your search/filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-{filteredProblems.length} of {filteredProblems.length} problems
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
