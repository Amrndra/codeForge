import { 
  Code2, 
  Timer, 
  Trophy, 
  Shield, 
  BarChart3, 
  GitBranch,
  Globe,
  Lock
} from "lucide-react"

const features = [
  {
    icon: Code2,
    title: "Multi-Language Support",
    description: "C, C++, Java, Python, JavaScript, Go, Rust, and more. Compile and run in isolated sandboxes.",
  },
  {
    icon: Timer,
    title: "Precise Time Limits",
    description: "Millisecond-accurate execution timing with configurable memory and time constraints.",
  },
  {
    icon: Trophy,
    title: "Contest Formats",
    description: "ICPC, IOI, Codeforces-style, and custom scoring systems with penalty calculations.",
  },
  {
    icon: Shield,
    title: "Secure Sandboxing",
    description: "Isolated execution environments prevent malicious code from affecting the system.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track contest participation, submission trends, and user performance metrics.",
  },
  {
    icon: GitBranch,
    title: "Version Control",
    description: "Full submission history with diff viewing and code comparison tools.",
  },
  {
    icon: Globe,
    title: "Distributed Workers",
    description: "Deploy judge workers globally for low-latency evaluation across regions.",
  },
  {
    icon: Lock,
    title: "Anti-Cheat System",
    description: "Plagiarism detection and code similarity analysis to maintain fair competition.",
  },
]

export function FeaturesSection() {
  return (
    <section className="border-t border-border px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Competitive Programming
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Everything you need to run competitive programming contests at scale,
            from problem creation to automated judging.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary/10">
                <feature.icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
