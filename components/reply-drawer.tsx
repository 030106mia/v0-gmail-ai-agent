"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Save, Sparkles, Loader2, Languages, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EmailItem } from "@/lib/types"

interface ReplyDrawerProps {
  email: EmailItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveAsReplied: (id: string) => void
}

const toneOptions = [
  { label: "正式", value: "formal" },
  { label: "友好", value: "friendly" },
  { label: "简短", value: "brief" },
] as const

type Tone = (typeof toneOptions)[number]["value"]

export function ReplyDrawer({ email, open, onOpenChange, onSaveAsReplied }: ReplyDrawerProps) {
  const [tone, setTone] = useState<Tone>("formal")
  const [replyText, setReplyText] = useState("")
  const [translatedReply, setTranslatedReply] = useState("")
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)

  const isChinese = email?.language === "中文" || email?.language === "Chinese"

  const generateReply = useCallback(async (targetEmail: EmailItem, targetTone: Tone) => {
    setGenerating(true)
    setError(null)
    setReplyText("")
    setTranslatedReply("")

    try {
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: targetEmail.fromName,
          subject: targetEmail.subject,
          body: targetEmail.originalBody,
          tone: targetTone,
          language: targetEmail.language,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "生成失败")
      }

      setReplyText(data.reply)
      if (data.translatedReply) {
        setTranslatedReply(data.translatedReply)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成回复失败，请重试")
    } finally {
      setGenerating(false)
    }
  }, [])

  const handleToneChange = (newTone: Tone) => {
    setTone(newTone)
    if (started && email) {
      generateReply(email, newTone)
    }
  }

  const handleStart = () => {
    setStarted(true)
    if (email) {
      generateReply(email, tone)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStarted(false)
      setReplyText("")
      setTranslatedReply("")
      setError(null)
      setCopied(false)
    }
    onOpenChange(nextOpen)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(replyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    if (email) {
      onSaveAsReplied(email.id)
      onOpenChange(false)
    }
  }

  if (!email) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">{"AI 生成回信"}</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {"回复"} {email.fromName} {"的"} {email.subject}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Tone selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{"语气风格"}</label>
            <div className="flex gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleToneChange(option.value)}
                  disabled={generating}
                  className={cn(
                    "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                    tone === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reply content area */}
          {!started ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-lg border border-dashed border-border bg-muted/20">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Wand2 className="size-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{"准备就绪"}</p>
              <p className="text-xs text-muted-foreground/70 mb-5">{"选择语气风格后，点击下方按钮开始生成回复"}</p>
              <Button onClick={handleStart} className="gap-2">
                <Sparkles className="size-3.5" />
                {"开始生成"}
              </Button>
            </div>
          ) : (
            <>
              {/* Reply editor */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  {"回复内容"}
                  {!isChinese && replyText && (
                    <span className="ml-2 text-[10px] font-normal text-primary">({email.language})</span>
                  )}
                </label>
                {generating ? (
                  <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg border border-border bg-muted/30">
                    <Loader2 className="size-6 animate-spin text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">{"AI 正在生成回复..."}</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg border border-destructive/30 bg-destructive/5">
                    <p className="text-sm text-destructive mb-3">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => generateReply(email, tone)}>
                      {"重试"}
                    </Button>
                  </div>
                ) : (
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[200px] text-sm leading-relaxed resize-none"
                    placeholder="AI 生成的回复将在这里显示..."
                  />
                )}
              </div>

              {/* Chinese translation (only for non-Chinese replies) */}
              {!isChinese && translatedReply && !generating && (
                <div className="rounded-lg border border-translation-border/30 bg-translation-bg p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Languages className="size-3.5 text-primary" />
                    <span className="text-xs font-medium text-primary">{"中文翻译"}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-card-foreground/80 whitespace-pre-line">
                    {translatedReply}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Original reference */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{"原文参考"}</span>
            <p className="mt-1 text-xs leading-relaxed text-card-foreground/80 line-clamp-4 whitespace-pre-line">
              {email.translatedZh || email.originalBody}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex gap-2 shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopy}
            disabled={generating || !replyText}
          >
            <Copy className="size-3.5" />
            {copied ? "已复制" : "复制内容"}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={generating || !replyText}
          >
            <Save className="size-3.5" />
            {"标记已回信"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
