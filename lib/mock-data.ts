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

export const mockEmails: EmailItem[] = [
  {
    id: "1",
    fromName: "Sarah Johnson",
    fromEmail: "sarah.johnson@techcorp.com",
    avatarLetter: "S",
    avatarColor: "bg-primary",
    subject: "Q1 Product Feedback - Performance Issues on Dashboard",
    originalBody: `Hi Team,

I wanted to share some feedback from our users regarding the Q1 release. Several customers have reported slow loading times on the dashboard, particularly when dealing with datasets exceeding 10,000 records.

The main complaints are:
1. Initial page load takes 8-12 seconds
2. Filtering operations cause UI freezes
3. Export functionality times out for large datasets

Could we prioritize these fixes in the next sprint? Happy to jump on a call to discuss further.

Best regards,
Sarah`,
    translatedZh: `你好团队，

我想分享一些关于Q1版本的用户反馈。多位客户反映仪表盘加载速度较慢，特别是在处理超过10,000条记录的数据集时。

主要问题包括：
1. 首次页面加载需要8-12秒
2. 筛选操作导致界面卡顿
3. 大数据集导出功能超时

我们能否在下一个迭代周期优先处理这些问题？随时可以安排通话讨论。

此致，
Sarah`,
    tags: ["重要", "客户反馈", "性能问题"],
    receivedAt: "2小时前",
    score: 95,
    isNew: true,
    status: "pending",
    language: "英文",
  },
  {
    id: "2",
    fromName: "Takeshi Yamamoto",
    fromEmail: "t.yamamoto@nippon-logistics.jp",
    avatarLetter: "T",
    avatarColor: "bg-success",
    subject: "出荷通知 - 注文番号 #JP-2024-0892",
    originalBody: `お世話になっております。

ご注文いただいた商品の出荷が完了しましたことをお知らせいたします。

注文番号：#JP-2024-0892
出荷日：2024年3月15日
配送業者：ヤマト運輸
追跡番号：YMT-8839201456

到着予定日：3月18日～20日

何かご不明な点がございましたら、お気軽にお問い合わせください。

山本 武志`,
    translatedZh: `您好，

谨此通知您，您订购的商品已完成发货。

订单号：#JP-2024-0892
发货日期：2024年3月15日
配送公司：大和运输
追踪号码：YMT-8839201456

预计到达日期：3月18日～20日

如有任何疑问，请随时联系我们。

山本 武志`,
    tags: ["物流", "发货通知"],
    receivedAt: "5小时前",
    score: 60,
    isNew: true,
    status: "pending",
    language: "日文",
  },
  {
    id: "3",
    fromName: "Pierre Dubois",
    fromEmail: "p.dubois@eurofinance.fr",
    avatarLetter: "P",
    avatarColor: "bg-warning",
    subject: "Facture #INV-2024-3301 - Paiement en attente",
    originalBody: `Bonjour,

Veuillez trouver ci-joint la facture #INV-2024-3301 d'un montant de 15 750,00 EUR pour les services de consultation rendus au cours du mois de février 2024.

Détails de la facture :
- Consultation stratégique : 80 heures × 150 EUR = 12 000 EUR
- Analyse de marché : forfait 2 500 EUR
- Frais de déplacement : 1 250 EUR

Conditions de paiement : Net 30 jours
Date d'échéance : 15 avril 2024

Merci de votre attention.

Cordialement,
Pierre Dubois
EuroFinance Consulting`,
    translatedZh: `您好，

请查收附件中的发票 #INV-2024-3301，金额为 15,750.00 欧元，涵盖2024年2月提供的咨询服务。

发票详情：
- 战略咨询：80小时 × 150欧元 = 12,000欧元
- 市场分析：一口价 2,500欧元
- 差旅费用：1,250欧元

付款条件：净30天
到期日：2024年4月15日

感谢关注。

此致敬意，
Pierre Dubois
EuroFinance 咨询`,
    tags: ["重要", "财务", "发票"],
    receivedAt: "1天前",
    score: 88,
    isNew: false,
    status: "pending",
    language: "法文",
  },
  {
    id: "4",
    fromName: "Alex Chen",
    fromEmail: "alex.chen@devhub.io",
    avatarLetter: "A",
    avatarColor: "bg-destructive",
    subject: "Critical Bug Report - Authentication Bypass in v3.2.1",
    originalBody: `Hello Security Team,

We've identified a critical security vulnerability in version 3.2.1 of the authentication module. The issue allows unauthorized users to bypass the two-factor authentication flow under specific conditions.

Steps to reproduce:
1. Initiate login with valid credentials
2. At the 2FA prompt, send a modified API request with an empty token field
3. The system incorrectly validates and grants access

Affected versions: 3.2.0 - 3.2.1
Severity: Critical (CVSS 9.1)

This needs immediate attention. We've temporarily implemented a server-side patch but a permanent fix is required.

Regards,
Alex Chen
Security Research Team`,
    translatedZh: `你好安全团队，

我们在认证模块3.2.1版本中发现了一个严重的安全漏洞。该问题允许未授权用户在特定条件下绕过双因素认证流程。

复现步骤：
1. 使用有效凭据发起登录
2. 在双因素认证提示时，发送一个token字段为空的修改后的API请求
3. 系统错误地验证并授予访问权限

受影响版本：3.2.0 - 3.2.1
严重程度：严重（CVSS 9.1）

这需要立即处理。我们已临时实施了服务端补丁，但需要永久修复方案。

此致，
Alex Chen
安全研究团队`,
    tags: ["紧急", "Bug报告", "安全"],
    receivedAt: "3小时前",
    score: 99,
    isNew: true,
    status: "pending",
    language: "英文",
  },
  {
    id: "5",
    fromName: "Maria Garcia",
    fromEmail: "m.garcia@latampartners.mx",
    avatarLetter: "M",
    avatarColor: "bg-chart-5",
    subject: "Partnership Inquiry - Latin America Market Expansion",
    originalBody: `Dear Business Development Team,

I'm reaching out on behalf of LatAm Partners regarding a potential strategic partnership for market expansion into Latin America.

We specialize in helping technology companies establish their presence across key LATAM markets including Mexico, Brazil, Colombia, and Argentina. Our services include:

- Market entry strategy and regulatory compliance
- Local team recruitment and management
- Distribution channel development
- Cultural adaptation and localization

We've successfully helped 40+ tech companies enter the LATAM market over the past 5 years, with an average 300% ROI within the first 18 months.

Would your team be available for an introductory meeting next week?

Warm regards,
Maria Garcia
Head of Business Development
LatAm Partners`,
    translatedZh: `尊敬的商务拓展团队，

我代表LatAm Partners就拉丁美洲市场扩张的潜在战略合作伙伴关系与您联系。

我们专注于帮助科技企业在拉美关键市场建立业务，包括墨西哥、巴西、哥伦比亚和阿根廷。我们的服务包括：

- 市场进入策略和合规咨询
- 本地团队招聘和管理
- 分销渠道开发
- 文化适配和本地化

在过去5年中，我们已成功帮助40多家科技公司进入拉美市场，18个月内平均投资回报率达300%。

贵团队下周是否有时间安排一次初步会议？

此致，
Maria Garcia
商务拓展负责人
LatAm Partners`,
    tags: ["合作", "商务"],
    receivedAt: "2天前",
    score: 75,
    isNew: false,
    status: "replied",
    language: "英文",
  },
  {
    id: "6",
    fromName: "Hans Mueller",
    fromEmail: "h.mueller@techberlin.de",
    avatarLetter: "H",
    avatarColor: "bg-chart-2",
    subject: "Technischer Support - API-Integration Fehler #4521",
    originalBody: `Guten Tag,

wir haben ein Problem mit der API-Integration festgestellt. Seit dem letzten Update (v2.8.3) erhalten wir intermittierende 503-Fehler bei den Webhook-Endpunkten.

Fehlermeldung:
"Service Unavailable - Gateway timeout after 30s"

Betroffene Endpunkte:
- /api/v2/webhooks/order-created
- /api/v2/webhooks/payment-confirmed

Das Problem tritt hauptsächlich während der Hauptlastzeiten auf (10:00-14:00 CET).

Protokollauszüge und HAR-Dateien sind angehängt.

Mit freundlichen Grüßen,
Hans Mueller
Senior Backend Engineer
TechBerlin GmbH`,
    translatedZh: `您好，

我们发现API集成出现了问题。自上次更新（v2.8.3）以来，我们在Webhook端点上间歇性地收到503错误。

错误信息：
"Service Unavailable - Gateway timeout after 30s"

受影响的端点：
- /api/v2/webhooks/order-created
- /api/v2/webhooks/payment-confirmed

该问题主要在高峰时段出现（中欧时间10:00-14:00）。

日志摘录和HAR文件已附上。

此致敬意，
Hans Mueller
高级后端工程师
TechBerlin GmbH`,
    tags: ["技术支持", "API", "Bug报告"],
    receivedAt: "8小时前",
    score: 82,
    isNew: false,
    status: "jira_created",
    language: "德文",
  },
  {
    id: "7",
    fromName: "Emily Watson",
    fromEmail: "e.watson@globalretail.com",
    avatarLetter: "E",
    avatarColor: "bg-primary",
    subject: "Monthly Performance Report - March 2024",
    originalBody: `Hi Team,

Please find attached the monthly performance report for March 2024. Here are the key highlights:

Revenue: $2.4M (+15% MoM)
Active Users: 45,200 (+8% MoM)
Churn Rate: 2.1% (-0.3% MoM)
NPS Score: 72 (+5 points)

Top performing regions:
1. North America: $1.2M
2. Europe: $680K
3. Asia-Pacific: $520K

Areas requiring attention:
- Customer support response time increased to 4.2 hours
- Mobile app crash rate at 1.8% (target: <1%)
- Feature adoption for new reporting module at 23%

Full details in the attached PDF.

Best,
Emily Watson
Head of Analytics`,
    translatedZh: `你好团队，

请查收2024年3月的月度绩效报告。以下是关键亮点：

收入：240万美元（环比+15%）
活跃用户：45,200（环比+8%）
流失率：2.1%（环比-0.3%）
NPS评分：72（+5分）

表现最佳的地区：
1. 北美：120万美元
2. 欧洲：68万美元
3. 亚太：52万美元

需要关注的领域：
- 客服响应时间增至4.2小时
- 移动端崩溃率1.8%（目标：<1%）
- 新报表模块功能采用率23%

完整详情见附件PDF。

此致，
Emily Watson
分析负责人`,
    tags: ["报告", "数据"],
    receivedAt: "1天前",
    score: 70,
    isNew: false,
    status: "completed",
    language: "英文",
  },
  {
    id: "8",
    fromName: "Kenji Tanaka",
    fromEmail: "k.tanaka@sakura-soft.jp",
    avatarLetter: "K",
    avatarColor: "bg-chart-4",
    subject: "契約更新のご確認 - 年間ライセンス",
    originalBody: `お世話になっております。

貴社との年間ライセンス契約（契約番号：LIC-2023-0456）の更新時期が近づいておりますのでご連絡いたします。

現在の契約内容：
- ライセンス種別：エンタープライズ
- ライセンス数：150席
- 契約期間：2023年4月1日～2024年3月31日
- 年間料金：¥18,000,000

更新にあたり、以下の変更をご提案いたします：
- ライセンス数の増加：150席 → 200席
- 新機能「AI分析モジュール」の追加
- 更新後の年間料金：¥22,500,000

ご検討のほど、よろしくお願いいたします。

田中 健二
桜ソフト株式会社`,
    translatedZh: `您好，

特此通知贵公司的年度许可合同（合同编号：LIC-2023-0456）即将到期续约。

当前合同内容：
- 许可类型：企业版
- 许可数量：150个席位
- 合同期限：2023年4月1日～2024年3月31日
- 年费：18,000,000日元

续约方面，我们提出以下变更建议：
- 许可数量增加：150席 → 200席
- 新增"AI分析模块"功能
- 续约后年费：22,500,000日元

敬请审阅。

田中 健二
樱花软件株式会社`,
    tags: ["合同", "续约", "重要"],
    receivedAt: "5天前",
    score: 85,
    isNew: false,
    status: "pending",
    language: "日文",
  },
]

export const statusLabels: Record<EmailStatus, string> = {
  pending: "待处理",
  replied: "已回信",
  jira_created: "已录入Jira",
  completed: "已完成",
}

export const statusCounts = {
  pending: mockEmails.filter((e) => e.status === "pending").length,
  replied: mockEmails.filter((e) => e.status === "replied").length,
  jira_created: mockEmails.filter((e) => e.status === "jira_created").length,
  completed: mockEmails.filter((e) => e.status === "completed").length,
}
