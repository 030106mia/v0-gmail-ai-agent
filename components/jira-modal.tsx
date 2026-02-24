"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Copy, Plus } from "lucide-react"
import type { EmailItem } from "@/lib/types"

interface JiraModalProps {
  email: EmailItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateJira: (id: string) => void
}

export function JiraModal({ email, open, onOpenChange, onCreateJira }: JiraModalProps) {
  const [project, setProject] = useState("PROJ")
  const [issueType, setIssueType] = useState("task")
  const [priority, setPriority] = useState("medium")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [copied, setCopied] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && email) {
      setTitle(email.subject)
      setDescription(
        `## 原始邮件\n发件人: ${email.fromName} <${email.fromEmail}>\n\n${email.originalBody}\n\n---\n\n## 中文翻译\n\n${email.translatedZh}`
      )
      setCopied(false)
    }
    onOpenChange(nextOpen)
  }

  const handleCreate = () => {
    if (email) {
      onCreateJira(email.id)
      onOpenChange(false)
    }
  }

  const handleCopyDescription = async () => {
    await navigator.clipboard.writeText(description)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!email) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base">{"录入 Jira 工单"}</DialogTitle>
          <DialogDescription className="text-xs">
            {"根据邮件内容自动创建 Jira 工单"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Project and type row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{"项目 (Project)"}</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROJ">PROJ - 主项目</SelectItem>
                  <SelectItem value="SUPPORT">SUPPORT - 客户支持</SelectItem>
                  <SelectItem value="BUG">BUG - 缺陷修复</SelectItem>
                  <SelectItem value="FEAT">FEAT - 新功能</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{"类型 (Type)"}</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{"优先级"}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="highest">Highest</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="lowest">Lowest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{"标题"}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              placeholder="工单标题"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{"描述"}</Label>
              <button
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                onClick={handleCopyDescription}
              >
                <Copy className="size-2.5" />
                {copied ? "已复制" : "复制为 Jira 描述"}
              </button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[160px] text-xs leading-relaxed resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {"取消"}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="size-3.5" />
            {"创建 Jira"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
