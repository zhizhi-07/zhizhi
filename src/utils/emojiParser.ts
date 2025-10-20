import { Emoji } from './emojiStorage'

/**
 * AI 回复解析结果
 */
export interface ParsedAIResponse {
  /** 清理后的文字内容 */
  textContent: string
  /** 表情包索引列表 */
  emojiIndexes: number[]
  /** 是否有错误格式 */
  hasError: boolean
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 解析 AI 回复，提取表情包和文字内容
 * 
 * @param aiResponse AI 的原始回复
 * @param availableEmojis 可用的表情包列表
 * @returns 解析结果
 */
export function parseAIEmojiResponse(
  aiResponse: string,
  availableEmojis: Emoji[]
): ParsedAIResponse {
  const result: ParsedAIResponse = {
    textContent: '',
    emojiIndexes: [],
    hasError: false,
    errors: []
  }
  
  let cleaned = aiResponse
  
  // 1. 提取正确格式的表情包: [表情包:数字]
  const correctEmojiMatches = aiResponse.matchAll(/\[表情包:(\d+)\]/g)
  for (const match of correctEmojiMatches) {
    const index = parseInt(match[1])
    
    // 验证索引是否有效
    if (index >= 0 && index < availableEmojis.length) {
      result.emojiIndexes.push(index)
      console.log(`✅ 表情包 [${index}]: ${availableEmojis[index].description}`)
    } else {
      result.hasError = true
      result.errors.push(`无效的表情包索引: ${index} (可用范围: 0-${availableEmojis.length - 1})`)
      console.warn(`⚠️ 无效的表情包索引: ${index}`)
    }
  }
  
  // 2. 检测错误格式的表情包（使用了描述文字）
  const wrongEmojiMatches = aiResponse.matchAll(/\[表情包:([^\d\]]+[^\]]*)\]/g)
  for (const match of wrongEmojiMatches) {
    result.hasError = true
    result.errors.push(`错误的表情包格式: ${match[0]} (应该使用数字索引)`)
    console.error(`❌ 错误的表情包格式: ${match[0]}`)
    console.error(`💡 正确格式: [表情包:数字]，例如 [表情包:0]`)
  }
  
  // 3. 移除所有表情包标记
  cleaned = cleaned.replace(/\[表情包:\d+\]/g, '') // 正确格式
  cleaned = cleaned.replace(/\[表情包:[^\]]+\]/g, '') // 错误格式
  
  // 4. 移除上下文标记（AI 不应该发送这些）
  // 支持方括号和圆括号两种格式
  const contextMarkers = [
    /\(我发了一个表情包[^\)]*\)/g,  // 新格式：(我发了一个表情包：xxx)
    /\(对方发了一个表情包[^\)]*\)/g,  // 新格式：(对方发了一个表情包：xxx)
    /\[我发了表情包[^\]]*\]/g,  // 旧格式：[我发了表情包："xxx"]
    /\[对方发了表情包[^\]]*\]/g,  // 旧格式：[对方发了表情包："xxx"]
    /\[用户给你发了[^\]]*\]/g,
    /\[你给用户发了[^\]]*\]/g
  ]
  
  for (const marker of contextMarkers) {
    if (marker.test(cleaned)) {
      result.hasError = true
      result.errors.push('AI 发送了上下文标记（已自动清理）')
      console.warn('⚠️ AI 发送了上下文标记，已自动清理')
    }
    cleaned = cleaned.replace(marker, '')
  }
  
  // 5. 清理多余的空白
  result.textContent = cleaned.trim()
  
  // 6. 输出解析结果
  if (result.emojiIndexes.length > 0) {
    console.log(`😀 AI 发送了 ${result.emojiIndexes.length} 个表情包`)
  }
  if (result.textContent) {
    console.log(`💬 AI 文字内容: "${result.textContent}"`)
  }
  if (result.hasError) {
    console.warn(`⚠️ 解析过程中发现 ${result.errors.length} 个错误`)
  }
  
  return result
}

/**
 * 将消息历史转换为 AI 可理解的对话格式
 * 
 * @param messages 消息列表
 * @returns 对话历史
 */
export function buildConversationHistory(messages: any[]): Array<{role: 'user' | 'assistant', content: string}> {
  return messages
    .filter(msg => msg.type !== 'system' || !msg.isHidden) // 过滤隐藏的系统消息
    .map(msg => {
      // 表情包消息转换为上下文标记
      if (msg.messageType === 'emoji') {
        const context = msg.type === 'sent' 
          ? '[对方发了表情包]'  // 用户发的
          : '[我发了表情包]'    // AI 发的
        
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: context
        }
      }
      
      // 语音消息
      if (msg.messageType === 'voice' && msg.voiceText) {
        const voiceContext = msg.type === 'sent'
          ? `[语音: ${msg.voiceText}]`
          : msg.voiceText
        
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: voiceContext
        }
      }
      
      // 照片消息
      if (msg.messageType === 'photo' && msg.photoDescription) {
        const photoContext = msg.type === 'sent'
          ? `[照片: ${msg.photoDescription}]`
          : msg.content || `[照片: ${msg.photoDescription}]`
        
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: photoContext
        }
      }
      
      // 位置消息
      if (msg.messageType === 'location' && msg.location) {
        const locationContext = `[位置: ${msg.location.name} - ${msg.location.address}]`
        
        return {
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: locationContext
        }
      }
      
      // 普通文字消息
      return {
        role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
        content: msg.content || ''
      }
    })
}

/**
 * 生成表情包使用说明（用于提示词）
 * 
 * @param availableEmojis 可用的表情包列表
 * @returns 表情包使用说明
 */
export function generateEmojiInstructions(availableEmojis: Emoji[]): string {
  if (availableEmojis.length === 0) {
    return '暂无可用表情包'
  }
  
  const emojiList = availableEmojis
    .map((emoji, index) => `[表情包:${index}] - ${emoji.description}`)
    .join('\n')
  
  return `可用表情包（可选）：
${emojiList}

发送格式：[表情包:数字]
例如：好的[表情包:0]

注意：表情包是可选的，大部分时候纯文字就够了。`
}
