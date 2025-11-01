export interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp?: number
  isRecalled?: boolean
  recalledContent?: string
  recallReason?: string
  originalType?: 'received' | 'sent'
  quotedMessage?: {
    id: number
    content: string
    senderName: string
    type: 'received' | 'sent'
  }
  messageType?: 'text' | 'transfer' | 'system' | 'redenvelope' | 'emoji' | 'photo' | 'voice' | 'location' | 'intimate_pay'
  transfer?: {
    amount: number
    message: string
    status?: 'pending' | 'received' | 'expired'
  }
  redEnvelopeId?: string
  emojiUrl?: string
  emojiDescription?: string
  photoDescription?: string
  voiceText?: string
  location?: {
    name: string
    address: string
    latitude?: number
    longitude?: number
  }
  narrations?: {
    type: 'action' | 'thought'
    content: string
  }[]
  isCallRecord?: boolean
  callDuration?: number
  callMessages?: Array<{
    id: number
    type: 'user' | 'ai' | 'narrator'
    content: string
    time: string
  }>
  isHidden?: boolean
  intimatePay?: {
    monthlyLimit: number
    characterId: string
    characterName: string
    status: 'pending' | 'accepted' | 'rejected'
    note?: string  // 备注（可选）
  }
  blocked?: boolean  // 是否被拉黑（AI消息显示警告图标）
}
