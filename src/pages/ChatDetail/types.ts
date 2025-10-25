/**
 * ChatDetail 相关类型定义
 */

export interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp?: number  // 时间戳（毫秒）
  isRecalled?: boolean  // 是否已撤回
  recalledContent?: string  // 撤回前的原始内容（供AI查看）
  originalType?: 'received' | 'sent'  // 撤回前的原始消息类型
  quotedMessage?: QuotedMessage  // 引用的消息
  messageType?: MessageType
  transfer?: TransferInfo
  redEnvelopeId?: string
  emojiUrl?: string
  emojiDescription?: string
  photoDescription?: string
  voiceText?: string
  location?: LocationInfo
  narrations?: Narration[]
  isCallRecord?: boolean  // 是否是通话记录
  callDuration?: number   // 通话时长（秒）
  callMessages?: CallMessage[]  // 通话消息
  isHidden?: boolean      // 是否隐藏显示（但AI能看到）
  intimatePay?: IntimatePayInfo
  blocked?: boolean  // 是否被拉黑
}

export interface QuotedMessage {
  id: number
  content: string
  senderName: string
  type: 'received' | 'sent'
}

export type MessageType = 
  | 'text' 
  | 'transfer' 
  | 'system' 
  | 'redenvelope' 
  | 'emoji' 
  | 'photo' 
  | 'voice' 
  | 'location' 
  | 'intimate_pay'

export interface TransferInfo {
  amount: number
  message: string
  status?: 'pending' | 'received' | 'expired'
}

export interface LocationInfo {
  name: string
  address: string
  latitude?: number
  longitude?: number
}

export interface Narration {
  type: 'action' | 'thought'
  content: string
}

export interface CallMessage {
  id: number
  type: 'user' | 'ai' | 'narrator'
  content: string
  time: string
}

export interface IntimatePayInfo {
  monthlyLimit: number
  characterId: string
  characterName: string
  status: 'pending' | 'accepted' | 'rejected'
}
