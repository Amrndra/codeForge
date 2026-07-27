"use client";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function HeroSection() {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden px-4 py-20 lg:px-8 lg:py-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-200 w-200 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm">
          <span className="flex h-2 w-2 rounded-full bg-primary" />
          {user ? `Welcome back, ${user.username}!` : "Welcome to CodeForge!"}
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Build. Solve.
          <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Excel.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
          Master algorithms, solve challenging problems, and rise through live competitive programming
          contests powered by a high-performance distributed judge engine.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/problems">
              Explore Problems
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {!loading && !user ? (
            <Button size="lg" variant="outline" asChild>
              <Link href="/demo">Try Demo</Link>
            </Button>
          ) : null}
          {
            user?.role === "admin" ?
              <Button size="lg" variant="outline" asChild>
                <Link href="/admin/contests">Create Contest</Link>
              </Button> : null
          }
        </div>

        {/* <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">Blazing Fast</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Sub-second judging with distributed worker nodes
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">Auto-Scaling</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Handles traffic spikes with intelligent load balancing
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card/50 p-6 backdrop-blur-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-medium">Real-time</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Live leaderboards and instant submission feedback
            </p>
          </div>
        </div> */}
      </div>
    </section>
  )
}
