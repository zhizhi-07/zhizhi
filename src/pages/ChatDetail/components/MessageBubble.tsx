/**
 * 消息气泡组件
 */

import { Message } from '../types'
import { Character, User } from '../../../context/ContactsContext'

interface MessageBubbleProps {
  message: Message
  character?: Character
  currentUser?: User
  userBubbleColor: string
  aiBubbleColor: string
  onLongPressStart?: (message: Message, event: React.TouchEvent | React.MouseEvent) => void
  onLongPressEnd?: () => void
  onLongPressCancel?: () => void
  onClick?: (message: Message) => void
  isSelected?: boolean
}

const MessageBubble = ({
  message,
  character,
  currentUser,
  userBubbleColor,
  aiBubbleColor,
  onLongPressStart,
  onLongPressEnd,
  onLongPressCancel,
  onClick,
  isSelected = false
}: MessageBubbleProps) => {
  const isSent = message.type === 'sent'
  const isSystem = message.type === 'system'
  
  // 系统消息样式
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full max-w-[80%] text-center">
          {message.content}
        </div>
      </div>
    )
  }

  // 撤回消息样式
  if (message.isRecalled) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    )
  }

  const bubbleColor = isSent ? userBubbleColor : aiBubbleColor
  const textColor = isSent ? '#000' : '#000'

  return (
    <div
      className={`flex items-start gap-2 my-2 px-4 ${isSent ? 'flex-row-reverse' : 'flex-row'} ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={() => onClick?.(message)}
      onTouchStart={(e) => onLongPressStart?.(message, e)}
      onTouchEnd={onLongPressEnd}
      onTouchCancel={onLongPressCancel}
      onMouseDown={(e) => onLongPressStart?.(message, e)}
      onMouseUp={onLongPressEnd}
      onMouseLeave={onLongPressCancel}
    >
      {/* 头像 */}
      <div className="flex-shrink-0">
        {isSent ? (
          <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden">
            {currentUser?.avatar && currentUser.avatar.startsWith('data:image') ? (
              <img src={currentUser.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">👤</span>
            )}
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center overflow-hidden">
            {character?.avatar && character.avatar.startsWith('data:image') ? (
              <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">🤖</span>
            )}
          </div>
        )}
      </div>

      {/* 消息内容 */}
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* 引用消息 */}
        {message.quotedMessage && (
          <div className="mb-1 px-3 py-2 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-full">
            <div className="font-medium">{message.quotedMessage.senderName}</div>
            <div className="truncate">{message.quotedMessage.content}</div>
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={`px-3 py-2 rounded-lg break-words ${
            isSent ? 'rounded-tr-none' : 'rounded-tl-none'
          }`}
          style={{
            backgroundColor: bubbleColor,
            color: textColor
          }}
        >
          {/* 被拉黑警告 */}
          {message.blocked && (
            <div className="text-xs text-red-500 mb-1 flex items-center gap-1">
              <span>⚠️</span>
              <span>对方已将你拉黑</span>
            </div>
          )}

          {/* 消息内容 */}
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* 旁白 */}
          {message.narrations && message.narrations.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.narrations.map((narration, index) => (
                <div
                  key={index}
                  className={`text-xs italic ${
                    narration.type === 'action' ? 'text-gray-600' : 'text-gray-500'
                  }`}
                >
                  {narration.type === 'action' ? '🎬 ' : '💭 '}
                  {narration.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 时间戳 */}
        <div className="text-xs text-gray-400 mt-1 px-1">
          {message.time}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble

