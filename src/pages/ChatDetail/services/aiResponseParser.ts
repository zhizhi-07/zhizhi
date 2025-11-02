/**
 * AI 响应解析服务
 */

interface Narration {
  type: 'action' | 'thought'
  content: string
}

interface ParsedAIResponse {
  text: string
  narrations: Narration[]
  hasSpecialCommand?: boolean
  specialCommand?: {
    type: 'call' | 'redenvelope' | 'transfer' | 'music' | 'location' | 'photo'
    data?: any
  }
}

/**
 * 尝试解析JSON格式的AI响应
 */
export const tryParseJSON = (response: string): any | null => {
  try {
    // 尝试直接解析
    return JSON.parse(response)
  } catch {
    // 尝试提取JSON部分
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        return null
      }
    }
    return null
  }
}

/**
 * 提取旁白信息
 */
export const extractNarrations = (response: any): Narration[] => {
  const narrations: Narration[] = []
  
  if (response.narrations && Array.isArray(response.narrations)) {
    response.narrations.forEach((n: any) => {
      if (n.type && n.content) {
        narrations.push({
          type: n.type === 'thought' ? 'thought' : 'action',
          content: n.content
        })
      }
    })
  }
  
  return narrations
}

/**
 * 检测特殊命令
 */
export const detectSpecialCommand = (text: string): ParsedAIResponse['specialCommand'] | undefined => {
  // 检测打电话命令
  if (text.includes('[打电话]') || text.includes('[拨打电话]') || text.includes('[语音通话]')) {
    return { type: 'call' }
  }
  
  // 检测发红包命令
  const redEnvelopeMatch = text.match(/\[发红包[：:]\s*(\d+(?:\.\d+)?)\s*元\]/)
  if (redEnvelopeMatch) {
    return {
      type: 'redenvelope',
      data: { amount: parseFloat(redEnvelopeMatch[1]) }
    }
  }
  
  // 检测转账命令
  const transferMatch = text.match(/\[转账[：:]\s*(\d+(?:\.\d+)?)\s*元\]/)
  if (transferMatch) {
    return {
      type: 'transfer',
      data: { amount: parseFloat(transferMatch[1]) }
    }
  }
  
  // 检测发送图片命令
  if (text.includes('[发送图片]') || text.includes('[发图片]')) {
    return { type: 'photo' }
  }
  
  // 检测发送位置命令
  if (text.includes('[发送位置]') || text.includes('[分享位置]')) {
    return { type: 'location' }
  }
  
  // 检测音乐邀请命令
  if (text.includes('[一起听歌]') || text.includes('[音乐邀请]')) {
    return { type: 'music' }
  }
  
  return undefined
}

/**
 * 清理文本中的特殊命令标记
 */
export const cleanSpecialCommands = (text: string): string => {
  return text
    .replace(/\[打电话\]/g, '')
    .replace(/\[拨打电话\]/g, '')
    .replace(/\[语音通话\]/g, '')
    .replace(/\[发红包[：:]\s*\d+(?:\.\d+)?\s*元\]/g, '')
    .replace(/\[转账[：:]\s*\d+(?:\.\d+)?\s*元\]/g, '')
    .replace(/\[发送图片\]/g, '')
    .replace(/\[发图片\]/g, '')
    .replace(/\[发送位置\]/g, '')
    .replace(/\[分享位置\]/g, '')
    .replace(/\[一起听歌\]/g, '')
    .replace(/\[音乐邀请\]/g, '')
    .trim()
}

/**
 * 解析AI响应
 */
export const parseAIResponse = (response: string): ParsedAIResponse => {
  // 尝试解析JSON格式
  const jsonData = tryParseJSON(response)
  
  if (jsonData) {
    // JSON格式响应
    const text = jsonData.text || jsonData.content || response
    const narrations = extractNarrations(jsonData)
    const specialCommand = detectSpecialCommand(text)
    
    return {
      text: cleanSpecialCommands(text),
      narrations,
      hasSpecialCommand: !!specialCommand,
      specialCommand
    }
  }
  
  // 纯文本格式响应
  const specialCommand = detectSpecialCommand(response)
  
  return {
    text: cleanSpecialCommands(response),
    narrations: [],
    hasSpecialCommand: !!specialCommand,
    specialCommand
  }
}

/**
 * 验证AI响应是否有效
 */
export const isValidAIResponse = (response: string): boolean => {
  if (!response || typeof response !== 'string') {
    return false
  }
  
  const trimmed = response.trim()
  if (trimmed.length === 0) {
    return false
  }
  
  // 检查是否只包含特殊命令标记
  const cleaned = cleanSpecialCommands(trimmed)
  if (cleaned.length === 0) {
    return false
  }
  
  return true
}

/**
 * 格式化AI响应用于显示
 */
export const formatAIResponseForDisplay = (parsed: ParsedAIResponse): string => {
  let display = parsed.text
  
  // 添加旁白（用于调试或特殊显示）
  if (parsed.narrations.length > 0) {
    const narrationText = parsed.narrations
      .map(n => `[${n.type === 'action' ? '动作' : '心理'}] ${n.content}`)
      .join('\n')
    display += `\n\n${narrationText}`
  }
  
  return display
}

/**
 * 提取AI响应中的情绪标签
 */
export const extractEmotionTags = (text: string): string[] => {
  const emotions: string[] = []
  const emotionPatterns = [
    /\(.*?开心.*?\)/g,
    /\(.*?难过.*?\)/g,
    /\(.*?生气.*?\)/g,
    /\(.*?害羞.*?\)/g,
    /\(.*?惊讶.*?\)/g,
    /\(.*?疑惑.*?\)/g,
  ]
  
  emotionPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      emotions.push(...matches)
    }
  })
  
  return emotions
}

/**
 * 检测AI是否在被拉黑状态下回复
 */
export const detectBlockedResponse = (text: string): boolean => {
  const blockedKeywords = [
    '拉黑',
    '黑名单',
    '不想理你',
    '别烦我',
    '滚',
  ]
  
  return blockedKeywords.some(keyword => text.includes(keyword))
}

