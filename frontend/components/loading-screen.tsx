import { cn } from '@/lib/utils'

type LoadingScreenProps = {
  message?: string
  className?: string
}

function LoadingScreen({
  message = 'Initializing...',
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 text-foreground',
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.22_0.01_260/0.45),transparent_36%),radial-gradient(circle_at_bottom_right,oklch(0.65_0.2_145/0.14),transparent_28%),linear-gradient(to_bottom,transparent,oklch(0.17_0.01_260/0.2))]" />
      <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-28 right-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card/80 px-8 py-7 shadow-2xl backdrop-blur-md">
        <div
          className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-4"
          role="status"
          aria-label="Loading"
        >
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <span className="size-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="size-2 rounded-full bg-primary animate-bounce" />
        </div>
        <p className="text-sm font-medium tracking-[0.24em] text-muted-foreground uppercase">
          {message}
        </p>
      </div>
    </div>
  )
}

export { LoadingScreen }