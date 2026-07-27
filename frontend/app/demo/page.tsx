import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Code2,
  Crown,
  Gauge,
  LayoutDashboard,
  Mail,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const availableFeatures = [
  "Browse problems",
  "View contests",
  "Leaderboard",
  "Admin dashboard",
]

const limitedFeatures = [
  "Code execution depends on worker availability",
  "Submission execution may be limited in this demo environment",
]

export default function DemoPage() {
  return (
    <main className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-112 w-md -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-secondary/60 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="mx-auto w-full max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4 rounded-full border-border/60 px-3 py-1">
            Demo Environment
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            CodeForge Demo
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            This is a demo environment for CodeForge, an asynchronous online judge built around a
            Redis-backed queue and worker-based code execution. It is intended to showcase the
            product experience described in the README without requiring full production access.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-primary/20 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="space-y-3 border-b border-border/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">User Demo Credentials</CardTitle>
                  <CardDescription>Use these credentials to explore the user flow.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-4">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Username</p>
                  <p className="text-muted-foreground">demoUser</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-4">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">demo_user@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-4">
                <LockKeyhole className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-muted-foreground">123456</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="space-y-3 border-b border-border/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">Admin Demo Credentials</CardTitle>
                  <CardDescription>Use these credentials to view the admin experience.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-amber-500/5 p-4">
                <BadgeCheck className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium">Username</p>
                  <p className="text-muted-foreground">admin</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-amber-500/5 p-4">
                <Mail className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">admin@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-amber-500/5 p-4">
                <LockKeyhole className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-muted-foreground">admin</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="border-b border-border/60 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Gauge className="h-5 w-5 text-primary" />
                Limits
              </CardTitle>
              <CardDescription>
                Demo traffic is intentionally constrained to keep the environment predictable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 px-4 py-4">
                <Badge className="rounded-full">200 submissions / day</Badge>
                <span className="text-sm text-muted-foreground">
                  Redis-based rate limiting is used to keep submission volume under control.
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4">
                <CircleAlert className="mt-0.5 h-4 w-4 text-warning" />
                <p className="text-sm text-muted-foreground">
                  Run and code execution may be limited depending on worker availability.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="border-b border-border/60 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Code2 className="h-5 w-5 text-primary" />
                Environment Notes
              </CardTitle>
              <CardDescription>
                CodeForge uses asynchronous judging so the API stays responsive while workers handle execution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
              <p>
                The demo mirrors the product flow in the README: users can browse problems, inspect
                contests, and review leaderboards while execution remains worker-backed.
              </p>
              <Separator />
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-4 text-foreground">
                <PlayCircle className="h-4 w-4 text-primary" />
                <span>Some submissions may queue or pause while worker capacity is unavailable.</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="border-b border-border/60 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Available Features
              </CardTitle>
              <CardDescription>Features available in this demo experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {availableFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="border-b border-border/60 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CircleAlert className="h-5 w-5 text-amber-500" />
                Limited / Not Available
              </CardTitle>
              <CardDescription>Execution behavior can vary in the demo environment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {limitedFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-3 rounded-lg border border-border/60 bg-amber-500/5 px-4 py-3">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border-border/60 bg-card/90 shadow-sm backdrop-blur-sm">
            <CardContent className="flex flex-col items-start justify-between gap-6 px-6 py-6 sm:flex-row sm:items-center">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Ready to explore CodeForge?</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  Head to login to use the demo credentials, or return to the homepage to continue browsing the product overview.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/login">Go to Login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}