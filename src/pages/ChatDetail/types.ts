/**
 * ChatDetail 类型定义
 */

import { XiaohongshuNote } from '../../types/xiaohongshu'

export interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp?: number  // 添加时间戳字段（毫秒）
  isRecalled?: boolean  // 是否已撤回
  recalledContent?: string  // 撤回前的原始内容（供AI查看）
  originalType?: 'received' | 'sent'  // 撤回前的原始消息类型（用于判断是谁撤回的）
  quotedMessage?: {  // 引用的消息
    id: number
    content: string
    senderName: string
    type: 'received' | 'sent'
  }
  messageType?: 'text' | 'transfer' | 'system' | 'redenvelope' | 'emoji' | 'photo' | 'voice' | 'location' | 'intimate_pay' | 'couple_space_invite' | 'xiaohongshu' | 'image' | 'musicInvite' | 'musicShare'
  transfer?: {
    amount: number
    message: string
    status?: 'pending' | 'received' | 'expired'
  }
  redEnvelopeId?: string
  emojiUrl?: string
  emojiDescription?: string
  photoDescription?: string
  imageUrl?: string  // 用于识图的图片URL（base64或http链接）
  voiceText?: string
  avatarPrompt?: string  // 换头像时使用的提示词
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
  isCallRecord?: boolean  // 是否是通话记录
  callDuration?: number   // 通话时长（秒）
  callMessages?: Array<{id: number, type: 'user' | 'ai' | 'narrator', content: string, time: string}>  // 通话消息
  isHidden?: boolean      // 是否隐藏显示（但AI能看到）
  intimatePay?: {
    monthlyLimit: number
    characterId: string
    characterName: string
    status: 'pending' | 'accepted' | 'rejected'
  }
  coupleSpaceInvite?: {
    inviterId: string
    inviterName: string
    status: 'pending' | 'accepted' | 'rejected'
  }
  xiaohongshuNote?: XiaohongshuNote  // 小红书笔记数据
  blocked?: boolean  // 是否被拉黑（AI消息显示警告图标）
  musicShare?: {
    songTitle: string
    songArtist: string
    songCover?: string
  }
}

export interface TokenStats {
  total: number
  remaining: number
  percentage: number
  systemPrompt: number
  lorebook: number
  messages: number
}

export interface LorebookEntry {
  name: string
  tokens: number
}

export interface MusicInfo {
  songTitle: string
  songArtist: string
  songCover?: string
}

export interface CoupleSpaceContent {
  type: 'photo' | 'message' | 'anniversary'
  photoDescription?: string
  photoFiles?: string[]
  messageContent?: string
  anniversaryDate?: string
  anniversaryTitle?: string
  anniversaryDescription?: string
}

