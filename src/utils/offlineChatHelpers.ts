/**
 * 线下聊天工具函数
 * 包含消息处理、会话管理等功能
 */

import type { ChatMessage, ChatSession } from '../types/offline'

// ==================== ID生成 ====================

/**
 * 生成唯一的消息ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 生成唯一的会话ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ==================== 消息创建 ====================

/**
 * 创建用户消息
 */
export function createUserMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'user',
    content: content.trim(),
    timestamp: Date.now()
  }
}

/**
 * 创建AI消息
 * @param content - 消息内容
 * @param isSwipe - 是否作为swipe添加到上一条消息
 */
export function createAssistantMessage(content: string): ChatMessage {
  return {
    id: generateMessageId(),
    role: 'assistant',
    content: content.trim(),
    timestamp: Date.now(),
    swipes: [content.trim()],
    currentSwipeIndex: 0
  }
}

// ==================== Swipe功能 ====================

/**
 * 添加新的swipe到消息
 */
export function addSwipeToMessage(message: ChatMessage, newContent: string): ChatMessage {
  const swipes = message.swipes || [message.content]
  return {
    ...message,
    swipes: [...swipes, newContent],
    currentSwipeIndex: swipes.length,
    content: newContent
  }
}

/**
 * 切换到指定的swipe
 */
export function switchToSwipe(message: ChatMessage, swipeIndex: number): ChatMessage {
  if (!message.swipes || swipeIndex < 0 || swipeIndex >= message.swipes.length) {
    return message
  }
  
  return {
    ...message,
    currentSwipeIndex: swipeIndex,
    content: message.swipes[swipeIndex]
  }
}

/**
 * 向左swipe（上一个回复）
 */
export function swipeLeft(message: ChatMessage): ChatMessage | null {
  const currentIndex = message.currentSwipeIndex ?? 0
  if (currentIndex <= 0) return null
  
  return switchToSwipe(message, currentIndex - 1)
}

/**
 * 向右swipe（下一个回复）
 */
export function swipeRight(message: ChatMessage): ChatMessage | null {
  const swipes = message.swipes || []
  const currentIndex = message.currentSwipeIndex ?? 0
  if (currentIndex >= swipes.length - 1) return null
  
  return switchToSwipe(message, currentIndex + 1)
}

// ==================== 消息编辑 ====================

/**
 * 更新消息内容
 */
export function updateMessageContent(message: ChatMessage, newContent: string): ChatMessage {
  const swipes = message.swipes || [message.content]
  const currentIndex = message.currentSwipeIndex ?? 0
  
  // 更新当前swipe的内容
  const newSwipes = [...swipes]
  newSwipes[currentIndex] = newContent
  
  return {
    ...message,
    content: newContent,
    swipes: newSwipes
  }
}

// ==================== 会话管理 ====================

/**
 * 创建新的聊天会话
 */
export function createChatSession(
  characterId: string,
  presetId: string,
  greeting?: string
): ChatSession {
  const session: ChatSession = {
    id: generateSessionId(),
    characterId,
    presetId,
    messages: [],
    greetingIndex: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  // 如果有开场白，添加为第一条消息
  if (greeting) {
    session.messages = [createAssistantMessage(greeting)]
  }
  
  return session
}

/**
 * 保存会话到localStorage
 */
export function saveSession(session: ChatSession): void {
  const sessions = loadAllSessions()
  const index = sessions.findIndex(s => s.id === session.id)
  
  const updatedSession = {
    ...session,
    updatedAt: new Date().toISOString()
  }
  
  if (index >= 0) {
    sessions[index] = updatedSession
  } else {
    sessions.push(updatedSession)
  }
  
  localStorage.setItem('offline_chat_sessions', JSON.stringify(sessions))
}

/**
 * 加载所有会话
 */
export function loadAllSessions(): ChatSession[] {
  const data = localStorage.getItem('offline_chat_sessions')
  return data ? JSON.parse(data) : []
}

/**
 * 加载指定会话
 */
export function loadSession(sessionId: string): ChatSession | null {
  const sessions = loadAllSessions()
  return sessions.find(s => s.id === sessionId) || null
}

/**
 * 删除会话
 */
export function deleteSession(sessionId: string): void {
  const sessions = loadAllSessions()
  const filtered = sessions.filter(s => s.id !== sessionId)
  localStorage.setItem('offline_chat_sessions', JSON.stringify(filtered))
}

/**
 * 获取角色的所有会话
 */
export function getCharacterSessions(characterId: string): ChatSession[] {
  const sessions = loadAllSessions()
  return sessions.filter(s => s.characterId === characterId)
}
