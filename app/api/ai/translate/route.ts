import { NextRequest, NextResponse } from "next/server"

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com"
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""

export async function POST(req: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "未配置 DEEPSEEK_API_KEY" }, { status: 500 })
  }

  try {
    const { body } = await req.json()

    if (!body || typeof body !== "string") {
      return NextResponse.json({ error: "缺少邮件内容" }, { status: 400 })
    }

    const res = await fetch(`${DEEPSEEK_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一位专业的邮件翻译助手。请将以下非中文邮件内容翻译为简体中文。
要求：
- 准确传达原文含义，不遗漏任何信息
- 保持邮件的正式程度和语气风格
- 专业术语翻译准确，必要时在括号内保留英文原词
- 保留原文中的人名、公司名、产品名等专有名词
- 保持原文的段落结构和格式
- 如果原文已经是中文，直接返回原文即可`,
          },
          { role: "user", content: body },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      console.error("Deepseek translate error:", errData)
      return NextResponse.json(
        { error: errData.error?.message || `翻译请求失败 (${res.status})` },
        { status: res.status },
      )
    }

    const data = await res.json()
    const translation = data.choices?.[0]?.message?.content?.trim() || ""

    return NextResponse.json({ translation })
  } catch (err) {
    console.error("Translation error:", err)
    return NextResponse.json({ error: "翻译失败" }, { status: 500 })
  }
}
