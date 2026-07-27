"use client"

import { useEffect, useState } from "react"

const stats = [
  { label: "Active Users", value: 12847, suffix: "+" },
  { label: "Submissions Judged", value: 2400000, suffix: "+" },
  { label: "Problems Available", value: 3250, suffix: "" },
  { label: "Contests Hosted", value: 847, suffix: "" },
]

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [value])
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K"
    }
    return num.toLocaleString()
  }
  
  return (
    <span>
      {formatNumber(count)}{suffix}
    </span>
  )
}

export function StatsSection() {
  return (
    <section className="border-t border-border bg-secondary/30 px-4 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by Competitive Programmers Worldwide
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join thousands of developers and teams who trust CodeForge for their competitive programming needs.
          </p>
        </div>
        
        <div className="mt-16 grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold text-primary lg:text-5xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
