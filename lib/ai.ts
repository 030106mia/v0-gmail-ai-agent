import type { EmailItem } from "./types"

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com"
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""

interface AnalysisResult {
  id: string
  score: number
  visible: boolean
}

const SYSTEM_PROMPT = `你是一个企业邮件智能分析助手。你的任务是分析一批邮件，判断每封邮件的重要程度并决定是否需要展示给用户。

评分规则 (0-100)：
- 90-100分（极高优先级）：生产事故、紧急bug、客户投诉、重大合作提案、需要立即回复的邮件、需要创建Jira工单跟踪的技术问题
- 70-89分（高优先级）：项目进展汇报、设计评审、需要反馈的具体事务、有明确截止日期的请求
- 50-69分（中优先级）：一般性讨论、会议纪要、信息同步、不急迫但有价值的内容
- 30-49分（低优先级）：自动通知、订阅邮件、不需要回复的广播信息
- 0-29分（不重要）：垃圾邮件、营销推广、无关信息

过滤规则（visible=false，不展示给用户）：
- 明显的垃圾邮件、广告推广、SEO推销、guest posting推销
- 自动化系统通知中无需人工干预的（如自动恢复的告警）
- 发件人地址为 Mia@filomail.com 的所有邮件一律不展示
注意：Login Issue、登录问题、密码重置类邮件仍然需要展示，给低分即可

请严格按 JSON 数组格式返回，不要输出任何其他文字：
[{"id":"邮件id","score":分数,"visible":true/false}]`

function buildUserPrompt(emails: EmailItem[]): string {
  const summaries = emails.map((e) => {
    const bodyPreview = e.originalBody.slice(0, 500)
    return `---
ID: ${e.id}
发件人: ${e.fromName} <${e.fromEmail}>
主题: ${e.subject}
正文摘要: ${bodyPreview}
---`
  })

  return `请分析以下 ${emails.length} 封邮件：\n\n${summaries.join("\n")}`
}

export async function analyzeEmails(
  emails: EmailItem[],
  knownIds?: Set<string>,
): Promise<EmailItem[]> {
  if (!DEEPSEEK_API_KEY || emails.length === 0) return emails

  const unknownEmails = knownIds
    ? emails.filter((e) => !knownIds.has(e.id))
    : emails

  if (unknownEmails.length === 0) {
    console.log(`[AI] All ${emails.length} emails cached, skipping Deepseek call`)
    return emails
  }

  console.log(
    `[AI] Analyzing ${unknownEmails.length} new emails (${emails.length - unknownEmails.length} cached)`,
  )

  try {
    const res = await fetch(`${DEEPSEEK_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(unknownEmails) },
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      }),
    })

    if (!res.ok) {
      console.error("AI analyze failed:", res.status, await res.text().catch(() => ""))
      return emails
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ""

    let results: AnalysisResult[]
    try {
      const parsed = JSON.parse(content)
      results = Array.isArray(parsed) ? parsed : parsed.results ?? parsed.emails ?? []
    } catch {
      console.error("AI response parse failed:", content.slice(0, 200))
      return emails
    }

    const resultMap = new Map(results.map((r) => [r.id, r]))

    return emails
      .filter((e) => {
        if (knownIds?.has(e.id)) return true
        const r = resultMap.get(e.id)
        return r ? r.visible !== false : true
      })
      .map((e) => {
        if (knownIds?.has(e.id)) return e
        const r = resultMap.get(e.id)
        return r ? { ...e, score: Math.max(0, Math.min(100, r.score)) } : e
      })
  } catch (err) {
    console.error("AI analyze error:", err)
    return emails
  }
}
