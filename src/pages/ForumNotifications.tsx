/**
 * ForumNotifications.tsx - 论坛消息通知页
 * 
 * 显示点赞、评论、关注等通知
 * 
 * @module pages/ForumNotifications
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, AddIcon } from '../components/Icons'

interface Notification {
  id: string
  type: 'like' | 'comment' | 'follow' | 'system'
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  content: string
  postId?: string
  timestamp: number
  isRead: boolean
}

const ForumNotifications = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'like' | 'comment'>('all')

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = () => {
    // 模拟通知数据
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'like',
        fromUserId: 'u1',
        fromUserName: '用户A',
        fromUserAvatar: '',
        content: '赞了你的微博',
        postId: 'p1',
        timestamp: Date.now() - 3600000,
        isRead: false,
      },
      {
        id: '2',
        type: 'comment',
        fromUserId: 'u2',
        fromUserName: '用户B',
        fromUserAvatar: '',
        content: '评论了你的微博：很赞！',
        postId: 'p2',
        timestamp: Date.now() - 7200000,
        isRead: false,
      },
      {
        id: '3',
        type: 'follow',
        fromUserId: 'u3',
        fromUserName: '用户C',
        fromUserAvatar: '',
        content: '关注了你',
        timestamp: Date.now() - 10800000,
        isRead: true,
      },
    ]
    
    setNotifications(mockNotifications)
  }

  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}-${date.getDate()}`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        )
      case 'comment':
        return (
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
        )
      case 'follow':
        return (
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部玻璃白色区域 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/forum')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>

          <h1 className="text-[17px] font-semibold text-gray-900">消息</h1>

          <div className="w-9" />
        </div>

        {/* Tab切换 */}
        <div className="flex items-center px-4 pb-2.5">
          {[
            { key: 'all' as const, label: '全部' },
            { key: 'like' as const, label: '赞' },
            { key: 'comment' as const, label: '评论' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-[14px] rounded-full transition-all mr-3 ${
                activeTab === tab.key
                  ? 'bg-[#ff6c00] text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 通知列表 */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-30">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p className="text-[14px]">暂无消息</p>
          </div>
        ) : (
          <div>
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 border-b border-gray-50 active:bg-gray-50 ${
                  !notification.isRead ? 'bg-orange-50/30' : ''
                }`}
                onClick={() => notification.postId && navigate(`/forum/post/${notification.postId}`)}
              >
                {/* 图标 */}
                {getNotificationIcon(notification.type)}

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[14px] text-gray-900">
                      {notification.fromUserName}
                    </span>
                    <span className="text-[12px] text-gray-400">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <div className="text-[13px] text-gray-600">
                    {notification.content}
                  </div>
                </div>

                {/* 未读标记 */}
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-[#ff6c00] rounded-full mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      {renderBottomNav()}
    </div>
  )

  function renderBottomNav() {
    return (
      <div className="bg-white border-t border-gray-100 flex items-center justify-around py-2">
        <button 
          onClick={() => navigate('/forum')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[11px] text-gray-600">首页</span>
        </button>
        
        <button 
          onClick={() => navigate('/forum/topics')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round"/>
          </svg>
          <span className="text-[11px] text-gray-600">超话</span>
        </button>
        
        <button 
          onClick={() => navigate('/forum/publish')}
          className="flex flex-col items-center -mt-3 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] rounded-full flex items-center justify-center shadow-lg">
            <AddIcon size={24} className="text-white" />
          </div>
        </button>
        
        <button className="flex flex-col items-center gap-1 py-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff6c00]">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <span className="text-[11px] text-[#ff6c00] font-medium">消息</span>
        </button>
        
        <button 
          onClick={() => navigate('/forum/profile')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] text-gray-600">我</span>
        </button>
      </div>
    )
  }
}

export default ForumNotifications

