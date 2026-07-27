import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CTASection() {
  return (
    <section className="border-t border-border px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to Start Competing?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Create your free account and join the next contest. No setup required,
          just start coding.
        </p>
        
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contests">Browse Contests</Link>
          </Button>
        </div>
        
        <p className="mt-6 text-sm text-muted-foreground">
          Free forever for individuals. Organization plans available.
        </p>
      </div>
    </section>
  )
}
