import { NextResponse } from "next/server"
import { isJiraConfigured, getLockedProjectKey, getIssueTypes, getPriorities } from "@/lib/jira"

export async function GET() {
  if (!isJiraConfigured()) {
    return NextResponse.json(
      { error: "Jira 未配置，请设置 JIRA_BASE_URL、JIRA_EMAIL、JIRA_API_TOKEN、JIRA_PROJECT_KEY" },
      { status: 503 },
    )
  }

  const projectKey = getLockedProjectKey()

  try {
    const [issueTypes, priorities] = await Promise.all([
      getIssueTypes(projectKey),
      getPriorities(),
    ])

    return NextResponse.json({ projectKey, issueTypes, priorities })
  } catch (err) {
    console.error("[Jira] Failed to fetch metadata:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "获取 Jira 数据失败" },
      { status: 500 },
    )
  }
}
