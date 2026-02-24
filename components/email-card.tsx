"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, ExternalLink, CheckCircle2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EmailItem, EmailStatus } from "@/lib/mock-data"
import { statusLabels } from "@/lib/mock-data"

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

export function EmailCard({ email, onGenerateReply, onCreateJira, onMarkProcessed }: EmailCardProps) {
  return (
    <article className="group rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="flex items-start gap-3 p-5 pb-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground", email.avatarColor)}>
          {email.avatarLetter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-card-foreground truncate">{email.fromName}</span>
            <span className="text-xs text-muted-foreground truncate hidden sm:inline">{email.fromEmail}</span>
          </div>
          <h3 className="mt-1 text-sm font-semibold leading-snug text-card-foreground line-clamp-2">{email.subject}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {email.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                {tag}
              </Badge>
            ))}
            <span className="text-[10px] text-muted-foreground">{email.receivedAt}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5 font-normal", getStatusStyle(email.status))}>
              {statusLabels[email.status]}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
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

      {/* Original email */}
      <div className="mx-5 rounded-lg border border-border bg-muted/50 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Mail className="size-3 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{"原文"}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal ml-auto">
            {email.language}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-card-foreground/80 whitespace-pre-line line-clamp-4">
          {email.originalBody}
        </p>
      </div>

      {/* Translation */}
      <div className="mx-5 mt-2.5 rounded-lg border border-translation-border/30 bg-translation-bg p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-primary">{"中文翻译"}</span>
          <button className="ml-auto text-[10px] text-muted-foreground hover:text-primary transition-colors">
            {"重新翻译"}
          </button>
        </div>
        <p className="text-xs leading-relaxed text-card-foreground whitespace-pre-line line-clamp-4">
          {email.translatedZh}
        </p>
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
