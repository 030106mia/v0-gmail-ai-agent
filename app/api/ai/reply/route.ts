import { NextRequest, NextResponse } from "next/server"

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com"
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""

export async function POST(req: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "未配置 DEEPSEEK_API_KEY" }, { status: 500 })
  }

  try {
    const { fromName, subject, body, tone } = await req.json()

    const toneDesc: Record<string, string> = {
      formal: "正式、专业、礼貌",
      friendly: "友好、亲切、轻松",
      brief: "简短、直接、高效",
    }

    const systemPrompt = `你是一位专业的邮件回复助手。请根据收到的邮件内容，生成一封得体的回复邮件。
要求：
- 语气风格：${toneDesc[tone] || toneDesc.formal}
- 用中文撰写回复
- 直接输出回复正文，不要加"主题"或"收件人"等元信息
- 回复要有针对性地回应邮件中提到的具体问题或内容`

    const userPrompt = `发件人：${fromName}
邮件主题：${subject}
邮件内容：
${body}`

    const res = await fetch(`${DEEPSEEK_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error("Deepseek API error:", errData)
      return NextResponse.json(
        { error: errData.error?.message || `Deepseek API 请求失败 (${res.status})` },
        { status: res.status },
      )
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || ""

    return NextResponse.json({ reply })
  } catch (err) {
    console.error("AI reply generation error:", err)
    return NextResponse.json({ error: "生成回复失败" }, { status: 500 })
  }
}
