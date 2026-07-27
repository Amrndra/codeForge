"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "../../../../../lib/api"
import { useParams } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"
import { Search, TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from "lucide-react"

interface LeaderboardUser {
  _id: string;
  rank: number;
  username: string;
  score: number;
  penalty: number;
  solved: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { id } = useParams<{ id: string }>();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(
          `/contests/${id}/leaderboard`
        );
        setUsers(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [id]);

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  )
  if (filteredUsers.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        No participants yet...
      </div>
    )
  }
  return (

    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Rankings based on contest performance and problem solving</p>
      </div>

      {/* Top 3 Podium */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {filteredUsers.slice(0, 3).map((user, index) => (
          <div
            key={user.username}
            className={`relative rounded-xl border border-border bg-card p-6 ${index === 0 ? "md:order-2 md:-mt-4" : index === 1 ? "md:order-1" : "md:order-3"
              }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              {index === 0 && <Trophy className="h-8 w-8 text-yellow-500" />}
              {index === 1 && <Medal className="h-8 w-8 text-gray-400" />}
              {index === 2 && <Award className="h-8 w-8 text-orange-600" />}
            </div>
            <div className="mt-4 text-center">
              <div className="text-3xl font-bold">#{user.rank}</div>
              <div className={`mt-2 text-xl font-semibold `}>
                {user.username}
              </div>
              <div className="text-sm text-muted-foreground"></div>
              <div className={`mt-3 text-2xl font-mono font-bold `}>
                {user.score}
              </div>
              <div className="mt-2 flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{user.solved} solved</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-sm text-muted-foreground">
              <th className="px-6 py-4 font-medium">Rank</th>
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Score</th>
              <th className="px-6 py-4 font-medium">Penalty</th>
              <th className="px-6 py-4 font-medium">Solved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <tr
                key={user._id}
                className={`${user.isCurrentUser ? "bg-primary/10" : "hover:bg-secondary/30"}`}
              >
                <td className="px-6 py-4">
                  <span className="font-medium">#{user.rank}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className={`font-medium  ${user.isCurrentUser ? "font-semibold" : ""}`}>
                        {user.username}
                        {user.isCurrentUser && " (you)"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-mono font-bold `}>
                    {user.score}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-mono`}>
                    {user.penalty + " min"}
                  </span>
                </td>
                <td>
                  {user.solved}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
