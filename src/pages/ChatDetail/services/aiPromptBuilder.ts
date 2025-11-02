/**
 * AI 提示词构建服务
 */

import { Message } from '../types'
import { Character, User } from '../../../context/ContactsContext'

interface PromptBuilderOptions {
  character: Character
  currentUser: User | null
  messages: Message[]
  messageLimit: number
  enableNarration: boolean
  streakDays?: number
  hasCoupleSpace?: boolean
  lorebookEntries?: Array<{ key: string; value: string }>
  memes?: Array<{ 梗: string; 含义: string }>
  customTemplate?: string
}

/**
 * 替换提示词中的变量
 */
export const replacePromptVariables = (
  text: string,
  charName: string,
  userName: string
): string => {
  return text
    .replace(/\{\{char\}\}/gi, charName)
    .replace(/\{\{user\}\}/gi, userName)
}

/**
 * 获取当前时间段
 */
export const getTimePeriod = (): string => {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 6) return '深夜/凌晨'
  if (hour >= 6 && hour < 9) return '早上'
  if (hour >= 9 && hour < 12) return '上午'
  if (hour >= 12 && hour < 14) return '中午'
  if (hour >= 14 && hour < 18) return '下午'
  if (hour >= 18 && hour < 20) return '傍晚'
  return '晚上'
}

/**
 * 获取当前时间字符串
 */
export const getCurrentTimeString = (): string => {
  const now = new Date()
  const timePeriod = getTimePeriod()
  const timeStr = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  return `${timePeriod} ${timeStr}`
}

/**
 * 构建对话历史文本
 */
/**
 * 获取红包状态描述
 */
const getRedEnvelopeStatus = (redEnvelopeId: string | undefined, characterId: string): string => {
  if (!redEnvelopeId) return '未知状态'

  try {
    const key = `redEnvelopes_${characterId}`
    const envelopes = JSON.parse(localStorage.getItem(key) || '[]')
    const redEnvelope = envelopes.find((e: any) => e.id === redEnvelopeId)

    if (!redEnvelope) return '未知状态'

    if (redEnvelope.status === 'claimed') {
      return `已被${redEnvelope.claimedBy}领取`
    } else if (redEnvelope.status === 'expired') {
      return '已过期'
    } else {
      return '待领取'
    }
  } catch {
    return '未知状态'
  }
}

export const buildConversationHistory = (
  messages: Message[],
  messageLimit: number,
  characterName: string,
  userName: string,
  characterId?: string
): string => {
  const recentMessages = messages.slice(-messageLimit)

  return recentMessages.map(msg => {
    const sender = msg.type === 'sent' ? userName : characterName
    let content = msg.content

    // 处理特殊消息类型
    if (msg.messageType === 'transfer') {
      content = `[转账] ¥${msg.transfer?.amount} - ${msg.transfer?.message || ''}`
    } else if (msg.messageType === 'redenvelope') {
      // 根据消息类型判断是谁发的红包
      const redEnvelopeSender = msg.type === 'sent' ? userName : characterName
      const status = characterId ? getRedEnvelopeStatus(msg.redEnvelopeId, characterId) : '未知状态'
      content = `[${redEnvelopeSender}发的红包，${status}]`
    } else if (msg.messageType === 'emoji') {
      content = `[表情] ${msg.emojiDescription || ''}`
    } else if (msg.messageType === 'photo') {
      content = `[图片] ${msg.photoDescription || ''}`
    } else if (msg.messageType === 'voice') {
      content = `[语音] ${msg.voiceText || ''}`
    } else if (msg.messageType === 'location') {
      content = `[位置] ${msg.location?.name || ''}`
    } else if (msg.messageType === 'musicInvite') {
      const songInfo = msg.musicInvite
      const inviteSender = msg.type === 'sent' ? userName : characterName
      const inviteStatus = songInfo?.status || 'pending'

      // 根据状态显示不同的信息
      if (inviteStatus === 'accepted') {
        content = `[${inviteSender}发起了一起听邀请：《${songInfo?.songTitle || '未知歌曲'}》- ${songInfo?.songArtist || '未知歌手'}，已接受]`
      } else if (inviteStatus === 'rejected') {
        content = `[${inviteSender}发起了一起听邀请：《${songInfo?.songTitle || '未知歌曲'}》- ${songInfo?.songArtist || '未知歌手'}，已拒绝]`
      } else {
        content = `[${inviteSender}发起了一起听邀请：《${songInfo?.songTitle || '未知歌曲'}》- ${songInfo?.songArtist || '未知歌手'}]`
      }
    } else if (msg.messageType === 'musicShare') {
      const songInfo = msg.musicShare
      content = `[音乐分享] 《${songInfo?.songTitle || '未知歌曲'}》- ${songInfo?.songArtist || '未知歌手'}`
    } else if (msg.messageType === 'xiaohongshu') {
      content = '[小红书笔记]'
    }
    
    // 添加引用消息
    if (msg.quotedMessage) {
      content = `[引用了${msg.quotedMessage.senderName}的消息: ${msg.quotedMessage.content}]\n${content}`
    }
    
    // 添加旁白
    if (msg.narrations && msg.narrations.length > 0) {
      const narrationText = msg.narrations
        .map(n => `[${n.type === 'action' ? '动作' : '心理'}] ${n.content}`)
        .join('\n')
      content = `${content}\n${narrationText}`
    }
    
    return `${sender}: ${content}`
  }).join('\n')
}

/**
 * 构建世界书上下文
 */
export const buildLorebookContext = (
  lorebookEntries: Array<{ key: string; value: string }>
): string => {
  if (!lorebookEntries || lorebookEntries.length === 0) {
    return ''
  }
  
  return lorebookEntries
    .map(entry => `${entry.key}: ${entry.value}`)
    .join('\n')
}

/**
 * 构建梗库上下文
 */
export const buildMemesContext = (
  memes: Array<{ 梗: string; 含义: string }>
): string => {
  if (!memes || memes.length === 0) {
    return ''
  }
  
  return memes
    .map(meme => `- ${meme.梗}: ${meme.含义}`)
    .join('\n')
}

/**
 * 构建系统提示词
 */
export const buildSystemPrompt = (options: PromptBuilderOptions): string => {
  const {
    character,
    currentUser,
    messages,
    messageLimit,
    enableNarration,
    streakDays = 0,
    hasCoupleSpace = false,
    lorebookEntries = [],
    memes = [],
    customTemplate
  } = options
  
  const charName = character.name
  const userName = currentUser?.name || '用户'
  const timeString = getCurrentTimeString()
  
  // 如果有自定义模板，使用自定义模板
  if (customTemplate) {
    return replacePromptVariables(customTemplate, charName, userName)
  }
  
  // 构建基础提示词
  let prompt = `你是 ${charName}。\n`
  
  // 添加角色描述
  if (character.description) {
    prompt += `${replacePromptVariables(character.description, charName, userName)}\n\n`
  }
  
  // 添加个性签名
  if (character.signature) {
    prompt += `个性签名: ${replacePromptVariables(character.signature, charName, userName)}\n\n`
  }
  
  // 添加关系和好感度
  if (character.relationship) {
    prompt += `你和${userName}的关系: ${character.relationship}\n`
  }
  if (character.favorability !== undefined) {
    prompt += `好感度: ${character.favorability}/100\n`
  }
  
  // 添加火花天数
  if (streakDays > 0) {
    prompt += `你们已经连续聊天 ${streakDays} 天了\n`
  }
  
  // 添加情侣空间状态
  if (hasCoupleSpace) {
    prompt += `你们已经开启了情侣空间\n`
  }
  
  prompt += `\n现在是${timeString}。\n\n`
  
  // 添加世界书
  if (lorebookEntries.length > 0) {
    prompt += `背景知识:\n${buildLorebookContext(lorebookEntries)}\n\n`
  }
  
  // 添加梗库
  if (memes.length > 0) {
    prompt += `网络用语参考（可以自然地使用）:\n${buildMemesContext(memes)}\n\n`
  }
  
  // 添加对话历史
  const conversationHistory = buildConversationHistory(messages, messageLimit, charName, userName, character.id)
  if (conversationHistory) {
    prompt += `最近的对话:\n${conversationHistory}\n\n`
  }
  
  // 添加回复指引
  prompt += `请以${charName}的身份回复${userName}的最后一条消息。`
  
  // 如果启用旁白
  if (enableNarration) {
    prompt += `\n\n你可以使用JSON格式返回，包含对话和旁白:\n`
    prompt += `{"text": "对话内容", "narrations": [{"type": "action", "content": "动作描述"}]}\n`
    prompt += `旁白类型: "action"(动作/表情) 或 "thought"(内心想法)`
  }
  
  return prompt
}

/**
 * 构建简单的文本提示词（不使用JSON格式）
 */
export const buildSimplePrompt = (options: PromptBuilderOptions): string => {
  const prompt = buildSystemPrompt({ ...options, enableNarration: false })
  return prompt + '\n\n请直接回复，不要使用JSON格式。'
}

