/**
 * 存储工具函数
 */

import { Message } from '../types'

const DATA_VERSION = 2 // 当前数据版本

/**
 * 加载聊天消息
 */
export const loadChatMessages = (chatId: string): Message[] => {
  const savedMessages = localStorage.getItem(`chat_messages_${chatId}`)
  if (!savedMessages) return []
  
  try {
    const loadedMessages = JSON.parse(savedMessages)
    const currentVersion = parseInt(localStorage.getItem(`chat_data_version_${chatId}`) || '0')
    
    // 数据迁移
    let needsSave = currentVersion < DATA_VERSION
    const processedMessages = loadedMessages.map((msg: Message) => {
      let updated = { ...msg }
      
      // 添加时间戳（如果没有）
      if (!msg.timestamp) {
        needsSave = true
        const [hours, minutes] = msg.time.split(':').map(Number)
        const today = new Date()
        today.setHours(hours || 0, minutes || 0, 0, 0)
        
        // 如果解析的时间在未来，说明是昨天的消息
        if (today.getTime() > Date.now()) {
          today.setDate(today.getDate() - 1)
        }
        
        updated.timestamp = today.getTime()
      }
      
      // 修复旧的转账消息：如果备注是"转账"或"你发起了一笔转账"，改为空字符串
      if (msg.messageType === 'transfer' && msg.transfer?.message) {
        if (msg.transfer.message === '转账' || msg.transfer.message === '你发起了一笔转账') {
          needsSave = true
          updated = {
            ...updated,
            transfer: {
              ...updated.transfer!,
              message: ''
            }
          }
        }
      }
      
      return updated
    })
    
    // 如果有数据被迁移，保存回localStorage
    if (needsSave) {
      setTimeout(() => {
        saveChatMessages(chatId, processedMessages)
        localStorage.setItem(`chat_data_version_${chatId}`, String(DATA_VERSION))
        console.log(`✅ 数据已迁移到版本 ${DATA_VERSION}`)
      }, 0)
    }
    
    return processedMessages
  } catch (error) {
    console.error('加载消息失败:', error)
    return []
  }
}

/**
 * 保存聊天消息
 */
export const saveChatMessages = (chatId: string, messages: Message[]): void => {
  try {
    localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages))
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

/**
 * 防抖保存消息
 */
let saveTimeoutId: number | undefined

export const debouncedSaveChatMessages = (chatId: string, messages: Message[], delay: number = 500): void => {
  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId)
  }
  
  saveTimeoutId = window.setTimeout(() => {
    saveChatMessages(chatId, messages)
  }, delay)
}

/**
 * 清除聊天消息
 */
export const clearChatMessages = (chatId: string): void => {
  localStorage.removeItem(`chat_messages_${chatId}`)
  localStorage.removeItem(`chat_data_version_${chatId}`)
}

/**
 * 获取聊天背景
 */
export const getChatBackground = (chatId: string): string => {
  return localStorage.getItem(`chat_background_${chatId}`) || ''
}

/**
 * 设置聊天背景
 */
export const setChatBackground = (chatId: string, background: string): void => {
  localStorage.setItem(`chat_background_${chatId}`, background)
}

/**
 * 获取气泡颜色
 */
export const getBubbleColor = (chatId: string, type: 'user' | 'ai'): string => {
  const key = type === 'user' ? 'user_bubble_color' : 'ai_bubble_color'
  const chatKey = `${key}_${chatId}`
  return localStorage.getItem(chatKey) || localStorage.getItem(key) || (type === 'user' ? '#FFD4E5' : '#FFFFFF')
}

/**
 * 设置气泡颜色
 */
export const setBubbleColor = (chatId: string, type: 'user' | 'ai', color: string): void => {
  const key = type === 'user' ? 'user_bubble_color' : 'ai_bubble_color'
  const chatKey = `${key}_${chatId}`
  localStorage.setItem(chatKey, color)
}

/**
 * 获取气泡 CSS
 */
export const getBubbleCSS = (chatId: string, type: 'user' | 'ai'): string => {
  const key = type === 'user' ? 'user_bubble_css' : 'ai_bubble_css'
  const chatKey = `${key}_${chatId}`
  return localStorage.getItem(chatKey) || localStorage.getItem(key) || ''
}

/**
 * 设置气泡 CSS
 */
export const setBubbleCSS = (chatId: string, type: 'user' | 'ai', css: string): void => {
  const key = type === 'user' ? 'user_bubble_css' : 'ai_bubble_css'
  const chatKey = `${key}_${chatId}`
  localStorage.setItem(chatKey, css)
}

/**
 * 获取旁白设置
 */
export const getNarrationEnabled = (chatId: string): boolean => {
  const saved = localStorage.getItem(`narrator_enabled_${chatId}`)
  return saved === 'true'
}

/**
 * 设置旁白
 */
export const setNarrationEnabled = (chatId: string, enabled: boolean): void => {
  localStorage.setItem(`narrator_enabled_${chatId}`, String(enabled))
}

/**
 * 获取红包封面
 */
export const getRedEnvelopeCover = (chatId: string): string => {
  return localStorage.getItem(`red_envelope_cover_${chatId}`) || ''
}

/**
 * 获取红包图标
 */
export const getRedEnvelopeIcon = (chatId: string): string => {
  return localStorage.getItem(`red_envelope_icon_${chatId}`) || ''
}

/**
 * 获取转账封面
 */
export const getTransferCover = (chatId: string): string => {
  return localStorage.getItem(`transfer_cover_${chatId}`) || ''
}

/**
 * 获取转账图标
 */
export const getTransferIcon = (chatId: string): string => {
  return localStorage.getItem(`transfer_icon_${chatId}`) || ''
}

