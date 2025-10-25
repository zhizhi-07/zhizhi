/**
 * 消息管理 Hook
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Message } from './types'

const DATA_VERSION = 2 // 当前数据版本

export const useMessages = (chatId: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!chatId) return []
    
    const savedMessages = localStorage.getItem(`chat_messages_${chatId}`)
    const loadedMessages = savedMessages ? JSON.parse(savedMessages) : []
    
    const currentVersion = parseInt(localStorage.getItem(`chat_data_version_${chatId}`) || '0')
    
    // 为旧消息添加时间戳和修复数据
    let needsSave = currentVersion < DATA_VERSION
    const processedMessages = loadedMessages.map((msg: Message) => {
      let updated = { ...msg }
      
      // 添加时间戳
      if (!msg.timestamp) {
        needsSave = true
        const [hours, minutes] = msg.time.split(':').map(Number)
        const today = new Date()
        today.setHours(hours || 0, minutes || 0, 0, 0)
        
        if (today.getTime() > Date.now()) {
          today.setDate(today.getDate() - 1)
        }
        
        updated.timestamp = today.getTime()
      }
      
      // 修复旧的转账消息
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
    
    // 保存更新后的数据
    if (needsSave) {
      setTimeout(() => {
        localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(processedMessages))
        localStorage.setItem(`chat_data_version_${chatId}`, String(DATA_VERSION))
        console.log(`✅ 数据已迁移到版本 ${DATA_VERSION}`)
      }, 0)
    }
    
    return processedMessages
  })
  
  const saveTimeoutRef = useRef<number>()
  
  // 防抖保存消息
  const saveMessages = useCallback((msgs: Message[]) => {
    if (!chatId) return
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(msgs))
      } catch (error) {
        console.error('保存消息失败:', error)
      }
    }, 500)
  }, [chatId])
  
  // 当消息改变时保存
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages)
    }
  }, [messages, saveMessages])
  
  // 添加新消息
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now(),
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, newMessage])
    return newMessage
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
  
  // 撤回消息
  const recallMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          isRecalled: true,
          recalledContent: msg.content,
          originalType: msg.type
        }
      }
      return msg
    }))
  }, [])
  
  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([])
    if (chatId) {
      localStorage.removeItem(`chat_messages_${chatId}`)
    }
  }, [chatId])
  
  return {
    messages,
    setMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    recallMessage,
    clearMessages
  }
}
