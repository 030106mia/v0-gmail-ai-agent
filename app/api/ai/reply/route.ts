import { NextRequest, NextResponse } from "next/server"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514"

async function callClaude(system: string, userContent: string, options?: { temperature?: number; max_tokens?: number }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: options?.max_tokens ?? 1024,
      temperature: options?.temperature ?? 0.7,
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
    const { fromName, subject, body, tone, language } = await req.json()

    const toneDesc: Record<string, string> = {
      formal: "正式、专业、礼貌",
      friendly: "友好、亲切、轻松",
      brief: "简短、直接、高效",
    }

    const isChinese = language === "中文" || language === "Chinese"

    const systemPrompt = `你是一位专业的邮件回复助手。请根据收到的邮件内容，生成一封得体的回复邮件。
要求：
- 语气风格：${toneDesc[tone] || toneDesc.formal}
- 使用与原始邮件相同的语言撰写回复（原始邮件语言：${language || "未知"}）
- 直接输出回复正文，不要加"主题"或"收件人"等元信息
- 回复要有针对性地回应邮件中提到的具体问题或内容
- 回复开头必须有问候语，可以用 Hi / Hello / Dear 等，但绝对不要使用 Hey`

    const userPrompt = `发件人：${fromName}
邮件主题：${subject}
邮件内容：
${body}`

    const reply = await callClaude(systemPrompt, userPrompt)

    let translatedReply = ""
    if (!isChinese && reply) {
      translatedReply = await callClaude(
        "你是一位专业的翻译助手。请将以下邮件回复内容翻译为中文。只输出翻译结果，不要添加任何额外说明。",
        reply,
      )
    }

    return NextResponse.json({ reply, translatedReply })
  } catch (err) {
    console.error("AI reply generation error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "生成回复失败" },
      { status: 500 },
    )
  }
}
