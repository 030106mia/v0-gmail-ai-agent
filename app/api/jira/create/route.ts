import { NextResponse } from "next/server"
import { isJiraConfigured, getLockedProjectKey, createIssue } from "@/lib/jira"

export async function POST(request: Request) {
  if (!isJiraConfigured()) {
    return NextResponse.json(
      { error: "Jira 未配置，请设置 JIRA_BASE_URL、JIRA_EMAIL、JIRA_API_TOKEN、JIRA_PROJECT_KEY" },
      { status: 503 },
    )
  }

  const projectKey = getLockedProjectKey()

  try {
    const body = await request.json()
    const { issueTypeName, priorityName, summary, description } = body

    if (!summary) {
      return NextResponse.json(
        { error: "缺少必要字段: summary" },
        { status: 400 },
      )
    }

    const issue = await createIssue({
      projectKey,
      issueTypeName: issueTypeName || "Task",
      priorityName: priorityName || "Medium",
      summary,
      description: description || "",
    })

    const jiraBaseUrl = process.env.JIRA_BASE_URL || ""
    const issueUrl = `${jiraBaseUrl}/browse/${issue.key}`

    console.log(`[Jira] Created issue ${issue.key} in project ${projectKey} (backlog)`)

    return NextResponse.json({
      key: issue.key,
      id: issue.id,
      url: issueUrl,
    })
  } catch (err) {
    console.error("[Jira] Failed to create issue:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "创建 Jira 工单失败" },
      { status: 500 },
    )
  }
}
