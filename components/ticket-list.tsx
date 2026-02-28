"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, ExternalLink, Loader2, User, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

interface TicketItem {
  id: string
  title: string
  jiraKey: string | null
  jiraUrl: string | null
  status: string
  jiraStatusRaw?: string | null
  assignee: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: {
    label: "未开始",
    className: "bg-muted text-muted-foreground border-border",
  },
  in_review: {
    label: "待验证",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  },
  completed: {
    label: "已完成",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  },
}

interface TicketListProps {
  refreshSignal: number
}

export function TicketList({ refreshSignal }: TicketListProps) {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch("/api/jira/issues")
      if (res.ok) {
        const data = await res.json()
        setTickets(Array.isArray(data) ? data : [])
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets, refreshSignal])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        <span className="text-sm">{"加载工单列表..."}</span>
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Ticket className="size-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium">{"暂无工单"}</p>
        <p className="text-xs mt-1">{"通过上方分析需求并录入 Jira 后，工单将在此显示"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Ticket className="size-4" />
          {"工单追踪"}
          <Badge variant="secondary" className="text-[10px]">{tickets.length}</Badge>
        </h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => fetchTickets(true)}
          disabled={refreshing}
          title="刷新工单状态"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
        </Button>
      </div>

      <div className="space-y-2">
        {tickets.map((ticket) => {
          const sc = statusConfig[ticket.status] || statusConfig.not_started
          return (
            <div
              key={ticket.id}
              className="rounded-lg border border-border bg-card p-3.5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.jiraKey && (
                      <a
                        href={ticket.jiraUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-primary hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        {ticket.jiraKey}
                        <ExternalLink className="size-2.5" />
                      </a>
                    )}
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 border", sc.className)}>
                      {sc.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium leading-snug truncate">{ticket.title}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    {ticket.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {ticket.assignee}
                      </span>
                    )}
                    {ticket.jiraStatusRaw && (
                      <span className="opacity-60">Jira: {ticket.jiraStatusRaw}</span>
                    )}
                    <span className="opacity-60">
                      {new Date(ticket.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
