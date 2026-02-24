export type EmailStatus = "pending" | "replied" | "jira_created" | "completed"

export interface EmailItem {
  id: string
  fromName: string
  fromEmail: string
  avatarLetter: string
  avatarColor: string
  subject: string
  originalBody: string
  translatedZh: string
  tags: string[]
  receivedAt: string
  score: number
  isNew: boolean
  status: EmailStatus
  language: string
}

export const statusLabels: Record<EmailStatus, string> = {
  pending: "待处理",
  replied: "已回信",
  jira_created: "已录入Jira",
  completed: "已完成",
}
