"use client";

import { useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import apiFetch from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: "admin" | "user";
  createdAt: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace("/api/v1", "");

function resolveAvatarUrl(url?: string) {
  if (!url) return "/default-avatar.png";
  if (url.startsWith("http")) return url;
  return `${API_BASE}/${url}`.replace(/([^:]\/)\/+/g, "$1");
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Safely redirect if user is loaded and is not an admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      redirect("/");
    }
  }, [user, authLoading]);

  // Fetch users once the admin user session is validated and loaded
  useEffect(() => {
    if (authLoading || !user || user.role !== "admin") return;
    (async () => {
      try {
        const res = await apiFetch("/users/all-users");
        setUsers(res.data ?? []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  // Filter users by matching username, fullName, or email
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      (u.username?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center">Loading users...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage registered users</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm">
          {users.length} Users
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search username, name or email..."
          className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border text-left text-sm text-muted-foreground">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-secondary/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={resolveAvatarUrl(u.avatarUrl)} alt={u.fullName}
                          className="h-10 w-10 rounded-full border object-cover" />
                        <div>
                          <div className="font-medium">{u.fullName}</div>
                          <div className="text-xs text-muted-foreground">{u._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{u.username}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${u.role === "admin"
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No users match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}