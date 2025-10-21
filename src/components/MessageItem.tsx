import { Message } from '../types/message'
import RedEnvelopeCard from './RedEnvelopeCard'
import FlipPhotoCard from './FlipPhotoCard'

interface MessageItemProps {
  message: Message
  prevMessage: Message | null
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
}

const MessageItem = ({
  message,
  prevMessage,
  character,
  currentUser,
  userAvatar,
  characterAvatar,
  isUserCustomAvatar,
  isCharacterCustomAvatar,
  userBubbleColor,
  aiBubbleColor,
  userBubbleCSS,
  aiBubbleCSS,
  enableNarration,
  showVoiceTextMap,
  playingVoiceId,
  expandedCallId,
  shouldShowTimeDivider,
  formatTimestamp,
  onOpenRedEnvelope,
  onReceiveTransfer,
  onRejectTransfer,
  onPlayVoice,
  onToggleVoiceText,
  onViewLocation,
  onLongPressStart,
  onLongPressEnd,
  onToggleCallDetail,
  onAcceptIntimatePay,
  onRejectIntimatePay
}: MessageItemProps) => {
  // 时间分隔线
  const renderTimeDivider = () => {
    if (!shouldShowTimeDivider(message, prevMessage)) return null
    return (
      <div className="flex justify-center my-4">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {formatTimestamp(message.timestamp!)}
        </span>
      </div>
    )
  }

  // 系统消息
  if (message.type === 'system') {
    return (
      <>
        {renderTimeDivider()}
        <div className="flex justify-center my-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full max-w-[80%] text-center">
            {message.content}
          </span>
        </div>
      </>
    )
  }

  // 通话记录
  if (message.isCallRecord) {
    const duration = message.callDuration || 0
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    const isExpanded = expandedCallId === message.id

    return (
      <>
        {renderTimeDivider()}
        <div className="flex justify-center my-3">
          <div className="bg-white rounded-lg shadow-sm px-4 py-3 max-w-[80%]">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => onToggleCallDetail(message.id)}
            >
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <div className="flex-1">
                <div className="text-sm font-medium">通话时长</div>
                <div className="text-xs text-gray-500">
                  {minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`}
                </div>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isExpanded && message.callMessages && message.callMessages.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 max-h-60 overflow-y-auto">
                {message.callMessages.map((msg) => (
                  <div key={msg.id} className={`text-sm ${
                    msg.type === 'narrator' ? 'text-gray-400 italic text-xs' :
                    msg.type === 'user' ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    <span className="font-medium">
                      {msg.type === 'narrator' ? '旁白' : 
                       msg.type === 'user' ? currentUser?.name || '我' : 
                       character?.name || 'AI'}:
                    </span> {msg.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  const isSent = message.type === 'sent'
  const avatar = isSent ? userAvatar : characterAvatar
  const isCustomAvatar = isSent ? isUserCustomAvatar : isCharacterCustomAvatar

  // 红包消息
  if (message.messageType === 'redenvelope' && message.redEnvelopeId) {
    return (
      <>
        {renderTimeDivider()}
        <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            {isCustomAvatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
                {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
              </div>
            )}
          </div>
          <div 
            className="cursor-pointer"
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            <RedEnvelopeCard
              redEnvelopeId={message.redEnvelopeId}
              onClick={() => onOpenRedEnvelope(message.redEnvelopeId!)}
            />
          </div>
        </div>
      </>
    )
  }

  // 转账消息
  if (message.messageType === 'transfer' && message.transfer) {
    const { amount, message: transferMessage, status } = message.transfer
    const isPending = status === 'pending'
    const isReceived = status === 'received'
    const isExpired = status === 'expired'

    return (
      <>
        {renderTimeDivider()}
        <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            {isCustomAvatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
                {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
              </div>
            )}
          </div>
          <div 
            className={`bg-white rounded-lg shadow-sm p-4 max-w-[240px] ${
              isExpired ? 'opacity-50' : ''
            }`}
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">¥</span>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-800">¥{amount.toFixed(2)}</div>
                <div className="text-xs text-gray-500">{transferMessage}</div>
              </div>
            </div>
            
            {!isSent && isPending && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onReceiveTransfer(message.id)}
                  className="flex-1 bg-orange-500 text-white text-sm py-2 rounded-md hover:bg-orange-600 transition-colors"
                >
                  确认收款
                </button>
                <button
                  onClick={() => onRejectTransfer(message.id)}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  退还
                </button>
              </div>
            )}
            
            {isReceived && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 text-center">
                已收款
              </div>
            )}
            
            {isExpired && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 text-center">
                已退还
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // 亲密付消息
  if (message.messageType === 'intimate_pay' && message.intimatePay) {
    const { monthlyLimit, characterName, status } = message.intimatePay
    const isPending = status === 'pending'
    const isAccepted = status === 'accepted'
    const isRejected = status === 'rejected'

    return (
      <>
        {renderTimeDivider()}
        <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            {isCustomAvatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
                {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
              </div>
            )}
          </div>
          <div 
            className={`bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg shadow-sm p-4 max-w-[260px] border border-pink-200 ${
              isRejected ? 'opacity-50' : ''
            }`}
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            <div className="flex items-center gap-3 mb-3">
              <img src="/src/assets/intimate-pay-icon.png" alt="亲密付" className="w-12 h-12" />
              <div className="flex-1">
                <div className="text-sm font-bold text-gray-800">亲密付</div>
                <div className="text-xs text-gray-500">
                  {isSent ? `为 ${characterName} 开通` : `${characterName} 为你开通`}
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-500 mb-1">每月消费额度</div>
              <div className="text-2xl font-bold text-pink-600">¥{monthlyLimit.toLocaleString()}</div>
            </div>
            
            {!isSent && isPending && (
              <div className="flex gap-2">
                <button
                  onClick={() => onAcceptIntimatePay(message)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm py-2 rounded-md hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  接受
                </button>
                <button
                  onClick={() => onRejectIntimatePay(message)}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  拒绝
                </button>
              </div>
            )}
            
            {isAccepted && (
              <div className="text-xs text-green-600 text-center font-medium">
                ✓ 已开通
              </div>
            )}
            
            {isRejected && (
              <div className="text-xs text-gray-400 text-center">
                已拒绝
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // 表情包消息
  if (message.messageType === 'emoji' && message.emojiUrl) {
    return (
      <>
        {renderTimeDivider()}
        <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            {isCustomAvatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
                {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
              </div>
            )}
          </div>
          <div 
            className="max-w-[200px]"
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            <img 
              src={message.emojiUrl} 
              alt={message.emojiDescription || '表情'} 
              className="w-full h-auto rounded-lg"
              loading="lazy"
            />
          </div>
        </div>
      </>
    )
  }

  // 照片消息
  if (message.messageType === 'photo' && message.photoDescription) {
    return (
      <>
        {renderTimeDivider()}
        <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            {isCustomAvatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
                {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
              </div>
            )}
          </div>
          <div 
            className="max-w-[200px]"
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            <FlipPhotoCard description={message.photoDescription} />
          </div>
        </div>
      </>
    )
  }

  // 语音消息
  if (message.messageType === 'voice' && message.voiceText) {
    const duration = Math.min(Math.max(Math.ceil(message.voiceText.length / 5), 1), 60)
    const isPlaying = playingVoiceId === message.id
    const showText = showVoiceTextMap[message.id]

    return (
      <>
        {renderTimeDivider()}
        <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            {isCustomAvatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
                {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
              </div>
            )}
          </div>
          <div>
            <div 
              className={`${isSent ? 'bg-[#95EC69]' : 'bg-white'} rounded-lg px-4 py-2 cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 min-w-[100px] max-w-[200px]`}
              style={isSent ? { backgroundColor: userBubbleColor } : { backgroundColor: aiBubbleColor }}
              onClick={() => onPlayVoice(message.id, duration)}
              onTouchStart={(e) => onLongPressStart(message, e)}
              onTouchEnd={onLongPressEnd}
              onMouseDown={(e) => onLongPressStart(message, e)}
              onMouseUp={onLongPressEnd}
              onMouseLeave={onLongPressEnd}
            >
              <div className={`flex items-center gap-1 ${isSent ? 'flex-row-reverse' : 'flex-row'} flex-1`}>
                {isPlaying ? (
                  <div className="flex gap-0.5">
                    <div className="w-1 bg-gray-600 rounded-full animate-pulse" style={{ height: '12px' }}></div>
                    <div className="w-1 bg-gray-600 rounded-full animate-pulse" style={{ height: '16px', animationDelay: '0.1s' }}></div>
                    <div className="w-1 bg-gray-600 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '0.2s' }}></div>
                  </div>
                ) : (
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                )}
                <span className="text-sm text-gray-700">{duration}"</span>
              </div>
            </div>
            {showText && (
              <div className="mt-1 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 max-w-[200px]">
                {message.voiceText}
              </div>
            )}
            <button
              onClick={() => onToggleVoiceText(message.id)}
              className="text-xs text-blue-500 mt-1 hover:underline"
            >
              {showText ? '隐藏文字' : '转文字'}
            </button>
          </div>
        </div>
      </>
    )
  }

  // 位置消息
  if (message.messageType === 'location' && message.location) {
    return (
      <>
        {renderTimeDivider()}
        <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
            {isCustomAvatar ? (
              <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
                {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
              </div>
            )}
          </div>
          <div 
            className="bg-white rounded-lg shadow-sm overflow-hidden max-w-[240px] cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onViewLocation(message)}
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            <div className="h-24 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="p-3">
              <div className="font-medium text-sm text-gray-800 mb-1">{message.location.name}</div>
              <div className="text-xs text-gray-500">{message.location.address}</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // 普通文本消息
  const bubbleStyle = isSent ? userBubbleCSS : aiBubbleCSS
  const bubbleColor = isSent ? userBubbleColor : aiBubbleColor

  // 处理引用消息
  const renderQuotedMessage = () => {
    if (!message.quotedMessage) return null
    
    return (
      <div className="bg-black/5 border-l-2 border-gray-400 pl-2 py-1 mb-2 text-xs">
        <div className="text-gray-600 font-medium">{message.quotedMessage.senderName}</div>
        <div className="text-gray-500 line-clamp-2">{message.quotedMessage.content}</div>
      </div>
    )
  }

  // 处理旁白
  const renderNarrations = () => {
    if (!enableNarration || !message.narrations || message.narrations.length === 0) return null
    
    return (
      <div className="space-y-1 mb-2">
        {message.narrations.map((narration, idx) => (
          <div 
            key={idx}
            className={`text-xs italic ${
              narration.type === 'action' ? 'text-gray-400' : 'text-purple-400'
            }`}
          >
            {narration.type === 'action' ? '💭 ' : '🧠 '}
            {narration.content}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {renderTimeDivider()}
      <div className={`flex gap-2 mb-3 ${isSent ? 'flex-row-reverse' : 'flex-row'} ${isSent ? 'message-sent' : 'message-received'}`}>
        {/* 拉黑警告图标 - 只在被拉黑的AI消息左侧显示 */}
        {!isSent && message.blocked && (
          <div className="flex items-start pt-2" title="此用户已被你拉黑">
            <span className="text-red-500 text-lg">⚠️</span>
          </div>
        )}
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
          {isCustomAvatar ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
              {isSent ? (currentUser?.name?.[0] || 'U') : (character?.name?.[0] || 'A')}
            </div>
          )}
        </div>
        <div className="flex flex-col max-w-[70%]">
          {renderNarrations()}
          <div 
            className={`rounded-lg px-4 py-2 break-words ${isSent ? 'bg-[#95EC69]' : 'bg-white'}`}
            style={bubbleStyle ? undefined : { backgroundColor: bubbleColor }}
            onTouchStart={(e) => onLongPressStart(message, e)}
            onTouchEnd={onLongPressEnd}
            onMouseDown={(e) => onLongPressStart(message, e)}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
          >
            {renderQuotedMessage()}
            <div 
              className="text-[15px] leading-relaxed whitespace-pre-wrap" 
              {...(bubbleStyle ? { style: { cssText: bubbleStyle } as any } : {})}
            >
              {message.content}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default MessageItem
