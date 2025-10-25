/**
 * 消息列表组件
 */

import { useRef, useEffect } from 'react'
import { Message } from './types'
import MessageBubble from './MessageBubble'

interface MessageListProps {
  messages: Message[]
  characterName?: string
  characterAvatar?: string
  userAvatar?: string
  isCharacterCustomAvatar?: boolean
  isUserCustomAvatar?: boolean
  isAiTyping?: boolean
  userBubbleColor?: string
  aiBubbleColor?: string
  onReceiveTransfer?: (messageId: number) => void
  onRejectTransfer?: (messageId: number) => void
}

const MessageList = ({
  messages,
  characterName,
  characterAvatar,
  userAvatar,
  isCharacterCustomAvatar,
  isUserCustomAvatar,
  isAiTyping,
  userBubbleColor,
  aiBubbleColor,
  onReceiveTransfer,
  onRejectTransfer
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, isAiTyping])
  
  return (
    <>
      {messages.map((message) => (
        <div key={message.id} className="mb-3 px-3">
          {/* 系统消息居中显示 */}
          {message.type === 'system' ? (
            <div className="flex justify-center">
              <MessageBubble
                message={message}
                characterName={characterName}
                userBubbleColor={userBubbleColor}
                aiBubbleColor={aiBubbleColor}
                onReceiveTransfer={onReceiveTransfer}
                onRejectTransfer={onRejectTransfer}
              />
            </div>
          ) : (
            /* 普通消息 */
            <div className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
              {/* AI消息：头像在左，气泡在右 */}
              {message.type === 'received' && !message.isHidden && (
                <div className="flex flex-col items-center mr-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                    {isCharacterCustomAvatar ? (
                      <img src={characterAvatar} alt="角色头像" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">{characterAvatar || '🤖'}</span>
                    )}
                  </div>
                  {message.timestamp && (
                    <span className="text-[9px] text-gray-400 mt-0.5">{message.time}</span>
                  )}
                </div>
              )}
              
              {/* 消息气泡 */}
              <div className="flex items-center gap-2">
                <MessageBubble
                  message={message}
                  characterName={characterName}
                  userBubbleColor={userBubbleColor}
                  aiBubbleColor={aiBubbleColor}
                  onReceiveTransfer={onReceiveTransfer}
                  onRejectTransfer={onRejectTransfer}
                />
                
                {/* 拉黑警告图标 */}
                {message.type === 'received' && message.blocked && (
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                )}
              </div>
              
              {/* 用户消息：气泡在左，头像在右 */}
              {message.type === 'sent' && (
                <div className="flex flex-col items-center ml-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                    {isUserCustomAvatar ? (
                      <img src={userAvatar} alt="我的头像" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  {message.timestamp && (
                    <span className="text-[9px] text-gray-400 mt-0.5">{message.time}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* AI正在输入 */}
      {isAiTyping && (
        <div className="flex mb-3 px-3 justify-start">
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mr-2 shadow-md overflow-hidden">
            {isCharacterCustomAvatar ? (
              <img src={characterAvatar} alt="角色头像" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">{characterAvatar || '🤖'}</span>
            )}
          </div>
          <div className="glass-card px-3 py-2 rounded-xl rounded-tl-sm shadow-md">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      
      {/* 用于滚动到底部的锚点 */}
      <div ref={messagesEndRef} />
    </>
  )
}

export default MessageList
