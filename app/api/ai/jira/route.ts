import { NextRequest, NextResponse } from "next/server"
import { fillPrompt } from "@/lib/prompts"

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com"
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""

async function callDeepseek(messages: { role: string; content: string }[]) {
  const res = await fetch(`${DEEPSEEK_API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: 0.5,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    console.error("Deepseek API error:", errData)
    throw new Error(errData.error?.message || `Deepseek API 请求失败 (${res.status})`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || ""
}

export async function POST(req: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "未配置 DEEPSEEK_API_KEY" }, { status: 500 })
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

    const raw = await callDeepseek([
      {
        role: "system",
        content: "你是一位经验丰富的项目管理助手。请严格按照用户要求的 JSON 格式输出结果，不要包含 markdown 代码块标记或其他多余内容。",
      },
      { role: "user", content: prompt },
    ])

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
