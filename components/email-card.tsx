"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, CheckCircle2, ChevronDown, ChevronUp, Languages, Loader2 } from "lucide-react"
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
  if (score >= 80) return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800"
  if (score >= 65) return "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800"
  if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800"
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
  const [translation, setTranslation] = useState(email.translatedZh || "")
  const [translating, setTranslating] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslation(!showTranslation)
      return
    }

    setShowTranslation(true)
    setTranslating(true)
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: email.originalBody }),
      })
      const data = await res.json()
      if (data.translation) {
        setTranslation(data.translation)
      }
    } catch {
      setTranslation("翻译失败，请重试")
    } finally {
      setTranslating(false)
    }
  }

  return (
    <article className="group rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 pb-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-card-foreground truncate">{email.subject}</h3>
          <div className={cn("shrink-0 flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums", getScoreColor(email.score))}>
            {email.score}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground", email.avatarColor)}>
            {email.avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-card-foreground truncate">{email.fromName}</p>
            <p className="text-xs text-muted-foreground truncate">{email.fromEmail}</p>
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">{email.receivedAt}</span>
        </div>
      </div>

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

      {showTranslation && (
        <div className="mx-5 mt-2.5 rounded-lg border border-translation-border/30 bg-translation-bg p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Languages className="size-3 text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-primary">{"中文翻译"}</span>
          </div>
          {translating ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              {"正在翻译..."}
            </div>
          ) : (
            <ExpandableText text={translation} className="text-card-foreground" />
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-5 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
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
          title={showTranslation ? "收起翻译" : "翻译"}
          onClick={handleTranslate}
          disabled={translating}
        >
          {translating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Languages className="size-3.5" />
          )}
          <span className="sr-only">{"翻译"}</span>
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
