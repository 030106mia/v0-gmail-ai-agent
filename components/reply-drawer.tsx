"use client"

import { useState, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Save, Sparkles, Loader2 } from "lucide-react"
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
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateReply = useCallback(async (targetEmail: EmailItem, targetTone: Tone) => {
    setGenerating(true)
    setError(null)
    setReplyText("")

    try {
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: targetEmail.fromName,
          subject: targetEmail.subject,
          body: targetEmail.originalBody,
          tone: targetTone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "生成失败")
      }

      setReplyText(data.reply)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成回复失败，请重试")
    } finally {
      setGenerating(false)
    }
  }, [])

  const handleToneChange = (newTone: Tone) => {
    setTone(newTone)
    if (email) {
      generateReply(email, newTone)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && email) {
      generateReply(email, tone)
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <SheetTitle className="text-base">{"AI 生成回信"}</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            {"回复"} {email.fromName} {"的"} {email.subject}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Tone selector */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{"语气风格"}</label>
            <div className="flex gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleToneChange(option.value)}
                  disabled={generating}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                    tone === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reply editor */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{"回复内容"}</label>
            {generating ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] rounded-lg border border-border bg-muted/30">
                <Loader2 className="size-6 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">{"AI 正在生成回复..."}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button variant="outline" size="sm" onClick={() => generateReply(email, tone)}>
                  {"重试"}
                </Button>
              </div>
            ) : (
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[320px] text-sm leading-relaxed resize-none"
                placeholder="AI 生成的回复将在这里显示..."
              />
            )}
          </div>

          {/* Original reference */}
          <div className="mt-4 rounded-lg border border-translation-border/30 bg-translation-bg p-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-primary">{"原文参考"}</span>
            <p className="mt-1 text-xs leading-relaxed text-card-foreground/80 line-clamp-6 whitespace-pre-line">
              {email.translatedZh || email.originalBody}
            </p>
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4 flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy} disabled={generating || !replyText}>
            <Copy className="size-3.5" />
            {copied ? "已复制" : "复制内容"}
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={generating || !replyText}>
            <Save className="size-3.5" />
            {"标记已回信"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
