/**
 * 消息列表组件
 */

import { useMemo } from 'react'
import MessageBubble from './MessageBubble'
import { Message } from '../types'
import { Character, User } from '../../../context/ContactsContext'
import { shouldShowTimeDivider, formatTimestamp } from '../utils/timeHelpers'

interface MessageListProps {
  messages: Message[]
  displayCount: number
  character?: Character
  currentUser?: User
  userBubbleColor: string
  aiBubbleColor: string
  isLoadingMore: boolean
  onLongPressStart?: (message: Message, event: React.TouchEvent | React.MouseEvent) => void
  onLongPressEnd?: () => void
  onLongPressCancel?: () => void
  onMessageClick?: (message: Message) => void
  selectedMessageIds?: Set<number>
  containerRef?: React.RefObject<HTMLDivElement>
}

const MessageList = ({
  messages,
  displayCount,
  character,
  currentUser,
  userBubbleColor,
  aiBubbleColor,
  isLoadingMore,
  onLongPressStart,
  onLongPressEnd,
  onLongPressCancel,
  onMessageClick,
  selectedMessageIds = new Set(),
  containerRef
}: MessageListProps) => {
  // 过滤并限制显示的消息
  const visibleMessages = useMemo(() => {
    return messages
      .filter(msg => !msg.isHidden)
      .slice(-displayCount)
  }, [messages, displayCount])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-0 py-4"
      style={{
        scrollBehavior: 'smooth'
      }}
    >
      {/* 加载更多提示 */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="text-xs text-gray-400">加载中...</div>
        </div>
      )}

      {/* 消息列表 */}
      {visibleMessages.map((message, index) => {
        const prevMessage = index > 0 ? visibleMessages[index - 1] : null
        const showTimeDivider = shouldShowTimeDivider(message, prevMessage)

        return (
          <div key={message.id}>
            {/* 时间分隔线 */}
            {showTimeDivider && message.timestamp && (
              <div className="flex justify-center my-3">
                <div className="bg-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            )}

            {/* 消息气泡 */}
            <MessageBubble
              message={message}
              character={character}
              currentUser={currentUser}
              userBubbleColor={userBubbleColor}
              aiBubbleColor={aiBubbleColor}
              onLongPressStart={onLongPressStart}
              onLongPressEnd={onLongPressEnd}
              onLongPressCancel={onLongPressCancel}
              onClick={onMessageClick}
              isSelected={selectedMessageIds.has(message.id)}
            />
          </div>
        )
      })}

      {/* 底部占位，确保最后一条消息不被输入框遮挡 */}
      <div className="h-4" />
    </div>
  )
}

export default MessageList

