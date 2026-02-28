const JIRA_BASE_URL = process.env.JIRA_BASE_URL || ""
const JIRA_EMAIL = process.env.JIRA_EMAIL || ""
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ""
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || ""

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`
}

function getHeaders(): Record<string, string> {
  return {
    Authorization: getAuthHeader(),
    "Content-Type": "application/json",
    Accept: "application/json",
  }
}

export function isJiraConfigured(): boolean {
  return !!(JIRA_BASE_URL && JIRA_EMAIL && JIRA_API_TOKEN && JIRA_PROJECT_KEY)
}

export function getLockedProjectKey(): string {
  return JIRA_PROJECT_KEY
}

export interface JiraProject {
  id: string
  key: string
  name: string
}

export interface JiraIssueType {
  id: string
  name: string
  subtask: boolean
}

export interface JiraPriority {
  id: string
  name: string
}

export interface CreateIssueParams {
  projectKey: string
  issueTypeName: string
  priorityName: string
  summary: string
  description: string
}

export interface CreatedIssue {
  id: string
  key: string
  self: string
}

async function jiraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${JIRA_BASE_URL}/rest/api/3${path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...getHeaders(), ...init?.headers },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Jira API ${res.status}: ${body.slice(0, 500)}`)
  }

  return res.json()
}

export async function getProjects(): Promise<JiraProject[]> {
  const data = await jiraFetch<JiraProject[]>("/project?recent=20")
  return data.map((p) => ({ id: p.id, key: p.key, name: p.name }))
}

export async function getIssueTypes(projectKey: string): Promise<JiraIssueType[]> {
  const data = await jiraFetch<{ issueTypes: JiraIssueType[] }>(
    `/project/${projectKey}`,
  )
  return (data.issueTypes || [])
    .filter((t) => !t.subtask)
    .map((t) => ({ id: t.id, name: t.name, subtask: t.subtask }))
}

export async function getPriorities(): Promise<JiraPriority[]> {
  const data = await jiraFetch<JiraPriority[]>("/priority")
  return data.map((p) => ({ id: p.id, name: p.name }))
}

export async function verifyIssueKeys(keys: string[]): Promise<string[]> {
  if (keys.length === 0) return []

  const jql = `key in (${keys.join(",")})`
  const data = await jiraFetch<{ issues: { key: string }[] }>(
    `/search?jql=${encodeURIComponent(jql)}&fields=key&maxResults=${keys.length}`,
  )
  return data.issues.map((i) => i.key)
}

type AdfNode = Record<string, unknown>

function parseInlineMarks(text: string): AdfNode[] {
  const nodes: AdfNode[] = []
  const regex = /\*\*(.+?)\*\*|__(.+?)__|`(.+?)`/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) })
    }
    if (match[1] || match[2]) {
      nodes.push({ type: "text", text: match[1] || match[2], marks: [{ type: "strong" }] })
    } else if (match[3]) {
      nodes.push({ type: "text", text: match[3], marks: [{ type: "code" }] })
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) })
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text: text || " " }]
}

function markdownToAdf(markdown: string): AdfNode {
  const lines = markdown.split("\n")
  const content: AdfNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === "") {
      i++
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      content.push({
        type: "heading",
        attrs: { level: headingMatch[1].length },
        content: parseInlineMarks(headingMatch[2]),
      })
      i++
      continue
    }

    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)$/)
    if (bulletMatch) {
      const items: AdfNode[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*[-*]\s+(.+)$/)
        if (m) {
          items.push({
            type: "listItem",
            content: [{ type: "paragraph", content: parseInlineMarks(m[1]) }],
          })
        }
        i++
      }
      content.push({ type: "bulletList", content: items })
      continue
    }

    const orderedMatch = line.match(/^\s*\d+[.)]\s+(.+)$/)
    if (orderedMatch) {
      const items: AdfNode[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        const m = lines[i].match(/^\s*\d+[.)]\s+(.+)$/)
        if (m) {
          items.push({
            type: "listItem",
            content: [{ type: "paragraph", content: parseInlineMarks(m[1]) }],
          })
        }
        i++
      }
      content.push({ type: "orderedList", content: items })
      continue
    }

    content.push({ type: "paragraph", content: parseInlineMarks(line) })
    i++
  }

  if (content.length === 0) {
    content.push({ type: "paragraph", content: [{ type: "text", text: " " }] })
  }

  return { type: "doc", version: 1, content }
}

export async function createIssue(params: CreateIssueParams): Promise<CreatedIssue> {
  const body = {
    fields: {
      project: { key: params.projectKey },
      issuetype: { name: params.issueTypeName },
      priority: { name: params.priorityName },
      summary: params.summary,
      description: markdownToAdf(params.description),
    },
  }

  return jiraFetch<CreatedIssue>("/issue", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
