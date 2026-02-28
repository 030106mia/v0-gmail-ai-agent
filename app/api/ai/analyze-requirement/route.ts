import { NextRequest, NextResponse } from "next/server"
import { fillPrompt } from "@/lib/prompts"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"

const SYSTEM_PROMPT =
  "你是一位经验丰富的产品经理和需求分析师。请严格按照用户要求的 JSON 格式输出结果，不要包含 markdown 代码块标记或其他多余内容。"

interface ContentBlock {
  type: "text" | "image"
  text?: string
  source?: { type: "base64"; media_type: string; data: string }
}

function buildMessages(
  text: string,
  images: string[],
  previousResult?: { title: string; description: string },
  feedback?: string,
) {
  const content: ContentBlock[] = []

  for (const img of images) {
    const match = img.match(/^data:(image\/\w+);base64,(.+)$/)
    if (match) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: match[1], data: match[2] },
      })
    }
  }

  let userText: string
  if (previousResult && feedback) {
    userText = [
      fillPrompt("analyzeRequirement", { requirementText: text }),
      "",
      "--- 上一次生成的结果 ---",
      `标题：${previousResult.title}`,
      `描述：${previousResult.description}`,
      "",
      "--- 用户反馈 ---",
      feedback,
      "",
      "请根据用户反馈优化上述结果，仍按相同 JSON 格式输出。",
    ].join("\n")
  } else {
    userText = fillPrompt("analyzeRequirement", { requirementText: text })
  }

  content.push({ type: "text", text: userText })
  return content
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "未配置 ANTHROPIC_API_KEY" }, { status: 500 })
  }

  try {
    const { text, images, previousResult, feedback } = await req.json()

    if (!text && (!images || images.length === 0)) {
      return NextResponse.json({ error: "请提供需求说明或截图" }, { status: 400 })
    }

    const content = buildMessages(text || "", images || [], previousResult, feedback)

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        temperature: 0.5,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content }],
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error("Claude analyze-requirement error:", errData)
      return NextResponse.json(
        { error: errData.error?.message || `AI 分析请求失败 (${res.status})` },
        { status: res.status },
      )
    }

    const data = await res.json()
    const raw = data.content?.[0]?.text?.trim() || ""

    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")

    let parsed: { title: string; description: string }
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error("AI 返回的内容无法解析为 JSON:", raw)
      return NextResponse.json({ error: "AI 返回格式异常，请重试" }, { status: 500 })
    }

    return NextResponse.json({
      title: parsed.title || "",
      description: parsed.description || "",
    })
  } catch (err) {
    console.error("Analyze requirement error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI 分析失败" },
      { status: 500 },
    )
  }
}
