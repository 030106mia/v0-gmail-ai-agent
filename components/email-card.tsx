"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ExternalLink, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EmailItem, EmailStatus } from "@/lib/types"
import { statusLabels } from "@/lib/types"

interface EmailCardProps {
  email: EmailItem
  onGenerateReply: (email: EmailItem) => void
  onCreateJira: (email: EmailItem) => void
  onMarkProcessed: (id: string) => void
}

function getScoreColor(score: number) {
  if (score >= 90) return "text-destructive bg-destructive/10 border-destructive/20"
  if (score >= 70) return "text-warning-foreground bg-warning/20 border-warning/30"
  return "text-muted-foreground bg-muted border-border"
}

function getStatusStyle(status: EmailStatus) {
  switch (status) {
    case "pending":
      return "bg-primary/10 text-primary border-primary/20"
    case "replied":
      return "bg-success/10 text-success border-success/20"
    case "jira_created":
      return "bg-chart-5/10 text-chart-5 border-chart-5/20"
    case "completed":
      return "bg-muted text-muted-foreground border-border"
  }
}

function collapseBlankLines(s: string) {
  return s.split("\n").filter((line) => line.trim() !== "").join("\n")
}

function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)
  const displayText = collapseBlankLines(text)

  useEffect(() => {
    const el = ref.current
    if (el) setClamped(el.scrollHeight > el.clientHeight)
  }, [displayText])

  return (
    <div className="relative">
      <p
        ref={ref}
        className={cn(
          "text-xs leading-relaxed whitespace-pre-line transition-all",
          !expanded && "line-clamp-4",
          className,
        )}
      >
        {displayText}
      </p>
      {clamped && !expanded && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-inherit pointer-events-none" />
      )}
      {(clamped || expanded) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1.5 flex items-center gap-0.5 text-[11px] text-primary hover:text-primary/80 transition-colors font-medium"
        >
          {expanded ? (
            <>{"收起"}<ChevronUp className="size-3" /></>
          ) : (
            <>{"展开全文"}<ChevronDown className="size-3" /></>
          )}
        </button>
      )}
    </div>
  )
}

export function EmailCard({ email, onGenerateReply, onCreateJira, onMarkProcessed }: EmailCardProps) {
  return (
    <article className="group rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="p-5 pb-3 space-y-2.5">
        {/* Row 1: Subject */}
        <h3 className="text-sm font-semibold leading-snug text-card-foreground truncate">{email.subject}</h3>

        {/* Row 2: Avatar + Info + Time/Score */}
        <div className="flex items-center gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground", email.avatarColor)}>
            {email.avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-card-foreground truncate">{email.fromName}</p>
            <p className="text-xs text-muted-foreground truncate">{email.fromEmail}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">{email.receivedAt}</span>
            <div className={cn("flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums", getScoreColor(email.score))}>
              {email.score}
            </div>
            {email.isNew && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                <Sparkles className="size-2.5" />
                New
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Original email */}
      <div className="mx-5 rounded-lg border border-border bg-muted/50 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Mail className="size-3 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{"原文"}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal ml-auto">
            {email.language}
          </Badge>
        </div>
        <ExpandableText text={email.originalBody} className="text-card-foreground/80" />
      </div>

      {/* Translation */}
      <div className="mx-5 mt-2.5 rounded-lg border border-translation-border/30 bg-translation-bg p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-primary">{"中文翻译"}</span>
          <button className="ml-auto text-[10px] text-muted-foreground hover:text-primary transition-colors">
            {"重新翻译"}
          </button>
        </div>
        <ExpandableText text={email.translatedZh} className="text-card-foreground" />
      </div>

      {/* Card footer actions */}
      <div className="flex items-center gap-2 p-5 pt-3">
        <Button
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => onGenerateReply(email)}
        >
          <Mail className="size-3.5" />
          {"生成回信"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => onCreateJira(email)}
        >
          {"录入 Jira"}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          title="查看原邮件"
        >
          <ExternalLink className="size-3.5" />
          <span className="sr-only">{"查看原邮件"}</span>
        </Button>
        {email.status === "pending" && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-success hover:text-success"
            title="标记已处理"
            onClick={() => onMarkProcessed(email.id)}
          >
            <CheckCircle2 className="size-3.5" />
            <span className="sr-only">{"标记已处理"}</span>
          </Button>
        )}
      </div>
    </article>
  )
}
