"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Plus, Loader2, ExternalLink, AlertCircle, Lock, Send } from "lucide-react"

interface AnalysisResult {
  title: string
  description: string
}

interface JiraIssueType {
  id: string
  name: string
}

interface JiraPriority {
  id: string
  name: string
}

interface RequirementResultProps {
  result: AnalysisResult
  onResultChange: (result: AnalysisResult) => void
  requirementText: string
  images: string[]
  onRegenerating: (loading: boolean) => void
  onJiraCreated: (ticket: { id: string; title: string; jiraKey: string; jiraUrl: string }) => void
}

export function RequirementResult({
  result,
  onResultChange,
  requirementText,
  images,
  onRegenerating,
  onJiraCreated,
}: RequirementResultProps) {
  const [feedback, setFeedback] = useState("")
  const [regenerating, setRegenerating] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  const [jiraOpen, setJiraOpen] = useState(false)
  const [projectKey, setProjectKey] = useState("")
  const [issueType, setIssueType] = useState("Task")
  const [priority, setPriority] = useState("Medium")
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([])
  const [priorities, setPriorities] = useState<JiraPriority[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [metaLoaded, setMetaLoaded] = useState(false)
  const metaLoadedRef = useRef(false)

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdIssue, setCreatedIssue] = useState<{ key: string; url: string } | null>(null)

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
    if (jiraOpen && !metaLoadedRef.current) {
      fetchMetadata()
    }
  }, [jiraOpen, fetchMetadata])

  const handleRegenerate = async () => {
    if (!feedback.trim()) return

    setRegenerating(true)
    setFeedbackError(null)
    onRegenerating(true)

    try {
      const res = await fetch("/api/ai/analyze-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: requirementText,
          images,
          previousResult: result,
          feedback: feedback.trim(),
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFeedbackError(data.error || "重新生成失败")
        return
      }

      onResultChange({ title: data.title, description: data.description })
      setFeedback("")
    } catch {
      setFeedbackError("网络错误，请重试")
    } finally {
      setRegenerating(false)
      onRegenerating(false)
    }
  }

  const handleCreateJira = async () => {
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/jira/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueTypeName: issueType,
          priorityName: priority,
          summary: result.title,
          description: result.description,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCreateError(data.error || "创建失败")
        return
      }

      setCreatedIssue({ key: data.key, url: data.url })

      const ticketRes = await fetch("/api/requirement-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          description: result.description,
          jiraKey: data.key,
          jiraUrl: data.url,
        }),
      })

      if (ticketRes.ok) {
        const ticket = await ticketRes.json()
        onJiraCreated({ id: ticket.id, title: result.title, jiraKey: data.key, jiraUrl: data.url })
      }
    } catch {
      setCreateError("网络错误，无法创建 Jira 工单")
    } finally {
      setCreating(false)
    }
  }

  const handleJiraClose = () => {
    setJiraOpen(false)
    setCreateError(null)
    setCreatedIssue(null)
    setIssueType("Task")
    setPriority("Medium")
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{"分析结果"}</h3>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setJiraOpen(true)}
          >
            <Plus className="size-3.5" />
            {"录入 Jira"}
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{"标题"}</Label>
          <Input
            value={result.title}
            onChange={(e) => onResultChange({ ...result, title: e.target.value })}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{"描述"}</Label>
          <Textarea
            value={result.description}
            onChange={(e) => onResultChange({ ...result, description: e.target.value })}
            className="min-h-[200px] text-xs leading-relaxed resize-y"
          />
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-3">
        <label className="text-xs font-medium text-muted-foreground block">
          {"不满意？输入修改意见重新生成"}
        </label>
        <div className="flex gap-2">
          <Input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && feedback.trim()) {
                e.preventDefault()
                handleRegenerate()
              }
            }}
            placeholder="例如：标题更简洁一些，描述中加入性能指标要求..."
            className="flex-1 h-9 text-sm"
            disabled={regenerating}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegenerate}
            disabled={!feedback.trim() || regenerating}
            className="shrink-0"
          >
            {regenerating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            {"重新生成"}
          </Button>
        </div>
        {feedbackError && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="size-3" />
            {feedbackError}
          </p>
        )}
      </div>

      <Dialog open={jiraOpen} onOpenChange={handleJiraClose}>
        <DialogContent className="sm:max-w-md">
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
                    <Label className="text-xs text-muted-foreground">{"类型"}</Label>
                    <Select value={issueType} onValueChange={setIssueType} disabled={loadingMeta}>
                      <SelectTrigger className="h-9 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {issueTypes.length > 0 ? (
                          issueTypes.map((t) => (
                            <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
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
                            <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
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

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{"标题"}</Label>
                  <Input value={result.title} readOnly className="h-9 text-sm bg-muted/30" />
                </div>

                {createError && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={handleJiraClose} disabled={creating}>
                  {"取消"}
                </Button>
                <Button onClick={handleCreateJira} disabled={creating || !result.title || loadingMeta}>
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
    </div>
  )
}
