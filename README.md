# Gmail AI Agent

一个基于 Next.js + Claude AI 的 Gmail 智能处理工作台，帮助你快速处理用户邮件并管理产品需求。

## ✨ 功能特性

### 📬 邮件工作台
- **自动拉取邮件**：通过 Vercel Cron 定时从指定 Gmail 标签拉取邮件
- **AI 翻译**：自动将非中文邮件翻译为简体中文，方便快速理解
- **智能回复生成**：一键生成专业邮件回复，支持正式 / 友好 / 简短三种语气
- **一键录入 Jira**：将邮件内容自动分析并转换为结构化 Jira 工单（含现状分析 + 解决方案）
- **邮件状态管理**：支持待处理 / 已回信 / 已录入 Jira / 已完成四种状态追踪

### 📋 需求工单
- **需求上传**：支持文字描述 + 截图上传
- **AI 需求分析**：自动拆解需求背景、用户需求、解决方案、验收标准
- **自动创建 Jira**：分析完成后一键提交到指定 Jira 项目

## 🛠 技术栈

- **框架**：Next.js 14（App Router）+ TypeScript
- **UI**：shadcn/ui + Tailwind CSS
- **AI**：Anthropic Claude（claude-sonnet-4）
- **数据库**：Prisma + Turso（线上 libSQL / 本地 SQLite）
- **邮件**：Gmail API（OAuth 2.0）
- **项目管理**：Jira Cloud REST API
- **部署**：Vercel（含 Cron Job）

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/030106mia/v0-gmail-ai-agent.git
cd v0-gmail-ai-agent
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env.local`，填写以下配置：

```bash
cp .env.example .env.local
```

| 变量名 | 说明 |
|--------|------|
| `GMAIL_CLIENT_ID` | Gmail OAuth 客户端 ID |
| `GMAIL_CLIENT_SECRET` | Gmail OAuth 客户端密钥 |
| `GMAIL_REFRESH_TOKEN` | Gmail Refresh Token |
| `GMAIL_LABEL_IDS` | 要拉取的 Gmail 标签 ID（逗号分隔） |
| `ANTHROPIC_API_KEY` | Claude API Key |
| `JIRA_BASE_URL` | Jira 域名，如 `https://xxx.atlassian.net` |
| `JIRA_EMAIL` | Jira 账号邮箱 |
| `JIRA_API_TOKEN` | Jira API Token |
| `JIRA_PROJECT_KEY` | 目标 Jira 项目 Key（如 `FILO`） |
| `TURSO_DATABASE_URL` | Turso 数据库地址（线上部署必填） |
| `TURSO_AUTH_TOKEN` | Turso 认证 Token |
| `CRON_SECRET` | Vercel Cron 安全密钥（随机字符串） |

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 本地运行

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 📦 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 Vercel 导入仓库，填写所有环境变量
3. 部署完成后，Cron Job 会自动按配置频率拉取 Gmail 邮件

## 📁 项目结构

```
├── app/
│   ├── api/
│   │   ├── ai/          # AI 功能接口（翻译、回复、需求分析）
│   │   ├── cron/        # 定时拉取邮件
│   │   ├── emails/      # 邮件缓存读写
│   │   └── jira/        # Jira 工单操作
│   └── page.tsx         # 主页面
├── components/          # UI 组件
├── lib/
│   ├── ai.ts            # Claude AI 调用
│   ├── gmail.ts         # Gmail API 集成
│   ├── jira.ts          # Jira API 集成
│   ├── prompts.ts       # AI Prompt 模板
│   └── types.ts         # 类型定义
└── prisma/              # 数据库 Schema
```

## 📄 License

MIT
