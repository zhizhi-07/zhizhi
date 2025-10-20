import { useRef, useEffect, useState } from 'react'
import MessageItem from './MessageItem'
import { Message } from '../types/message'

interface VirtualMessageListProps {
  messages: Message[]
  character: any
  currentUser: any
  userAvatar: string
  characterAvatar: string
  isUserCustomAvatar: boolean
  isCharacterCustomAvatar: boolean
  userBubbleColor: string
  aiBubbleColor: string
  userBubbleCSS: string
  aiBubbleCSS: string
  enableNarration: boolean
  showVoiceTextMap: Record<number, boolean>
  playingVoiceId: number | null
  expandedCallId: number | null
  shouldShowTimeDivider: (current: Message, prev: Message | null) => boolean
  formatTimestamp: (timestamp: number) => string
  onOpenRedEnvelope: (id: string) => void
  onReceiveTransfer: (id: number) => void
  onRejectTransfer: (id: number) => void
  onPlayVoice: (id: number, duration: number) => void
  onToggleVoiceText: (id: number) => void
  onViewLocation: (message: Message) => void
  onLongPressStart: (message: Message, event: React.TouchEvent | React.MouseEvent) => void
  onLongPressEnd: () => void
  onToggleCallDetail: (id: number) => void
  onAcceptIntimatePay: (message: Message) => void
  onRejectIntimatePay: (message: Message) => void
  threshold?: number // 启用虚拟滚动的消息数量阈值
}

const VirtualMessageList = (props: VirtualMessageListProps) => {
  const { messages, threshold = 100 } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: messages.length })
  const [shouldUseVirtual, setShouldUseVirtual] = useState(false)

  // 判断是否需要使用虚拟滚动
  useEffect(() => {
    setShouldUseVirtual(messages.length > threshold)
  }, [messages.length, threshold])

  // 虚拟滚动逻辑
  useEffect(() => {
    if (!shouldUseVirtual || !containerRef.current) return

    const container = containerRef.current
    const itemHeight = 80 // 预估每条消息的平均高度
    const bufferSize = 10 // 缓冲区大小

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight

      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
      const end = Math.min(
        messages.length,
        Math.ceil((scrollTop + clientHeight) / itemHeight) + bufferSize
      )

      setVisibleRange({ start, end })
    }

    container.addEventListener('scroll', handleScroll)
    handleScroll() // 初始化

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [shouldUseVirtual, messages.length])

  // 如果消息数量少于阈值，使用普通渲染
  if (!shouldUseVirtual) {
    return (
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            prevMessage={index > 0 ? messages[index - 1] : null}
            {...props}
          />
        ))}
      </div>
    )
  }

  // 使用虚拟滚动
  const { start, end } = visibleRange
  const visibleMessages = messages.slice(start, end)
  const offsetY = start * 80 // 预估偏移量

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar">
      <div style={{ height: `${messages.length * 80}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleMessages.map((message, index) => (
            <MessageItem
              key={message.id}
              message={message}
              prevMessage={start + index > 0 ? messages[start + index - 1] : null}
              {...props}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default VirtualMessageList
