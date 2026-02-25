import { NextResponse } from "next/server"
import { isJiraConfigured, verifyIssueKeys } from "@/lib/jira"

export async function POST(request: Request) {
  if (!isJiraConfigured()) {
    return NextResponse.json(
      { error: "Jira 未配置" },
      { status: 503 },
    )
  }

  try {
    const body = await request.json()
    const { keys } = body

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ existingKeys: [] })
    }

    const existingKeys = await verifyIssueKeys(keys)
    return NextResponse.json({ existingKeys })
  } catch (err) {
    console.error("[Jira] Failed to verify issues:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "验证 Jira 工单失败" },
      { status: 500 },
    )
  }
}
