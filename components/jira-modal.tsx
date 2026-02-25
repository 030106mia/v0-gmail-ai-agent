"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Copy, Plus, Loader2, ExternalLink, AlertCircle, Lock, Sparkles } from "lucide-react"
import type { EmailItem } from "@/lib/types"

interface JiraIssueType {
  id: string
  name: string
}

interface JiraPriority {
  id: string
  name: string
}

interface JiraModalProps {
  email: EmailItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateJira: (id: string, jiraKey: string) => void
}

export function JiraModal({ email, open, onOpenChange, onCreateJira }: JiraModalProps) {
  const [projectKey, setProjectKey] = useState("")
  const [issueType, setIssueType] = useState("Task")
  const [priority, setPriority] = useState("Medium")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [copied, setCopied] = useState(false)

  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([])
  const [priorities, setPriorities] = useState<JiraPriority[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [metaLoaded, setMetaLoaded] = useState(false)

  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdIssue, setCreatedIssue] = useState<{ key: string; url: string } | null>(null)

  const metaLoadedRef = useRef(false)
  metaLoadedRef.current = metaLoaded

  const fetchMetadata = useCallback(async () => {
    setLoadingMeta(true)
    setMetaError(null)
    try {
      const res = await fetch("/api/jira/projects")
      const data = await res.json()

      if (!res.ok) {
        setMetaError(data.error || "获取 Jira 数据失败")
        return
      }

      if (data.projectKey) setProjectKey(data.projectKey)
      if (data.priorities) setPriorities(data.priorities)
      if (data.issueTypes) setIssueTypes(data.issueTypes)
      setMetaLoaded(true)
      metaLoadedRef.current = true
    } catch {
      setMetaError("网络错误，无法连接 Jira")
    } finally {
      setLoadingMeta(false)
    }
  }, [])

  useEffect(() => {
    if (open && email) {
      setTitle(email.subject)
      setDescription("")
      setCopied(false)
      setCreateError(null)
      setCreatedIssue(null)
      setAiError(null)
      setIssueType("Task")
      setPriority("Medium")

      if (!metaLoadedRef.current) {
        fetchMetadata()
      }
    }
  }, [open, email, fetchMetadata])

  const handleAiGenerate = async () => {
    if (!email) return

    setAiGenerating(true)
    setAiError(null)
    try {
      const res = await fetch("/api/ai/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: email.fromName,
          fromEmail: email.fromEmail,
          subject: email.subject,
          body: email.originalBody,
          translatedBody: email.translatedZh,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAiError(data.error || "AI 生成失败")
        return
      }

      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description)
    } catch {
      setAiError("网络错误，无法调用 AI")
    } finally {
      setAiGenerating(false)
    }
  }

  const handleCreate = async () => {
    if (!email || !title) return

    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/jira/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueTypeName: issueType,
          priorityName: priority,
          summary: title,
          description,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCreateError(data.error || "创建失败")
        return
      }

      setCreatedIssue({ key: data.key, url: data.url })
      onCreateJira(email.id, data.key)
    } catch {
      setCreateError("网络错误，无法创建 Jira 工单")
    } finally {
      setCreating(false)
    }
  }

  const handleCopyDescription = async () => {
    await navigator.clipboard.writeText(description)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!email) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{"录入 Jira 工单"}</DialogTitle>
          <DialogDescription className="text-xs">
            {"工单将创建到 Backlog 中"}
          </DialogDescription>
        </DialogHeader>

        {createdIssue ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="size-14 rounded-full bg-success/10 flex items-center justify-center">
              <Plus className="size-7 text-success" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">{"工单创建成功"}</p>
              <p className="text-xs text-muted-foreground">{createdIssue.key}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={createdIssue.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                {"在 Jira 中查看"}
              </a>
            </Button>
          </div>
        ) : (
          <>
            {metaError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{metaError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4 py-2">
              {/* 锁定项目展示 */}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                <Lock className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{"目标项目"}</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {loadingMeta ? "加载中..." : projectKey || "FILO"}
                </Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">{"Backlog"}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">{"类型 (Type)"}</Label>
                  <Select value={issueType} onValueChange={setIssueType} disabled={loadingMeta}>
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.length > 0 ? (
                        issueTypes.map((t) => (
                          <SelectItem key={t.id} value={t.name}>
                            {t.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Task">Task</SelectItem>
                          <SelectItem value="Bug">Bug</SelectItem>
                          <SelectItem value="Story">Story</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">{"优先级"}</Label>
                  <Select value={priority} onValueChange={setPriority} disabled={loadingMeta}>
                    <SelectTrigger className="h-9 w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.length > 0 ? (
                        priorities.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Highest">Highest</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Lowest">Lowest</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-8 border-dashed"
                onClick={handleAiGenerate}
                disabled={aiGenerating || !email}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {"AI 生成中..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    {"AI 写工单"}
                  </>
                )}
              </Button>

              {aiError && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">{"标题"}</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-sm"
                  placeholder="工单标题"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{"描述"}</Label>
                  <button
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    onClick={handleCopyDescription}
                  >
                    <Copy className="size-2.5" />
                    {copied ? "已复制" : "复制描述"}
                  </button>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] max-h-[200px] text-xs leading-relaxed resize-none overflow-y-auto"
                />
              </div>

              {createError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
                {"取消"}
              </Button>
              <Button onClick={handleCreate} disabled={creating || !title || loadingMeta}>
                {creating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {"创建中..."}
                  </>
                ) : (
                  <>
                    <Plus className="size-3.5" />
                    {"创建 Jira"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
