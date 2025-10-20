/**
 * IndexedDB 存储方案 - 突破 localStorage 限制
 * 存储空间：可达 50MB - 数百MB（取决于浏览器）
 */

const DB_NAME = 'WeChatAppDB'
const DB_VERSION = 1
const STORES = {
  MOMENTS: 'moments',
  CHAT_MESSAGES: 'chat_messages',
  EMOJIS: 'emojis',
  SETTINGS: 'settings'
}

let dbInstance: IDBDatabase | null = null

/**
 * 初始化数据库
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('❌ IndexedDB 打开失败:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      console.log('✅ IndexedDB 初始化成功')
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 创建朋友圈存储
      if (!db.objectStoreNames.contains(STORES.MOMENTS)) {
        const momentsStore = db.createObjectStore(STORES.MOMENTS, { keyPath: 'id' })
        momentsStore.createIndex('createdAt', 'createdAt', { unique: false })
        momentsStore.createIndex('userId', 'userId', { unique: false })
      }

      // 创建聊天消息存储
      if (!db.objectStoreNames.contains(STORES.CHAT_MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.CHAT_MESSAGES, { keyPath: 'key' })
        messagesStore.createIndex('characterId', 'characterId', { unique: false })
      }

      // 创建表情包存储
      if (!db.objectStoreNames.contains(STORES.EMOJIS)) {
        const emojisStore = db.createObjectStore(STORES.EMOJIS, { keyPath: 'id' })
        emojisStore.createIndex('addTime', 'addTime', { unique: false })
      }

      // 创建设置存储
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
      }

      console.log('✅ IndexedDB 数据库结构创建完成')
    }
  })
}

/**
 * 保存数据到 IndexedDB
 */
export async function setIndexedDBItem(storeName: string, data: any): Promise<boolean> {
  try {
    const db = await initDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    
    store.put(data)
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`✅ 保存到 ${storeName} 成功`)
        resolve(true)
      }
      transaction.onerror = () => {
        console.error(`❌ 保存到 ${storeName} 失败:`, transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error('保存失败:', error)
    return false
  }
}

/**
 * 从 IndexedDB 读取数据
 */
export async function getIndexedDBItem<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await initDB()
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(key)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => {
        console.error(`❌ 读取 ${storeName} 失败:`, request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('读取失败:', error)
    return null
  }
}

/**
 * 获取所有数据
 */
export async function getAllIndexedDBItems<T>(storeName: string): Promise<T[]> {
  try {
    const db = await initDB()
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => {
        console.error(`❌ 读取所有 ${storeName} 失败:`, request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('读取失败:', error)
    return []
  }
}

/**
 * 删除数据
 */
export async function deleteIndexedDBItem(storeName: string, key: string | number): Promise<boolean> {
  try {
    const db = await initDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    store.delete(key)
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`✅ 删除 ${storeName}/${key} 成功`)
        resolve(true)
      }
      transaction.onerror = () => {
        console.error(`❌ 删除 ${storeName}/${key} 失败:`, transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error('删除失败:', error)
    return false
  }
}

/**
 * 清空整个存储
 */
export async function clearIndexedDBStore(storeName: string): Promise<boolean> {
  try {
    const db = await initDB()
    const transaction = db.transaction([storeName], 'readwrite')
    const store = transaction.objectStore(storeName)
    store.clear()
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`✅ 清空 ${storeName} 成功`)
        resolve(true)
      }
      transaction.onerror = () => {
        console.error(`❌ 清空 ${storeName} 失败:`, transaction.error)
        reject(transaction.error)
      }
    })
  } catch (error) {
    console.error('清空失败:', error)
    return false
  }
}

/**
 * 迁移 localStorage 数据到 IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  console.log('🔄 开始迁移 localStorage 数据到 IndexedDB...')
  
  try {
    // 迁移朋友圈数据
    const momentsData = localStorage.getItem('moments')
    if (momentsData) {
      const moments = JSON.parse(momentsData)
      if (Array.isArray(moments)) {
        for (const moment of moments) {
          await setIndexedDBItem(STORES.MOMENTS, moment)
        }
        console.log(`✅ 迁移了 ${moments.length} 条朋友圈`)
      }
    }

    // 迁移表情包数据
    const emojisData = localStorage.getItem('custom_emojis')
    if (emojisData) {
      const emojis = JSON.parse(emojisData)
      if (Array.isArray(emojis)) {
        for (const emoji of emojis) {
          await setIndexedDBItem(STORES.EMOJIS, emoji)
        }
        console.log(`✅ 迁移了 ${emojis.length} 个表情包`)
      }
    }

    // 迁移聊天记录
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('chat_messages_')) {
        const messagesData = localStorage.getItem(key)
        if (messagesData) {
          const messages = JSON.parse(messagesData)
          const characterId = key.replace('chat_messages_', '')
          await setIndexedDBItem(STORES.CHAT_MESSAGES, {
            key,
            characterId,
            messages
          })
          console.log(`✅ 迁移了 ${key} 的聊天记录`)
        }
      }
    }

    console.log('✅ 数据迁移完成！')
  } catch (error) {
    console.error('❌ 数据迁移失败:', error)
  }
}

/**
 * 获取 IndexedDB 使用情况
 */
export async function getIndexedDBUsage(): Promise<{ used: number; quota: number; percentage: number }> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage || 0
      const quota = estimate.quota || 0
      const percentage = quota > 0 ? (used / quota) * 100 : 0
      
      return {
        used: Math.round(used / 1024 / 1024), // MB
        quota: Math.round(quota / 1024 / 1024), // MB
        percentage: Math.round(percentage)
      }
    }
  } catch (error) {
    console.error('获取存储信息失败:', error)
  }
  
  return { used: 0, quota: 0, percentage: 0 }
}

export { STORES }
