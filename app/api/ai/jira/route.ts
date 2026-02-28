import { NextRequest, NextResponse } from "next/server"
import { fillPrompt } from "@/lib/prompts"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"

async function callClaude(system: string, userContent: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      temperature: 0.5,
      system,
      messages: [
        { role: "user", content: userContent },
      ],
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    console.error("Claude API error:", errData)
    throw new Error(errData.error?.message || `Claude API 请求失败 (${res.status})`)
  }

  const data = await res.json()
  return data.content?.[0]?.text?.trim() || ""
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "未配置 ANTHROPIC_API_KEY" }, { status: 500 })
  }

  try {
    const { fromName, fromEmail, subject, body, translatedBody } = await req.json()

    const prompt = fillPrompt("createJiraTicket", {
      fromName: fromName || "",
      fromEmail: fromEmail || "",
      subject: subject || "",
      emailBody: body || "",
      translatedBody: translatedBody || "无",
    })

    const raw = await callClaude(
      "你是一位经验丰富的项目管理助手。请严格按照用户要求的 JSON 格式输出结果，不要包含 markdown 代码块标记或其他多余内容。",
      prompt,
    )

    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")

    let parsed: { title: string; description: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error("AI 返回的内容无法解析为 JSON:", raw)
      return NextResponse.json(
        { error: "AI 返回格式异常，请重试" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      title: parsed.title || subject,
      description: parsed.description || "",
    })
  } catch (err) {
    console.error("AI Jira generation error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI 生成工单内容失败" },
      { status: 500 },
    )
  }
}
