/**
 * 存储相关工具函数统一导出
 */

// 统一存储层（推荐使用）
export {
  unifiedStorage,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  clearStorage
} from './unifiedStorage'
export type { StorageType, StorageConfig } from './unifiedStorage'

// IndexedDB
export { initDB, saveToIndexedDB, getFromIndexedDB, deleteFromIndexedDB } from '../indexedDB'
export { indexedDBStorage } from '../indexedDBStorage'

// LocalStorage
export { storage } from '../storage'
export { storageObserver } from '../storageObserver'
export { storageMonitor } from '../storageMonitor'

// 聊天存储
export { saveChatMessages, loadChatMessages } from '../chatStorage'
export { syncChatList } from '../chatListSync'

// 图片存储
export { imageStorage } from '../imageStorage'

// 表情包存储
export { emojiStorage } from '../emojiStorage'

// 论坛存储
export { forumStorage } from '../forumStorage'

// 紧急清理
export { emergencyCleanup } from '../emergencyCleanup'

