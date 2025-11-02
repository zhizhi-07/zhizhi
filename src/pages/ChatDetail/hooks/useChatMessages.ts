/**
 * 消息管理 Hook
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Message } from '../types'
import { loadChatMessages, saveChatMessages, debouncedSaveChatMessages } from '../utils/storageHelpers'

export const useChatMessages = (chatId: string | undefined) => {
  // 消息列表
  const [messages, setMessages] = useState<Message[]>(() => {
    if (chatId) {
      return loadChatMessages(chatId)
    }
    return []
  })
  
  // 防抖保存定时器
  const saveTimeoutRef = useRef<number>()
  
  // 保存消息到 localStorage
  useEffect(() => {
    if (!chatId) return
    
    // 使用防抖保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      saveChatMessages(chatId, messages)
    }, 500)
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [messages, chatId])
  
  // 添加消息
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])
  
  // 添加多条消息
  const addMessages = useCallback((newMessages: Message[]) => {
    setMessages(prev => [...prev, ...newMessages])
  }, [])
  
  // 更新消息
  const updateMessage = useCallback((messageId: number, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ))
  }, [])
  
  // 删除消息
  const deleteMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])
  
  // 批量删除消息
  const deleteMessages = useCallback((messageIds: number[]) => {
    const idsSet = new Set(messageIds)
    setMessages(prev => prev.filter(msg => !idsSet.has(msg.id)))
  }, [])
  
  // 清空所有消息
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])
  
  // 撤回消息
  const recallMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          isRecalled: true,
          recalledContent: msg.content,
          originalType: msg.type,
          type: 'system' as const,
          content: msg.type === 'sent' ? '你撤回了一条消息' : 'AI撤回了一条消息'
        }
      }
      return msg
    }))
  }, [])
  
  // 获取指定消息
  const getMessage = useCallback((messageId: number): Message | undefined => {
    return messages.find(msg => msg.id === messageId)
  }, [messages])
  
  // 获取最后一条消息
  const getLastMessage = useCallback((): Message | undefined => {
    return messages[messages.length - 1]
  }, [messages])
  
  // 获取可见消息（过滤隐藏消息）
  const getVisibleMessages = useCallback((): Message[] => {
    return messages.filter(msg => !msg.isHidden)
  }, [messages])
  
  return {
    messages,
    setMessages,
    addMessage,
    addMessages,
    updateMessage,
    deleteMessage,
    deleteMessages,
    clearMessages,
    recallMessage,
    getMessage,
    getLastMessage,
    getVisibleMessages
  }
}

