/**
 * 特色功能相关工具函数统一导出
 */

// 记账
export { accountingAssistant } from '../accountingAssistant'
export { extractAccountingInfo } from '../accountingExtractor'

// 钱包
export { walletUtils } from '../walletUtils'

// 红包算法
export { calculateRedEnvelopeAmount } from '../groupRedEnvelopeAlgorithm'

// 情侣空间
export { coupleSpaceUtils } from '../coupleSpaceUtils'
export { coupleSpaceContentUtils } from '../coupleSpaceContentUtils'

// 日记系统
export { diarySystem } from '../diarySystem'

// 连续签到
export { streakSystem } from '../streakSystem'

// 黑名单
export { blacklistManager } from '../blacklistManager'

// 离线聊天
export { offlineChatHelpers } from '../offlineChatHelpers'

// 未读消息
export { incrementUnread, clearUnread, getUnreadCount } from '../unreadMessages'

// 通知
export { notificationManager } from '../notificationManager'

