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

export async function createIssue(params: CreateIssueParams): Promise<CreatedIssue> {
  const body = {
    fields: {
      project: { key: params.projectKey },
      issuetype: { name: params.issueTypeName },
      priority: { name: params.priorityName },
      summary: params.summary,
      description: {
        type: "doc",
        version: 1,
        content: params.description.split("\n").map((line) => ({
          type: "paragraph",
          content: line
            ? [{ type: "text", text: line }]
            : [{ type: "text", text: " " }],
        })),
      },
    },
  }

  return jiraFetch<CreatedIssue>("/issue", {
    method: "POST",
    body: JSON.stringify(body),
  })
}
