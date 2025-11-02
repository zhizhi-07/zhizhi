import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/ContactsContext'
import { getMomentNotifications, markAllNotificationsAsRead, type MomentNotification } from '../utils/momentsNotification'

const MomentNotifications = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const [notifications, setNotifications] = useState<MomentNotification[]>([])

  useEffect(() => {
    // 加载通知，只显示来自AI角色的通知（过滤掉用户自己的操作）
    const allNotifications = getMomentNotifications()
    const aiCharacterIds = characters.map(c => c.id)
    
    // 只保留来自AI角色的通知
    const filteredNotifications = allNotifications.filter(notification => 
      aiCharacterIds.includes(notification.fromUserId)
    )
    
    setNotifications(filteredNotifications)
    
    // 标记所有通知为已读
    markAllNotificationsAsRead()
  }, [characters])

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 1000 / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getNotificationText = (notification: MomentNotification) => {
    switch (notification.type) {
      case 'like':
        return '赞了你的朋友圈'
      case 'comment':
        return '评论了你的朋友圈'
      case 'reply':
        return notification.replyToUser ? `回复了你的评论` : '回复了评论'
      case 'new_moment':
        return '发布了新的朋友圈'
      default:
        return '与你互动'
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="glass-morphism">
        <div className="px-4 py-3 flex items-center">
          <button 
            onClick={() => navigate('/moments', { replace: true })}
            className="w-10 h-10 rounded-full glass-effect flex items-center justify-center ios-button"
          >
            <BackIcon size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 ml-4">朋友圈消息</h1>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p className="text-base">暂无消息</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  // 点击跳转到朋友圈
                  navigate('/wechat/moments')
                }}
                className="px-4 py-4 flex gap-3 active:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* 头像 */}
                <div className="flex-shrink-0">
                  {notification.fromUserAvatar.startsWith('data:image') ? (
                    <img 
                      src={notification.fromUserAvatar} 
                      alt={notification.fromUserName}
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl">
                      {notification.fromUserAvatar}
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-medium text-gray-900">{notification.fromUserName}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatTime(notification.timestamp)}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {getNotificationText(notification)}
                  </p>
                  
                  {notification.comment && (
                    <div className="bg-gray-100 rounded-lg px-3 py-2 mb-2">
                      <p className="text-sm text-gray-700">{notification.comment}</p>
                    </div>
                  )}
                  
                  {/* 原朋友圈内容 */}
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-sm text-gray-500 line-clamp-2">{notification.momentContent}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MomentNotifications
