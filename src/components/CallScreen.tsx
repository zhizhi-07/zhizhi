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
  isAITyping?: boolean
}

const CallScreen = ({ show, character, isVideoCall, onEnd, onSendMessage, onRequestAIReply, messages: externalMessages, isAITyping }: CallScreenProps) => {
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
        <div className={`fixed inset-0 z-50 flex flex-col ${isVideoCall ? 'bg-black' : 'bg-white'}`}>
          {/* 视频通话：大视频区域 */}
          {isVideoCall && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              {/* 对方的视频（模拟） */}
              <div className="w-full h-full flex items-center justify-center">
                {character.avatar ? (
                  character.avatar.startsWith('data:image') || character.avatar.startsWith('http') ? (
                    <img src={character.avatar} alt={character.name} className="w-48 h-48 rounded-full object-cover" />
                  ) : (
                    <span className="text-9xl">{character.avatar}</span>
                  )
                ) : (
                  <div className="w-48 h-48 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white text-6xl">{character.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              
              {/* 小窗口：自己的视频 */}
              <div className="absolute top-4 right-4 w-24 h-32 bg-gray-900 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <span className="text-white text-2xl">我</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 顶部信息栏 */}
          <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-10 ${
            isVideoCall ? 'bg-gradient-to-b from-black/60 to-transparent' : 'bg-gray-50 border-b border-gray-200'
          }`}>
            {/* 最小化按钮 */}
            <button
              onClick={() => setIsMinimized(true)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ios-button ${
                isVideoCall ? 'bg-white/20 backdrop-blur-sm hover:bg-white/30' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 13H5v-2h14v2z" fill={isVideoCall ? 'white' : '#374151'}/>
              </svg>
            </button>

            {/* 角色信息 */}
            <div className="flex items-center gap-3">
              {/* 头像 */}
              <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                isVideoCall ? 'bg-white/20 backdrop-blur-sm' : 'bg-gray-200'
              }`}>
                {character.avatar ? (
                  character.avatar.startsWith('data:image') || character.avatar.startsWith('http') ? (
                    <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">{character.avatar}</span>
                  )
                ) : (
                  <span className={`text-sm ${isVideoCall ? 'text-white' : 'text-gray-700'}`}>{character.name.charAt(0)}</span>
                )}
              </div>
              
              {/* 名字和时长 */}
              <div className="flex flex-col">
                <span className={`font-medium ${
                  isVideoCall ? 'text-white drop-shadow-lg' : 'text-gray-900'
                }`}>{character.name}</span>
                <span className={`text-sm ${
                  isVideoCall ? 'text-white/80 drop-shadow' : 'text-gray-500'
                }`}>{formatDuration(duration)}</span>
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
              {!isVideoCall && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#10b981">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                </svg>
              )}
            </div>
          </div>

          {/* 对话区域 */}
          <div className={`absolute left-0 right-0 overflow-y-auto px-4 py-4 hide-scrollbar z-10 ${
            isVideoCall 
              ? 'bottom-48 max-h-[40%] bg-gradient-to-t from-black/60 to-transparent' 
              : 'bottom-44 top-20 bg-white'
          }`}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className={`text-sm ${isVideoCall ? 'text-white/60' : 'text-gray-400'}`}>开始对话...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => {
                  // 旁白消息（居中显示）
                  if (msg.type === 'narrator') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <p className={`text-xs italic px-4 py-1 text-center max-w-[80%] ${
                          isVideoCall ? 'text-white/70 drop-shadow' : 'text-gray-500'
                        }`}>
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
                        className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-lg ${
                          msg.type === 'user'
                            ? 'bg-green-500 text-white'
                            : isVideoCall 
                              ? 'bg-white/90 backdrop-blur-sm text-gray-900'
                              : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm break-words">{msg.content}</p>
                      </div>
                    </div>
                  )
                })}
                
                {/* AI正在输入动画 */}
                {isAITyping && (
                  <div className="flex justify-start">
                    <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                      isVideoCall ? 'bg-white/90 backdrop-blur-sm' : 'bg-gray-100'
                    }`}>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* 底部输入区域 */}
          <div className={`absolute bottom-0 left-0 right-0 px-4 pb-6 z-20 ${isVideoCall ? 'bg-gradient-to-t from-black/90 via-black/80 to-transparent pt-8' : 'bg-white pt-4'}`}>
            {/* 输入框 */}
            <div className={`rounded-full px-4 py-2 flex items-center gap-2 mb-4 ${
              isVideoCall ? 'bg-white/20 backdrop-blur-md border border-white/30' : 'bg-gray-100 border border-gray-200'
            }`}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="说点什么..."
                className={`flex-1 bg-transparent outline-none text-sm ${
                  isVideoCall ? 'text-white placeholder-white/60' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <button
                onClick={handleSendMessage}
                className={`w-8 h-8 rounded-full flex items-center justify-center ios-button transition-all ${
                  inputValue.trim() ? 'bg-green-500' : 'bg-blue-500'
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
                  isMuted ? 'bg-red-500 shadow-2xl' : isVideoCall ? 'bg-white/20 backdrop-blur-md' : 'bg-gray-200'
                }`}
              >
                <MicIcon size={28} className={isMuted ? 'text-white' : isVideoCall ? 'text-white' : 'text-gray-700'} />
              </button>

              {/* 挂断 */}
              <button
                onClick={onEnd}
                className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center ios-button shadow-2xl hover:bg-red-600"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12,9C10.4,9,8.85,9.25,7.4,9.72v2.09C7.4,12.46,6.86,13,6.21,13H3.78c-0.65,0-1.18-0.54-1.18-1.18v-1.09 C2.6,5.88,6.88,1.6,11.73,1.6h0.55c4.85,0,9.13,4.28,9.13,9.13v1.09c0,0.65-0.54,1.18-1.18,1.18h-2.43 c-0.65,0-1.18-0.54-1.18-1.18V9.72C15.15,9.25,13.6,9,12,9z"/>
                </svg>
              </button>

              {/* 免提 */}
              <button
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`w-16 h-16 rounded-full flex items-center justify-center ios-button transition-all ${
                  isSpeaker ? 'bg-green-500 shadow-2xl' : isVideoCall ? 'bg-white/20 backdrop-blur-md' : 'bg-gray-200'
                }`}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill={isSpeaker ? 'white' : isVideoCall ? 'white' : '#374151'}>
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
          className="fixed top-20 right-4 z-50 bg-white rounded-2xl shadow-2xl p-3 flex items-center gap-3 cursor-pointer ios-button border border-gray-200"
        >
          {/* 头像 */}
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {character.avatar ? (
              character.avatar.startsWith('data:image') || character.avatar.startsWith('http') ? (
                <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{character.avatar}</span>
              )
            ) : (
              <span className="text-gray-700 text-sm">{character.name.charAt(0)}</span>
            )}
          </div>

          {/* 信息 */}
          <div className="flex flex-col">
            <span className="text-gray-900 text-sm font-medium">{character.name}</span>
            <span className="text-gray-500 text-xs">{formatDuration(duration)}</span>
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
