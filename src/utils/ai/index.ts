/**
 * AI 相关工具函数统一导出
 */

// API 调用
export { callAI, callAIStream } from '../api'
export { callAIWithRetry } from '../apiWithRetry'

// AI 响应解析
export { parseAIResponse } from '../aiResponseParser'

// 记忆系统
export { memorySystem } from '../memorySystem'
export { cleanupOldMemories } from '../memoryCleanup'

// Lorebook 系统
export { lorebookSystem } from '../lorebookSystem'

// 提示词
export * from '../prompts'

// Token 计数
export { countTokens, calculateContextTokens } from '../tokenCounter'

// AI 主动消息
export { generateProactiveMessage } from '../aiProactiveMessage'

// AI 电话生成
export { generateAIPhoneCall } from '../aiPhoneGenerator'
export { generateBackgroundPhoneCall } from '../backgroundPhoneGenerator'
export { parsePhoneContent } from '../phoneContentParser'

// 背景 AI
export { backgroundAI } from '../backgroundAI'

// 群聊 AI
export { handleGroupAIChat } from '../groupAIChat'

