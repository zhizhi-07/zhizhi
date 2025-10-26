/**
 * Token 计数工具
 * 用于估算文本的 token 数量
 */

/**
 * 估算文本的 token 数量
 * 简单估算：中文约1个字=1 token，英文约1个词=1 token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  
  // 分离中文和非中文字符
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || []
  const nonChineseText = text.replace(/[\u4e00-\u9fa5]/g, '')
  
  // 中文字符数
  const chineseTokens = chineseChars.length
  
  // 英文按空格分词，标点符号也算1个token
  const englishWords = nonChineseText.trim().split(/\s+/).filter(Boolean)
  const englishTokens = englishWords.length
  
  // 总token数（粗略估算）
  return chineseTokens + englishTokens
}

/**
 * 统计多条消息的 token 数
 */
export interface TokenStats {
  systemPrompt: number
  lorebook: number
  messages: number
  total: number
  remaining: number
  percentage: number
}

export function calculateContextTokens(
  systemPrompt: string,
  lorebookContext: string,
  messages: string[],
  contextLimit: number = 8000
): TokenStats {
  const systemTokens = estimateTokens(systemPrompt)
  const lorebookTokens = estimateTokens(lorebookContext)
  const messageTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg), 0)
  
  const total = systemTokens + lorebookTokens + messageTokens
  const remaining = Math.max(0, contextLimit - total)
  const percentage = Math.min(100, (total / contextLimit) * 100)
  
  return {
    systemPrompt: systemTokens,
    lorebook: lorebookTokens,
    messages: messageTokens,
    total,
    remaining,
    percentage
  }
}

/**
 * 格式化 token 数量显示
 */
export function formatTokenCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}
