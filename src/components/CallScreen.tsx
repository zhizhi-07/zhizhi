import { useState, useEffect, useRef } from 'react'
import { MicIcon, SendIcon } from './Icons'

interface CallScreenProps {
  show: boolean
  character: {
    id: string
    name: string
    avatar?: string
    profile?: string
    relationship?: string
    favorability?: number
  }
  isVideoCall: boolean
  onEnd: () => void
  onSendMessage?: (message: string) => void
  onRequestAIReply?: () => void
  messages?: Array<{id: number, type: 'user' | 'ai' | 'narrator', content: string, time: string}>
}

const CallScreen = ({ show, character, isVideoCall, onEnd, onSendMessage, onRequestAIReply, messages: externalMessages }: CallScreenProps) => {
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 使用外部传入的messages或内部状态
  const messages = externalMessages || []

  useEffect(() => {
    if (!show) {
      setDuration(0)
      setIsMinimized(false)
      return
    }

    const timer = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [show])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) {
      // 输入框为空，触发 AI 回复
      if (onRequestAIReply) {
        onRequestAIReply()
      }
      return
    }

    // 输入框有内容，发送消息
    if (onSendMessage) {
      onSendMessage(inputValue)
    }
    
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!show) return null

  return (
    <>
      {/* 全屏通话界面 */}
      {!isMinimized && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
          {/* 顶部信息栏 */}
          <div className="flex items-center justify-between px-4 py-4 glass-dark">
            {/* 最小化按钮 */}
            <button
              onClick={() => setIsMinimized(true)}
              className="w-10 h-10 rounded-full glass-dark flex items-center justify-center ios-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 13H5v-2h14v2z" fill="white"/>
              </svg>
            </button>

            {/* 角色信息 */}
            <div className="flex items-center gap-3">
              {/* 头像 */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                {character.avatar ? (
                  character.avatar.startsWith('data:image') || character.avatar.startsWith('http') ? (
                    <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{character.avatar}</span>
                  )
                ) : (
                  <span className="text-white text-sm">{character.name.charAt(0)}</span>
                )}
              </div>
              
              {/* 名字和时长 */}
              <div className="flex flex-col">
                <span className="text-white font-medium">{character.name}</span>
                <span className="text-white/60 text-sm">{formatDuration(duration)}</span>
              </div>
            </div>

            {/* 视频通话图标 */}
            <div className="w-10 h-10 flex items-center justify-center">
              {isVideoCall && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <rect x="2" y="5" width="16" height="14" rx="2" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M18 10l4-2v8l-4-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </div>
          </div>

          {/* 对话区域 */}
          <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/40 text-sm">开始对话...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  // 旁白消息（居中显示）
                  if (msg.type === 'narrator') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <p className="text-white/60 text-xs italic px-4 py-1 text-center max-w-[80%]">
                          {msg.content}
                        </p>
                      </div>
                    )
                  }
                  
                  // 普通消息（左右对齐）
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                          msg.type === 'user'
                            ? 'bg-green-600 text-white'
                            : 'glass-dark text-white'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 底部输入区域 */}
          <div className="px-4 pb-4">
            {/* 输入框 */}
            <div className="glass-dark rounded-full px-4 py-2 flex items-center gap-2 mb-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="说点什么..."
                className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
              />
              <button
                onClick={handleSendMessage}
                className={`w-8 h-8 rounded-full flex items-center justify-center ios-button transition-all ${
                  inputValue.trim() ? 'bg-green-600' : 'bg-blue-600'
                }`}
                title={inputValue.trim() ? '发送消息' : 'AI回复'}
              >
                <SendIcon size={16} className="text-white" />
              </button>
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center items-center gap-8">
              {/* 静音 */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-16 h-16 rounded-full flex items-center justify-center ios-button transition-all ${
                  isMuted ? 'bg-white/30' : 'bg-white/10'
                }`}
              >
                <MicIcon size={28} className="text-white" />
              </button>

              {/* 挂断 */}
              <button
                onClick={onEnd}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center ios-button shadow-2xl"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12,9C10.4,9,8.85,9.25,7.4,9.72v2.09C7.4,12.46,6.86,13,6.21,13H3.78c-0.65,0-1.18-0.54-1.18-1.18v-1.09 C2.6,5.88,6.88,1.6,11.73,1.6h0.55c4.85,0,9.13,4.28,9.13,9.13v1.09c0,0.65-0.54,1.18-1.18,1.18h-2.43 c-0.65,0-1.18-0.54-1.18-1.18V9.72C15.15,9.25,13.6,9,12,9z"/>
                </svg>
              </button>

              {/* 免提 */}
              <button
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`w-16 h-16 rounded-full flex items-center justify-center ios-button transition-all ${
                  isSpeaker ? 'bg-white/30' : 'bg-white/10'
                }`}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 最小化悬浮窗 */}
      {isMinimized && (
        <div 
          onClick={() => setIsMinimized(false)}
          className="fixed top-20 right-4 z-50 glass-dark rounded-2xl shadow-2xl p-3 flex items-center gap-3 cursor-pointer ios-button"
        >
          {/* 头像 */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
            {character.avatar ? (
              character.avatar.startsWith('data:image') || character.avatar.startsWith('http') ? (
                <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{character.avatar}</span>
              )
            ) : (
              <span className="text-white text-sm">{character.name.charAt(0)}</span>
            )}
          </div>

          {/* 信息 */}
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">{character.name}</span>
            <span className="text-white/60 text-xs">{formatDuration(duration)}</span>
          </div>

          {/* 挂断按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEnd()
            }}
            className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center ml-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12,9C10.4,9,8.85,9.25,7.4,9.72v2.09C7.4,12.46,6.86,13,6.21,13H3.78c-0.65,0-1.18-0.54-1.18-1.18v-1.09 C2.6,5.88,6.88,1.6,11.73,1.6h0.55c4.85,0,9.13,4.28,9.13,9.13v1.09c0,0.65-0.54,1.18-1.18,1.18h-2.43 c-0.65,0-1.18-0.54-1.18-1.18V9.72C15.15,9.25,13.6,9,12,9z"/>
            </svg>
          </button>
        </div>
      )}
    </>
  )
}

export default CallScreen
