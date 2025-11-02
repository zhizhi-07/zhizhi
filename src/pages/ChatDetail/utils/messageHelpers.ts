/**
 * 消息处理工具函数
 */

import { Message } from '../types'
import { getCurrentTime, getCurrentTimestamp } from './timeHelpers'

/**
 * 创建新消息
 */
export const createMessage = (
  type: 'received' | 'sent' | 'system',
  content: string,
  options: Partial<Message> = {}
): Message => {
  return {
    id: Date.now(),
    type,
    content,
    time: getCurrentTime(),
    timestamp: getCurrentTimestamp(),
    ...options
  }
}

/**
 * 创建系统消息
 */
export const createSystemMessage = (content: string): Message => {
  return createMessage('system', content, { messageType: 'system' })
}

/**
 * 创建转账消息
 */
export const createTransferMessage = (
  type: 'received' | 'sent',
  amount: number,
  message: string = '',
  status: 'pending' | 'received' | 'expired' = 'pending'
): Message => {
  return createMessage(type, `[转账]`, {
    messageType: 'transfer',
    transfer: { amount, message, status }
  })
}

/**
 * 创建红包消息
 */
export const createRedEnvelopeMessage = (
  type: 'received' | 'sent',
  redEnvelopeId: string
): Message => {
  return createMessage(type, `[红包]`, {
    messageType: 'redenvelope',
    redEnvelopeId
  })
}

/**
 * 创建表情消息
 */
export const createEmojiMessage = (
  type: 'received' | 'sent',
  emojiUrl: string,
  emojiDescription?: string
): Message => {
  return createMessage(type, `[表情]`, {
    messageType: 'emoji',
    emojiUrl,
    emojiDescription
  })
}

/**
 * 创建图片消息
 */
export const createPhotoMessage = (
  type: 'received' | 'sent',
  photoDescription: string
): Message => {
  return createMessage(type, `[图片]`, {
    messageType: 'photo',
    photoDescription
  })
}

/**
 * 创建语音消息
 */
export const createVoiceMessage = (
  type: 'received' | 'sent',
  voiceText: string
): Message => {
  return createMessage(type, `[语音]`, {
    messageType: 'voice',
    voiceText
  })
}

/**
 * 创建位置消息
 */
export const createLocationMessage = (
  type: 'received' | 'sent',
  location: { name: string; address: string; latitude?: number; longitude?: number }
): Message => {
  return createMessage(type, `[位置]`, {
    messageType: 'location',
    location
  })
}

/**
 * 创建通话记录消息
 */
export const createCallRecordMessage = (
  type: 'received' | 'sent',
  callDuration: number,
  callMessages: Array<{id: number, type: 'user' | 'ai' | 'narrator', content: string, time: string}>
): Message => {
  return createMessage(type, `[通话记录]`, {
    isCallRecord: true,
    callDuration,
    callMessages
  })
}

/**
 * 检查消息是否可以撤回
 * 规则：2分钟内的消息可以撤回
 */
export const canRecallMessage = (message: Message): boolean => {
  if (!message.timestamp) return false
  const now = Date.now()
  const TWO_MINUTES = 2 * 60 * 1000
  return (now - message.timestamp) <= TWO_MINUTES
}

/**
 * 撤回消息
 */
export const recallMessage = (message: Message): Message => {
  return {
    ...message,
    isRecalled: true,
    recalledContent: message.content,
    originalType: message.type,
    type: 'system',
    content: message.type === 'sent' ? '你撤回了一条消息' : `${message.type === 'received' ? 'AI' : ''}撤回了一条消息`
  }
}

/**
 * 检查消息是否为空
 */
export const isEmptyMessage = (content: string): boolean => {
  return !content || content.trim() === ''
}

/**
 * 过滤隐藏消息（用于显示）
 */
export const filterVisibleMessages = (messages: Message[]): Message[] => {
  return messages.filter(msg => !msg.isHidden)
}

/**
 * 获取消息的显示内容
 */
export const getMessageDisplayContent = (message: Message): string => {
  if (message.isRecalled) {
    return message.content
  }
  
  switch (message.messageType) {
    case 'transfer':
      return '[转账]'
    case 'redenvelope':
      return '[红包]'
    case 'emoji':
      return '[表情]'
    case 'photo':
      return '[图片]'
    case 'voice':
      return '[语音]'
    case 'location':
      return '[位置]'
    case 'intimate_pay':
      return '[亲密付]'
    case 'couple_space_invite':
      return '[情侣空间邀请]'
    case 'xiaohongshu':
      return '[小红书]'
    case 'musicInvite':
      return '[一起听歌邀请]'
    case 'musicShare':
      return '[音乐分享]'
    default:
      return message.content
  }
}

