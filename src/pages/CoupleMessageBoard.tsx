import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getCoupleMessages, type CoupleMessage } from '../utils/coupleSpaceContentUtils'

const CoupleMessageBoard = () => {
  const navigate = useNavigate()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()
  const [messages, setMessages] = useState<CoupleMessage[]>([])

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = () => {
    const allMessages = getCoupleMessages()
    setMessages(allMessages)
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return '昨天'
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
    }
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
      <div className="relative z-10 h-full flex flex-col">
        {/* 顶部栏 */}
        <div className={`sticky top-0 z-50 ${background ? 'glass-dark' : 'glass-effect'}`}>
          {showStatusBar && <StatusBar />}
          <div className="flex items-center justify-between px-5 py-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-blue-500 ios-button"
            >
              返回
            </button>
            <h1 className="text-lg font-semibold text-gray-900">留言板</h1>
            <button className="text-blue-500 ios-button">
              写留言
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-6">
          {messages.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-md">
                <div className="glass-card rounded-3xl p-8 text-center space-y-6 shadow-xl border border-white/20">
                  <div className="w-24 h-24 mx-auto rounded-full glass-card flex items-center justify-center shadow-lg border border-white/30">
                    <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无留言</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      在聊天中让AI用 [留言:内容] 写留言
                      <br />
                      每一句话都是爱的表达
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 留言列表 */
            <div className="space-y-4 pb-6">
              {messages.map(message => (
                <div key={message.id} className="glass-card rounded-2xl p-5 border border-white/20 shadow-lg">
                  <div className="flex items-start space-x-3">
                    {/* 留言图标 */}
                    <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center flex-shrink-0 border border-white/30">
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    
                    {/* 内容 */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{message.characterName}</span>
                        <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                      </div>
                      
                      {/* 留言内容 */}
                      <p className="text-sm text-gray-700 leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CoupleMessageBoard
