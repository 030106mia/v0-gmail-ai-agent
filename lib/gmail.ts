import { google } from "googleapis"
import type { EmailItem } from "./types"

const AVATAR_COLORS = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-chart-2",
  "bg-chart-4",
  "bg-chart-5",
]

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Gmail OAuth2 credentials. Set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
    )
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  return oauth2Client
}

function getLabelIds(): string[] {
  const raw = process.env.GMAIL_LABEL_IDS
  if (!raw) throw new Error("Missing GMAIL_LABEL_IDS environment variable.")
  return raw.split(",").map((id) => id.trim()).filter(Boolean)
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/")
  return Buffer.from(base64, "base64").toString("utf-8")
}

function extractHeader(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string
): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
}

function parseFrom(raw: string): { name: string; email: string } {
  const match = raw.match(/^"?(.+?)"?\s*<(.+)>$/)
  if (match) return { name: match[1].trim(), email: match[2].trim() }
  if (raw.includes("@")) return { name: raw.split("@")[0], email: raw }
  return { name: raw, email: raw }
}

function extractBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data)
  }

  if (payload.parts) {
    const textPart = payload.parts.find(
      (p: any) => p.mimeType === "text/plain" && p.body?.data
    )
    if (textPart) return decodeBase64Url(textPart.body.data)

    const htmlPart = payload.parts.find(
      (p: any) => p.mimeType === "text/html" && p.body?.data
    )
    if (htmlPart) {
      const html = decodeBase64Url(htmlPart.body.data)
      return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()
    }

    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part)
        if (nested) return nested
      }
    }
  }

  return ""
}

function detectLanguage(text: string): string {
  const sample = text.slice(0, 500)
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(sample)) return "日文"
  if (/[\u4e00-\u9fff]/.test(sample)) return "中文"
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(sample)) return "法文"
  if (/[äöüß]/i.test(sample)) return "德文"
  if (/[áéíóúñ¿¡]/i.test(sample)) return "西班牙文"
  if (/[а-яА-ЯёЁ]/.test(sample)) return "俄文"
  if (/[가-힣]/.test(sample)) return "韩文"
  return "英文"
}

function formatReceivedAt(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "刚刚"
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay < 30) return `${diffDay}天前`
  return date.toLocaleDateString("zh-CN")
}

export async function fetchEmailsByLabels(
  maxResults: number = 20
): Promise<EmailItem[]> {
  const auth = getOAuth2Client()
  const gmail = google.gmail({ version: "v1", auth })
  const labelIds = getLabelIds()

  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds,
    maxResults,
  })

  const messageIds = listRes.data.messages ?? []
  if (messageIds.length === 0) return []

  const emails: EmailItem[] = []

  const details = await Promise.all(
    messageIds.map((msg) =>
      gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      })
    )
  )

  for (let i = 0; i < details.length; i++) {
    const message = details[i].data
    const headers = message.payload?.headers
    const subject = extractHeader(headers, "Subject")
    const fromRaw = extractHeader(headers, "From")
    const dateStr = extractHeader(headers, "Date")
    const { name, email: fromEmail } = parseFrom(fromRaw)
    const body = extractBody(message.payload)
    const language = detectLanguage(body)

    const gmailLabels = message.labelIds ?? []
    const tags = gmailLabels
      .filter((l) => !l.startsWith("CATEGORY_") && l !== "UNREAD")
      .slice(0, 3)

    emails.push({
      id: message.id ?? String(i),
      fromName: name,
      fromEmail,
      avatarLetter: name.charAt(0).toUpperCase(),
      avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      subject,
      originalBody: body,
      translatedZh: "",
      tags,
      receivedAt: formatReceivedAt(dateStr),
      score: 50,
      isNew: gmailLabels.includes("UNREAD"),
      status: "pending",
      language,
    })
  }

  return emails
}

export async function listLabels(): Promise<
  { id: string; name: string; type: string }[]
> {
  const auth = getOAuth2Client()
  const gmail = google.gmail({ version: "v1", auth })

  const res = await gmail.users.labels.list({ userId: "me" })
  return (res.data.labels ?? []).map((l) => ({
    id: l.id ?? "",
    name: l.name ?? "",
    type: l.type ?? "",
  }))
}
