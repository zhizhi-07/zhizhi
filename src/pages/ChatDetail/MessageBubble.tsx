/**
 * 消息气泡组件 - 处理各种消息类型的渲染
 * 这是一个简化版本，完整功能需要继续完善
 */

import { Message } from './types'

interface MessageBubbleProps {
  message: Message
  characterName?: string
  userBubbleColor?: string
  aiBubbleColor?: string
  onReceiveTransfer?: (messageId: number) => void
  onRejectTransfer?: (messageId: number) => void
}

const MessageBubble = ({
  message,
  characterName,
  userBubbleColor = '#95EC69',
  aiBubbleColor = '#ffffff',
  onReceiveTransfer,
  onRejectTransfer
}: MessageBubbleProps) => {
  
  // 文字消息
  if (!message.messageType || message.messageType === 'text') {
    return (
      <div style={{ maxWidth: '280px', display: 'inline-block', wordBreak: 'break-word' }}>
        {message.content && (
          <div
            className="message-bubble px-3 py-2"
            style={{
              backgroundColor: message.type === 'sent' ? userBubbleColor : (message.content.startsWith('[错误]') ? '#fee2e2' : aiBubbleColor),
              borderRadius: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              color: message.content.startsWith('[错误]') ? '#991b1b' : '#111827',
              fontSize: '14px'
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* 引用的消息 */}
              {message.quotedMessage && (
                <div 
                  className="mb-2 px-2.5 py-1.5 rounded"
                  style={{
                    background: 'rgba(0, 0, 0, 0.05)',
                    fontSize: '12px',
                    color: '#666'
                  }}
                >
                  <div className="font-semibold mb-0.5" style={{ color: '#1677ff' }}>
                    {message.quotedMessage.senderName}
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {message.quotedMessage.content}
                  </div>
                </div>
              )}
              
              {/* 消息内容 */}
              <span style={{ position: 'relative', zIndex: 2 }}>{message.content}</span>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // 表情包消息
  if (message.messageType === 'emoji' && message.emojiUrl) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg max-w-[200px]">
        <img 
          src={message.emojiUrl} 
          alt={message.emojiDescription || '表情包'} 
          className="w-full h-auto"
        />
      </div>
    )
  }
  
  // 转账消息
  if (message.messageType === 'transfer' && message.transfer) {
    return (
      <div className="message-bubble glass-card rounded-2xl p-4 shadow-lg min-w-[200px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
            ¥
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-900 font-medium">转账</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {message.transfer.message && message.transfer.message.trim() 
                ? message.transfer.message
                : message.transfer.status === 'pending'
                  ? (message.type === 'sent' ? '你发起了一笔转账' : '对方发起了一笔转账')
                  : message.transfer.status === 'received'
                    ? '已接收'
                    : '已退还'}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-3">
          {message.type === 'received' && message.transfer.status === 'pending' ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-semibold text-gray-900">
                  ¥{message.transfer.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onRejectTransfer?.(message.id)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full ios-button"
                >
                  退还
                </button>
                <button 
                  onClick={() => onReceiveTransfer?.(message.id)}
                  className="flex-1 px-4 py-2 bg-primary text-white text-sm rounded-full ios-button"
                >
                  领取
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-gray-900">
                ¥{message.transfer.amount.toFixed(2)}
              </span>
              {message.transfer.status === 'received' && (
                <span className="text-xs text-gray-400">
                  {message.type === 'sent' ? '已收款' : '你已收款'}
                </span>
              )}
              {message.transfer.status === 'expired' && (
                <span className="text-xs text-gray-400">
                  {message.type === 'sent' ? '已退还' : '你已退还'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // 红包消息 - 简化版本，需要导入RedEnvelopeCard
  if (message.messageType === 'redenvelope' && message.redEnvelopeId) {
    return (
      <div className="glass-card rounded-2xl p-4 shadow-lg min-w-[200px]">
        <div className="text-sm text-gray-900 font-medium mb-2">红包消息</div>
        <div className="text-xs text-gray-500">点击查看详情</div>
      </div>
    )
  }
  
  // 位置消息
  if (message.messageType === 'location' && message.location) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-lg max-w-[280px] bg-white">
        <div className="h-32 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div className="p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">
                {message.location.name}
              </div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                {message.location.address}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // 系统消息
  if (message.type === 'system') {
    return (
      <div className="text-center">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }
  
  // 默认返回空
  return null
}

export default MessageBubble
