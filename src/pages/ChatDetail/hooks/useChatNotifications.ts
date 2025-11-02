/**
 * 聊天通知和未读消息管理 Hook
 */

import { useEffect, useRef } from 'react'
import { Message } from '../types'
import { incrementUnread, clearUnread } from '../../../utils/unreadMessages'
import { updateChatListLastMessage } from '../../../utils/chatListSync'
import { Character } from '../../../context/ContactsContext'

interface UseChatNotificationsProps {
  chatId: string | undefined
  character: Character | undefined
  messages: Message[]
}

export const useChatNotifications = ({ chatId, character, messages }: UseChatNotificationsProps) => {
  // 跟踪页面是否可见（用于后台AI回复）
  const isPageVisibleRef = useRef(true)
  
  // 记录AI回复的消息数（用于计算未读）
  const aiRepliedCountRef = useRef(0)
  
  // 追踪组件是否已挂载（用于切换聊天时继续AI回复）
  const isMountedRef = useRef(true)
  
  // 监听页面可见性（用户是否在当前聊天页面）
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
      console.log('👁️ 页面可见性变化:', isPageVisibleRef.current ? '可见' : '隐藏')
      
      // 如果页面从隐藏变为可见，清除未读消息
      if (isPageVisibleRef.current && chatId) {
        clearUnread(chatId)
      }
    }
    
    // 初始化为可见和已挂载
    isPageVisibleRef.current = !document.hidden
    isMountedRef.current = true
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 组件卸载时标记
      isMountedRef.current = false
    }
  }, [chatId])
  
  // 实时监听AI消息，立即触发通知和未读消息（和群聊逻辑一致）
  useEffect(() => {
    if (!chatId || !character || messages.length === 0) return
    
    const lastMessage = messages[messages.length - 1]
    
    // 只处理AI发送的消息
    if (lastMessage && lastMessage.type === 'received') {
      // 判断用户是否在当前聊天页面
      const isInCurrentChat = !document.hidden && window.location.pathname === `/chat/${chatId}`
      
      // 如果不在当前页面，立即增加未读并发送通知
      if (!isInCurrentChat) {
        incrementUnread(chatId, 1, 'single')
        
        // 发送通知事件
        window.dispatchEvent(new CustomEvent('background-chat-message', {
          detail: {
            title: character.name,
            message: lastMessage.content || '[消息]',
            chatId: chatId,
            type: 'single',
            avatar: character.avatar
          }
        }))
        
        // 更新聊天列表
        updateChatListLastMessage(chatId, lastMessage.content, lastMessage.timestamp)
      }
    }
  }, [messages, chatId, character])
  
  // 进入聊天时清除未读消息
  useEffect(() => {
    if (chatId) {
      clearUnread(chatId)
      console.log('✅ 已清除未读消息:', chatId)
    }
  }, [chatId])
  
  return {
    isPageVisibleRef,
    aiRepliedCountRef,
    isMountedRef
  }
}

