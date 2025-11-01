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
  characterId: string
}

const BackgroundChatNotificationManager = () => {
  const navigate = useNavigate()
  const [notification, setNotification] = useState<BackgroundChatNotification | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // 监听后台聊天消息事件
    const handleBackgroundChat = (event: CustomEvent) => {
      const { title, message, characterId } = event.detail
      setNotification({ title, message, characterId })
      setShowNotification(true)
    }

    window.addEventListener('background-chat-message', handleBackgroundChat as EventListener)

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
    
    // 跳转到对应的聊天页面
    navigate(`/chat/${notification.characterId}`)
  }

  // 如果没有通知，不渲染任何内容
  if (!notification) {
    return null
  }

  return (
    <IOSNotification
      show={showNotification}
      title={notification.title}
      message={notification.message}
      icon="💬"
      onClose={handleClose}
      onClick={handleClick}
      duration={5000}
    />
  )
}

export default BackgroundChatNotificationManager
