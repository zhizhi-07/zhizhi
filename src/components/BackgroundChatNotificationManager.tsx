/**
 * 后台聊天通知管理器
 * 
 * 使用IOSNotification组件显示后台聊天通知
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import IOSNotification from './IOSNotification'

interface BackgroundChatNotification {
  title: string
  message: string
  chatId: string  // 单聊用characterId，群聊用groupId
  type: 'single' | 'group'  // 聊天类型
  avatar?: string  // 头像图片
}

const BackgroundChatNotificationManager = () => {
  const navigate = useNavigate()
  const [notification, setNotification] = useState<BackgroundChatNotification | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // 监听后台聊天消息事件
    const handleBackgroundChat = (event: CustomEvent) => {
      console.log('🔔 [BackgroundChatNotificationManager] 收到通知事件:', event.detail)
      const { title, message, chatId, characterId, type = 'single', avatar } = event.detail
      // 兼容旧版本，如果没有chatId但有characterId，则使用characterId
      const finalChatId = chatId || characterId
      const finalType = type || 'single'
      console.log('🔔 [BackgroundChatNotificationManager] 设置通知:', { title, message, finalChatId, finalType })
      setNotification({ title, message, chatId: finalChatId, type: finalType, avatar })
      setShowNotification(true)
    }

    window.addEventListener('background-chat-message', handleBackgroundChat as EventListener)
    console.log('🔔 [BackgroundChatNotificationManager] 已监听 background-chat-message 事件')

    return () => {
      window.removeEventListener('background-chat-message', handleBackgroundChat as EventListener)
    }
  }, [])

  const handleClose = () => {
    setShowNotification(false)
    setTimeout(() => {
      setNotification(null)
    }, 300)
  }

  const handleClick = () => {
    if (!notification) return

    // 根据类型跳转到对应的聊天页面
    if (notification.type === 'group') {
      navigate(`/group/${notification.chatId}`)
      // 触发重新加载消息事件（解决从通知跳转后消息不显示的问题）
      setTimeout(() => {
        window.dispatchEvent(new Event('reload-group-messages'))
      }, 100)
    } else {
      navigate(`/chat/${notification.chatId}`)
      // 触发重新加载消息事件
      setTimeout(() => {
        window.dispatchEvent(new Event('reload-chat-messages'))
      }, 100)
    }
  }

  // 如果没有通知，不渲染任何内容
  if (!notification) {
    return null
  }

  // 统一显示格式：标题是"微信"，副标题是角色名或群名
  const displayTitle = '微信'
  const subtitle = notification.title
  
  return (
    <IOSNotification
      show={showNotification}
      title={displayTitle}
      subtitle={subtitle}
      message={notification.message}
      icon={notification.avatar || "💬"}
      onClose={handleClose}
      onClick={handleClick}
      duration={6000}
    />
  )
}

export default BackgroundChatNotificationManager
