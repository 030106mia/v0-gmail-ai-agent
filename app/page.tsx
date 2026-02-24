"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AppHeader } from "@/components/app-header"
import { FilterBar } from "@/components/filter-bar"
import { StatsStrip } from "@/components/stats-strip"
import { EmailCard } from "@/components/email-card"
import { ReplyDrawer } from "@/components/reply-drawer"
import { JiraModal } from "@/components/jira-modal"
import { mockEmails, type EmailItem, type EmailStatus } from "@/lib/mock-data"

const tabItems = [
  { value: "pending", label: "待处理" },
  { value: "replied", label: "需要回信" },
  { value: "jira", label: "需要录入Jira" },
  { value: "completed", label: "已完成" },
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
  // Email state
  const [emails, setEmails] = useState<EmailItem[]>(mockEmails)

  // Filter state
  const [timeFilter, setTimeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [languageFilter, setLanguageFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recommended")
  const [viewMode, setViewMode] = useState("card")
  const [featuredOnly, setFeaturedOnly] = useState(false)
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

    // Featured only (score >= 85)
    if (featuredOnly) {
      result = result.filter((e) => e.score >= 85)
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

    // Sort
    if (sortBy === "score") {
      result.sort((a, b) => b.score - a.score)
    } else if (sortBy === "time") {
      // simple simulation
      result.sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))
    }
    // "recommended" keeps original order

    return result
  }, [emails, activeTab, statusFilter, languageFilter, featuredOnly, searchQuery, sortBy])

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
        sortBy={sortBy}
        onSortByChange={setSortBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        featuredOnly={featuredOnly}
        onFeaturedOnlyChange={setFeaturedOnly}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />

      <main className="mx-auto max-w-7xl px-4 lg:px-6 py-6">
        {/* Stats strip */}
        <StatsStrip counts={counts} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5">
          <TabsList className="h-10">
            {tabItems.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-4">
                {tab.label}
                {tab.value === "pending" && counts.pending > 0 && (
                  <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {counts.pending}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

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
