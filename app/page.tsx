"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AppHeader } from "@/components/app-header"
import { FilterBar } from "@/components/filter-bar"
import { Clock, CheckCircle2, Ticket, CircleCheckBig, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { EmailCard } from "@/components/email-card"
import { ReplyDrawer } from "@/components/reply-drawer"
import { JiraModal } from "@/components/jira-modal"
import type { EmailItem, EmailStatus } from "@/lib/types"

const tabItems = [
  { value: "pending", countKey: "pending" as const, label: "待处理", icon: Clock, colorClass: "text-primary", activeClass: "bg-primary/10 text-primary border-primary/30" },
  { value: "replied", countKey: "replied" as const, label: "已回复", icon: CheckCircle2, colorClass: "text-success", activeClass: "bg-success/10 text-success border-success/30" },
  { value: "jira", countKey: "jira_created" as const, label: "已录入Jira", icon: Ticket, colorClass: "text-chart-5", activeClass: "bg-chart-5/10 text-chart-5 border-chart-5/30" },
  { value: "completed", countKey: "completed" as const, label: "已完成", icon: CircleCheckBig, colorClass: "text-emerald-600", activeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" },
]

function filterByTab(email: EmailItem, tab: string): boolean {
  switch (tab) {
    case "pending":
      return email.status === "pending"
    case "replied":
      return email.status === "replied"
    case "jira":
      return email.status === "jira_created"
    case "completed":
      return email.status === "completed"
    default:
      return true
  }
}

export default function GmailAgentPage() {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  const fetchEmails = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/emails?maxResults=30")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `请求失败 (${res.status})`)
      }
      const data = await res.json()
      setEmails((prev) => {
        const statusMap = new Map(prev.map((e) => [e.id, e.status]))
        return data.emails.map((e: EmailItem) => ({
          ...e,
          status: statusMap.get(e.id) ?? e.status,
        }))
      })
      setFetchedAt(data.fetchedAt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取邮件失败")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  // Filter state
  const [timeFilter, setTimeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [viewMode, setViewMode] = useState("card")
  const [searchQuery, setSearchQuery] = useState("")

  // Tab state
  const [activeTab, setActiveTab] = useState("pending")

  // Drawer/modal state
  const [replyEmail, setReplyEmail] = useState<EmailItem | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [jiraEmail, setJiraEmail] = useState<EmailItem | null>(null)
  const [jiraOpen, setJiraOpen] = useState(false)

  // Compute counts
  const counts = useMemo(() => {
    return {
      pending: emails.filter((e) => e.status === "pending").length,
      replied: emails.filter((e) => e.status === "replied").length,
      jira_created: emails.filter((e) => e.status === "jira_created").length,
      completed: emails.filter((e) => e.status === "completed").length,
    }
  }, [emails])

  // Filter and sort emails
  const filteredEmails = useMemo(() => {
    let result = emails.filter((email) => filterByTab(email, activeTab))

    // Status filter (if not "all", further filter)
    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter)
    }

    // Language filter
    if (languageFilter !== "all") {
      result = result.filter((e) => e.language === languageFilter)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.fromName.toLowerCase().includes(q) ||
          e.fromEmail.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.originalBody.toLowerCase().includes(q) ||
          e.translatedZh.includes(q)
      )
    }

    return result
  }, [emails, activeTab, statusFilter, languageFilter, searchQuery])

  // Actions
  const handleGenerateReply = (email: EmailItem) => {
    setReplyEmail(email)
    setReplyOpen(true)
    // Mark as no longer new
    setEmails((prev) =>
      prev.map((e) => (e.id === email.id ? { ...e, isNew: false } : e))
    )
  }

  const handleCreateJira = (email: EmailItem) => {
    setJiraEmail(email)
    setJiraOpen(true)
    setEmails((prev) =>
      prev.map((e) => (e.id === email.id ? { ...e, isNew: false } : e))
    )
  }

  const handleSaveAsReplied = (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "replied" as EmailStatus } : e))
    )
  }

  const handleSaveAsJiraCreated = (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "jira_created" as EmailStatus } : e))
    )
  }

  const handleMarkProcessed = (id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "completed" as EmailStatus } : e))
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <FilterBar
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        languageFilter={languageFilter}
        onLanguageFilterChange={setLanguageFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <main className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="size-8 animate-spin mb-4" />
            <p className="text-sm font-medium">{"正在加载邮件..."}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="size-8 text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive mb-1">{"加载失败"}</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-md text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchEmails()}>
              <RefreshCw className="size-3.5" />
              {"重试"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <div className="flex items-center justify-between">
                  <TabsList className="h-auto bg-transparent gap-3 p-0">
                    {tabItems.map((tab) => {
                      const Icon = tab.icon
                      const count = counts[tab.countKey]
                      const isActive = activeTab === tab.value
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all data-[state=active]:shadow-none ${
                            isActive
                              ? tab.activeClass
                              : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          <span>{tab.label}</span>
                          <span className="text-sm font-bold tabular-nums">{count}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  <div className="flex items-center gap-2">
                    {fetchedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {"更新于 "}{new Date(fetchedAt).toLocaleTimeString("zh-CN")}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => fetchEmails(true)}
                      disabled={refreshing}
                      title="刷新邮件"
                    >
                      <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
                      <span className="sr-only">{"刷新"}</span>
                    </Button>
                  </div>
                </div>

                {tabItems.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-4">
                    {filteredEmails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <svg className="size-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V18" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium">{"暂无邮件"}</p>
                        <p className="text-xs mt-1">{"当前筛选条件下没有匹配的邮件"}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredEmails.map((email) => (
                          <EmailCard
                            key={email.id}
                            email={email}
                            onGenerateReply={handleGenerateReply}
                            onCreateJira={handleCreateJira}
                            onMarkProcessed={handleMarkProcessed}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </>
        )}
      </main>

      {/* Reply Drawer */}
      <ReplyDrawer
        email={replyEmail}
        open={replyOpen}
        onOpenChange={setReplyOpen}
        onSaveAsReplied={handleSaveAsReplied}
      />

      {/* Jira Modal */}
      <JiraModal
        email={jiraEmail}
        open={jiraOpen}
        onOpenChange={setJiraOpen}
        onCreateJira={handleSaveAsJiraCreated}
      />
    </div>
  )
}
