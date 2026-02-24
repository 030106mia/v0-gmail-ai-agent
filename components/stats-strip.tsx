"use client"

import { cn } from "@/lib/utils"
import { Clock, CheckCircle2, Ticket, CircleCheckBig } from "lucide-react"
import type { EmailStatus } from "@/lib/mock-data"

interface StatsStripProps {
  counts: Record<EmailStatus, number>
}

const stats = [
  { key: "pending" as const, label: "待处理", icon: Clock, colorClass: "text-primary bg-primary/10" },
  { key: "replied" as const, label: "已回信", icon: CheckCircle2, colorClass: "text-success bg-success/10" },
  { key: "jira_created" as const, label: "已录入Jira", icon: Ticket, colorClass: "text-chart-5 bg-chart-5/10" },
  { key: "completed" as const, label: "已完成", icon: CircleCheckBig, colorClass: "text-muted-foreground bg-muted" },
]

export function StatsStrip({ counts }: StatsStripProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5",
              stat.colorClass
            )}
          >
            <Icon className="size-3.5" />
            <span className="text-xs font-medium">{stat.label}</span>
            <span className="text-sm font-bold tabular-nums">{counts[stat.key]}</span>
          </div>
        )
      })}
    </div>
  )
}
