export const PROMPTS = {
  /**
   * 翻译邮件：将非中文邮件原文翻译为简体中文
   */
  translateEmail: `你是一位专业的邮件翻译助手。请将以下非中文邮件内容翻译为简体中文。

要求：
- 准确传达原文含义，不遗漏任何信息
- 保持邮件的正式程度和语气风格
- 专业术语翻译准确，必要时在括号内保留英文原词
- 保留原文中的人名、公司名、产品名等专有名词（可在首次出现时附上中文释义）
- 保持原文的段落结构和格式
- 如果原文已经是中文，直接返回原文即可

邮件原文：
{{emailBody}}`,

  /**
   * 生成回信：语气友好，回答用户的问题
   */
  generateReply: `你是一位专业、友好的邮件回复助手。请根据以下邮件内容生成一封回信。

要求：
- 语气友好、热情、专业，让收件人感受到尊重和重视
- 针对邮件中提出的每一个问题或请求，逐一给出清晰的回应
- 回复结构清晰，条理分明
- 使用简体中文回复
- 开头以合适的称呼问候，结尾以礼貌的祝福语收尾
- 如果邮件中有需要确认的事项，明确表达确认或说明后续跟进计划
- 回信长度适中，避免过于冗长或过于简短

发件人：{{fromName}} <{{fromEmail}}>
邮件主题：{{subject}}
邮件原文：
{{emailBody}}

翻译后的内容（如有）：
{{translatedBody}}`,

  /**
   * 录入 Jira：根据邮件内容生成工单标题和描述
   */
  createJiraTicket: `你是一位经验丰富的项目管理助手。请根据以下邮件内容，生成一条结构化的 Jira 工单。

要求：
- 标题（Title）：简洁明了，概括核心问题或需求，不超过 80 个字符
- 描述（Description）：使用以下结构输出
  1. **背景**：简要说明邮件来源和上下文
  2. **问题/需求描述**：详细描述需要解决的问题或实现的需求
  3. **关键信息**：提取邮件中涉及的关键数据、日期、人员等
  4. **建议的处理方式**（如适用）：基于邮件内容给出可能的解决方向
- 使用简体中文
- 描述中保留重要的原始信息，避免信息丢失

请按以下 JSON 格式输出：
{
  "title": "工单标题",
  "description": "工单描述（Markdown 格式）"
}

发件人：{{fromName}} <{{fromEmail}}>
邮件主题：{{subject}}
邮件原文：
{{emailBody}}

翻译后的内容（如有）：
{{translatedBody}}`,
} as const

export type PromptKey = keyof typeof PROMPTS

/**
 * 填充 prompt 模板中的变量占位符
 * 用法：fillPrompt("translateEmail", { emailBody: "..." })
 */
export function fillPrompt(
  key: PromptKey,
  variables: Record<string, string>
): string {
  let prompt = PROMPTS[key] as string
  for (const [varName, value] of Object.entries(variables)) {
    prompt = prompt.replaceAll(`{{${varName}}}`, value)
  }
  return prompt
}
