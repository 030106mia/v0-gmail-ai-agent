"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Save, Sparkles } from "lucide-react"
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

function generateReply(email: EmailItem, tone: Tone): string {
  const greetings: Record<Tone, string> = {
    formal: `尊敬的 ${email.fromName}，\n\n感谢您的来信。`,
    friendly: `Hi ${email.fromName}，\n\n谢谢你的邮件！`,
    brief: `${email.fromName}，\n\n收到。`,
  }

  const bodies: Record<Tone, string> = {
    formal: `我已仔细阅读了您关于"${email.subject}"的邮件内容。我们团队对此高度重视，将在最短时间内进行评估并给予答复。\n\n我们会在未来48小时内安排相关人员跟进处理，届时将为您提供详细的解决方案。`,
    friendly: `关于你提到的"${email.subject}"，我已经了解情况了。我会和团队讨论一下，尽快给你一个方案。\n\n有什么问题随时联系我！`,
    brief: `关于"${email.subject}"，已收到并会尽快处理。`,
  }

  const closings: Record<Tone, string> = {
    formal: `\n\n如有任何疑问，请随时与我们联系。\n\n此致敬意`,
    friendly: `\n\n回头聊！`,
    brief: `\n\n谢谢`,
  }

  return greetings[tone] + "\n\n" + bodies[tone] + closings[tone]
}

export function ReplyDrawer({ email, open, onOpenChange, onSaveAsReplied }: ReplyDrawerProps) {
  const [tone, setTone] = useState<Tone>("formal")
  const [replyText, setReplyText] = useState("")
  const [copied, setCopied] = useState(false)

  const handleToneChange = (newTone: Tone) => {
    setTone(newTone)
    if (email) {
      setReplyText(generateReply(email, newTone))
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && email) {
      setReplyText(generateReply(email, tone))
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
            <SheetTitle className="text-base">{"AI ????????"}</SheetTitle>
          </div>
          <SheetDescription className="text-xs">
            {"??"} {email.fromName} {"??"} {email.subject}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Tone selector */}
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{"??????"}</label>
            <div className="flex gap-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleToneChange(option.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
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
            <label className="text-xs font-medium text-muted-foreground mb-2 block">{"????"}</label>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[320px] text-sm leading-relaxed resize-none"
              placeholder="AI ??????????????..."
            />
          </div>

          {/* Original reference */}
          <div className="mt-4 rounded-lg border border-translation-border/30 bg-translation-bg p-3">
            <span className="text-[10px] font-medium uppercase tracking-wide text-primary">{"????"}</span>
            <p className="mt-1 text-xs leading-relaxed text-card-foreground/80 line-clamp-6 whitespace-pre-line">
              {email.translatedZh}
            </p>
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4 flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopy}>
            <Copy className="size-3.5" />
            {copied ? "??????" : "??????"}
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save className="size-3.5" />
            {"?????????"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
