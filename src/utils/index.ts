/**
 * Utils 统一导出文件 - 重构版
 *
 * 新的组织结构:
 * - ai/         AI 相关功能（API、记忆、提示词等）
 * - social/     社交功能（朋友圈、论坛、群聊等）
 * - storage/    存储相关（IndexedDB、LocalStorage等）
 * - media/      媒体处理（图片、表情包等）
 * - features/   特色功能（记账、钱包、情侣空间等）
 * - parsers/    解析器（角色卡、AI响应等）
 * - games/      游戏相关
 * - external/   外部API（天气、小红书等）
 * - dev/        开发工具（性能监控、测试数据等）
 *
 * 使用方式:
 * - 新方式（推荐）: import { callAI } from '@/utils/ai'
 * - 旧方式（兼容）: import { callAI } from '@/utils'
 */

// ==================== 分类导出（新增）====================
export * from './ai'
export * from './social'
export * from './storage'
export * from './media'
export * from './features'
export * from './parsers'
export * from './games'
export * from './external'
export * from './dev'

// ==================== AI 相关 ====================
export { callAI } from './api'
export { buildRoleplayPrompt, buildBlacklistPrompt } from './prompts'
export { parseAIResponse } from './aiResponseParser'
export { memorySystem } from './memorySystem'
export { lorebookManager } from './lorebookSystem'
export { diarySystem } from './diarySystem'

// ==================== 存储相关 ====================
export { getItem, setItem, removeItem } from './storage'
export * as IDB from './indexedDB'
export { storageObserver } from './storageObserver'
export { setIndexedDBItem, getIndexedDBItem, STORES } from './indexedDBStorage'

// ==================== 社交功能 ====================
export { generateAIMoment } from './aiMomentsService'
export { getMomentsContext } from './momentsContext'
export { recordSparkMoment, getSparkMoments } from './sparkSystem'
export { getStreakData, updateStreak } from './streakSystem'

// ==================== 支付相关 ====================
export {
  sendRedEnvelope,
  receiveRedEnvelope,
  sendTransfer,
  receiveTransfer,
  getBalance,
  useCharacterIntimatePay
} from './walletUtils'
export { calculateRedEnvelopeDistribution } from './groupRedEnvelopeAlgorithm'

// ==================== 媒体处理 ====================
export { fileToBase64, compressImage, isValidImageFile, isValidImageSize } from './imageUtils'
export { getAvatarUrl } from './avatarUtils'
export { parseEmoji } from './emojiParser'
export * as EmojiStorage from './emojiStorage'

// ==================== 聊天相关 ====================
export { incrementUnread, clearUnread, getUnreadCount } from './unreadMessages'
export { updateChatListLastMessage, showBackgroundChatNotification } from './chatListSync'
export { markAIReplying, markAIReplyComplete } from './backgroundAI'

// ==================== 通用工具 ====================
export { calculateContextTokens, formatTokenCount } from './tokenCounter'
export { blacklistManager } from './blacklistManager'
export { clearAllAvatarCache } from './clearAvatarCache'

// ==================== 类型导出 ====================
export type { Memory } from './memorySystem'
export type { Emoji } from './emojiStorage'

