import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isJiraConfigured } from "@/lib/jira"

export const dynamic = "force-dynamic"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || ""
const JIRA_EMAIL = process.env.JIRA_EMAIL || ""
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ""

const STATUS_NOT_STARTED = ["To Do", "Backlog", "Open", "New", "Reopened"]
const STATUS_COMPLETED = ["Done", "Closed", "Resolved"]

function mapJiraStatus(jiraStatus: string): string {
  const normalized = jiraStatus.trim()
  if (STATUS_NOT_STARTED.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
    return "not_started"
  }
  if (STATUS_COMPLETED.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
    return "completed"
  }
  return "in_review"
}

export async function GET() {
  try {
    const tickets = await prisma.requirementTicket.findMany({
      where: { jiraKey: { not: null } },
      orderBy: { createdAt: "desc" },
    })

    if (tickets.length === 0) {
      return NextResponse.json([])
    }

    if (!isJiraConfigured()) {
      return NextResponse.json(
        tickets.map((t) => ({
          id: t.id,
          title: t.title,
          jiraKey: t.jiraKey,
          jiraUrl: t.jiraUrl,
          status: "not_started",
          assignee: null,
          createdAt: t.createdAt,
        })),
      )
    }

    const jiraKeys = tickets.map((t) => t.jiraKey!).filter(Boolean)
    const jql = `key in (${jiraKeys.join(",")})`

    const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`
    const url = `${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=summary,status,assignee&maxResults=${jiraKeys.length}`

    const res = await fetch(url, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    })

    const jiraMap = new Map<
      string,
      { status: string; assignee: string | null }
    >()

    if (res.ok) {
      const data = await res.json()
      for (const issue of data.issues || []) {
        jiraMap.set(issue.key, {
          status: issue.fields?.status?.name || "Unknown",
          assignee: issue.fields?.assignee?.displayName || null,
        })
      }
    }

    const result = tickets.map((t) => {
      const jiraInfo = jiraMap.get(t.jiraKey!)
      return {
        id: t.id,
        title: t.title,
        jiraKey: t.jiraKey,
        jiraUrl: t.jiraUrl,
        status: jiraInfo ? mapJiraStatus(jiraInfo.status) : "not_started",
        jiraStatusRaw: jiraInfo?.status || null,
        assignee: jiraInfo?.assignee || null,
        createdAt: t.createdAt,
      }
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error("Failed to fetch Jira issues:", err)
    return NextResponse.json({ error: "获取工单状态失败" }, { status: 500 })
  }
}
