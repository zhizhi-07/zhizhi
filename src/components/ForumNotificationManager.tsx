/**
 * 论坛通知管理器
 * 
 * 使用IOSNotification组件显示论坛通知
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import IOSNotification from './IOSNotification'
import { registerNotificationCallback, ForumNotificationData } from '../utils/forumNotifications'

const ForumNotificationManager = () => {
  const navigate = useNavigate()
  const [notification, setNotification] = useState<ForumNotificationData | null>(null)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // 注册通知回调
    registerNotificationCallback((notif) => {
      setNotification(notif)
      setShowNotification(true)
    })
  }, [])

  const handleClose = () => {
    setShowNotification(false)
    setTimeout(() => {
      setNotification(null)
    }, 300)
  }

  const handleClick = () => {
    if (!notification) return

    // 根据通知类型跳转
    switch (notification.type) {
      case 'comment':
      case 'like':
        if (notification.targetId) {
          navigate(`/forum/post/${notification.targetId}`)
        }
        break
      case 'dm':
        navigate('/forum/notifications?tab=messages')
        break
      case 'follow':
        navigate('/forum/notifications?tab=follows')
        break
      case 'init':
      case 'system':
        navigate('/forum')
        break
    }
  }

  if (!notification) return null

  return (
    <IOSNotification
      show={showNotification}
      title={notification.title}
      subtitle={notification.subtitle}
      message={notification.message}
      icon="💬" // 论坛图标
      onClose={handleClose}
      onClick={handleClick}
      duration={5000}
    />
  )
}

export default ForumNotificationManager
