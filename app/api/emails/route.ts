import { NextRequest, NextResponse } from "next/server"
import { analyzeEmails } from "@/lib/ai"
import type { EmailItem } from "@/lib/types"

function hasGmailCredentials(): boolean {
  return !!(
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.GMAIL_LABEL_IDS
  )
}

const MOCK_EMAILS: EmailItem[] = [
  {
    id: "mock-1",
    fromName: "Sarah Johnson",
    fromEmail: "sarah.johnson@example.com",
    avatarLetter: "S",
    avatarColor: "bg-primary",
    subject: "Q1 Marketing Campaign Results & Next Steps",
    originalBody:
      "Hi team,\n\nI wanted to share the Q1 marketing campaign results. We've seen a 23% increase in lead generation and a 15% improvement in conversion rates compared to last quarter.\n\nKey highlights:\n- Email campaigns: 45% open rate\n- Social media engagement up 32%\n- Website traffic increased by 28%\n\nLet's schedule a meeting to discuss the Q2 strategy. I have some ideas for leveraging AI-driven personalization.\n\nBest regards,\nSarah",
    translatedZh:
      "大家好，\n\n我想分享一下第一季度营销活动的结果。与上季度相比，我们的潜在客户开发增长了23%，转化率提高了15%。\n\n主要亮点：\n- 邮件活动：45%打开率\n- 社交媒体互动提高了32%\n- 网站流量增加了28%\n\n让我们安排一次会议讨论第二季度的策略。我有一些关于利用AI驱动个性化的想法。\n\n此致，\nSarah",
    tags: ["Marketing", "Report"],
    receivedAt: "2小时前",
    score: 92,
    isNew: true,
    status: "pending",
    language: "英文",
  },
  {
    id: "mock-2",
    fromName: "田中太郎",
    fromEmail: "tanaka@example.co.jp",
    avatarLetter: "田",
    avatarColor: "bg-success",
    subject: "プロジェクト進捗報告 - 3月分",
    originalBody:
      "お疲れ様です。\n\n3月分のプロジェクト進捗をご報告いたします。\n\n現在の状況：\n- フロントエンド開発：85%完了\n- バックエンドAPI：90%完了\n- テスト：60%完了\n\n来週中にベータ版をリリースできる見込みです。\nご確認のほどよろしくお願いいたします。\n\n田中太郎",
    translatedZh:
      "辛苦了。\n\n向您报告3月份的项目进展。\n\n当前状况：\n- 前端开发：完成85%\n- 后端API：完成90%\n- 测试：完成60%\n\n预计下周内可以发布Beta版本。\n请您确认。\n\n田中太郎",
    tags: ["Project", "Development"],
    receivedAt: "5小时前",
    score: 85,
    isNew: true,
    status: "pending",
    language: "日文",
  },
  {
    id: "mock-3",
    fromName: "Pierre Dupont",
    fromEmail: "pierre.dupont@example.fr",
    avatarLetter: "P",
    avatarColor: "bg-warning",
    subject: "Proposition de partenariat stratégique",
    originalBody:
      "Bonjour,\n\nJe me permets de vous contacter au sujet d'une proposition de partenariat stratégique entre nos deux entreprises.\n\nNotre société est spécialisée dans l'intelligence artificielle appliquée au commerce électronique, et nous pensons qu'une collaboration pourrait être mutuellement bénéfique.\n\nSeriez-vous disponible pour une réunion la semaine prochaine ?\n\nCordialement,\nPierre Dupont",
    translatedZh:
      "您好，\n\n冒昧联系您，关于我们两家公司之间的战略合作提案。\n\n我们公司专门从事应用于电子商务的人工智能，我们认为合作可能对双方都有利。\n\n您下周是否有时间开会？\n\n此致，\nPierre Dupont",
    tags: ["Partnership", "Business"],
    receivedAt: "1天前",
    score: 78,
    isNew: false,
    status: "pending",
    language: "法文",
  },
  {
    id: "mock-4",
    fromName: "Max Weber",
    fromEmail: "max.weber@example.de",
    avatarLetter: "M",
    avatarColor: "bg-destructive",
    subject: "Technischer Support - Dringende Fehlerbehebung",
    originalBody:
      "Sehr geehrtes Team,\n\nwir haben ein kritisches Problem in der Produktionsumgebung festgestellt. Der API-Endpunkt für die Benutzerauthentifizierung gibt intermittierende 500-Fehler zurück.\n\nBetroffene Systeme:\n- Login-Service\n- Token-Validierung\n- SSO-Integration\n\nBitte behandeln Sie dies mit höchster Priorität.\n\nMit freundlichen Grüßen,\nMax Weber",
    translatedZh:
      "尊敬的团队，\n\n我们在生产环境中发现了一个关键问题。用户认证的API端点间歇性返回500错误。\n\n受影响的系统：\n- 登录服务\n- 令牌验证\n- SSO集成\n\n请以最高优先级处理此事。\n\n此致，\nMax Weber",
    tags: ["Support", "Urgent"],
    receivedAt: "30分钟前",
    score: 95,
    isNew: true,
    status: "pending",
    language: "德文",
  },
  {
    id: "mock-5",
    fromName: "Emily Chen",
    fromEmail: "emily.chen@example.com",
    avatarLetter: "E",
    avatarColor: "bg-chart-2",
    subject: "Design Review: New Dashboard UI Components",
    originalBody:
      "Hi everyone,\n\nI've completed the design review for the new dashboard UI components. Please find the Figma link below for the updated designs.\n\nChanges made:\n- Simplified navigation structure\n- Added dark mode support\n- Improved data visualization charts\n- New notification center design\n\nPlease review and share feedback by EOD Friday.\n\nThanks,\nEmily",
    translatedZh:
      "大家好，\n\n我已经完成了新仪表板UI组件的设计评审。请查看下方更新设计的Figma链接。\n\n所做更改：\n- 简化了导航结构\n- 添加了深色模式支持\n- 改进了数据可视化图表\n- 新的通知中心设计\n\n请在周五下班前审查并分享反馈。\n\n谢谢，\nEmily",
    tags: ["Design", "UI/UX"],
    receivedAt: "3小时前",
    score: 72,
    isNew: false,
    status: "replied",
    language: "英文",
  },
  {
    id: "mock-6",
    fromName: "Alex Kumar",
    fromEmail: "alex.kumar@example.com",
    avatarLetter: "A",
    avatarColor: "bg-chart-4",
    subject: "Sprint Retrospective Notes & Action Items",
    originalBody:
      "Team,\n\nHere are the notes from today's sprint retrospective.\n\nWhat went well:\n- Delivered all planned features on time\n- Improved test coverage to 87%\n- Great cross-team collaboration\n\nWhat to improve:\n- Reduce PR review turnaround time\n- Better documentation for new APIs\n- More consistent code review standards\n\nAction items have been added to Jira.\n\nCheers,\nAlex",
    translatedZh:
      "团队，\n\n以下是今天冲刺回顾的笔记。\n\n做得好的：\n- 按时交付了所有计划的功能\n- 测试覆盖率提高到87%\n- 出色的跨团队协作\n\n需要改进的：\n- 缩短PR审查周转时间\n- 改善新API的文档\n- 更一致的代码审查标准\n\n行动项已添加到Jira。\n\n干杯，\nAlex",
    tags: ["Sprint", "Retro"],
    receivedAt: "1天前",
    score: 65,
    isNew: false,
    status: "jira_created",
    language: "英文",
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const knownIdsParam = searchParams.get("knownIds")
    const knownIds = knownIdsParam
      ? new Set(knownIdsParam.split(",").filter(Boolean))
      : undefined

    if (!hasGmailCredentials()) {
      const analyzed = await analyzeEmails(MOCK_EMAILS, knownIds)
      return NextResponse.json({
        emails: analyzed,
        fetchedAt: new Date().toISOString(),
      })
    }

    const maxResults = Math.min(
      Number(searchParams.get("maxResults") ?? 20),
      50
    )

    const { fetchEmailsByLabels } = await import("@/lib/gmail")
    const rawEmails = await fetchEmailsByLabels(maxResults)
    const filtered = rawEmails.filter(
      (e) => e.fromEmail.toLowerCase() !== "mia@filomail.com",
    )
    const emails = await analyzeEmails(filtered, knownIds)
    return NextResponse.json({ emails, fetchedAt: new Date().toISOString() })
  } catch (error) {
    console.error("Failed to fetch emails:", error)
    const message =
      error instanceof Error ? error.message : "Unknown error fetching emails"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
