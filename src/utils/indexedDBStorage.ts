/**
 * IndexedDB 存储方案 - 突破 localStorage 限制
 * 存储空间：可达 50MB - 数百MB（取决于浏览器）
 */

const DB_NAME = 'WeChatAppDB'
const DB_VERSION = 2  // 升级版本以修复object store问题
const STORES = {
  MOMENTS: 'moments',
  CHAT_MESSAGES: 'chat_messages',
  EMOJIS: 'emojis',
  SETTINGS: 'settings'
}

let dbInstance: IDBDatabase | null = null

/**
 * 重置数据库连接（用于升级后刷新）
 */
export function resetDBConnection(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    console.log('🔄 数据库连接已重置')
  }
}

/**
 * 初始化数据库
 */
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    console.log('[initDB] 使用缓存的数据库实例')
    return dbInstance
  }

  console.log('[initDB] 打开数据库...')
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    let resolved = false

    // 超时保护：10秒后强制失败
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        console.error('[initDB] ❌ 数据库打开超时（10秒）！')
        console.error('[initDB] 可能原因：')
        console.error('  1. 其他标签页正在使用数据库')
        console.error('  2. 数据库被锁定')
        console.error('  3. 浏览器权限问题')
        reject(new Error('IndexedDB 初始化超时'))
      }
    }, 10000)

    request.onerror = () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        console.error('[initDB] ❌ 打开失败:', request.error)
        reject(request.error)
      }
    }

    request.onblocked = () => {
      console.warn('[initDB] ⚠️ 数据库被阻塞！请关闭其他标签页')
    }

    request.onsuccess = () => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        dbInstance = request.result
        console.log('[initDB] ✅ 初始化成功')
        resolve(dbInstance)
      }
    }

    request.onupgradeneeded = (event) => {
      console.log('[initDB] 触发数据库升级...')
      const db = (event.target as IDBOpenDBRequest).result
      const oldVersion = event.oldVersion
      
      console.log(`🔄 数据库升级: ${oldVersion} → ${DB_VERSION}`)

      // 创建朋友圈存储
      if (!db.objectStoreNames.contains(STORES.MOMENTS)) {
        const momentsStore = db.createObjectStore(STORES.MOMENTS, { keyPath: 'id' })
        momentsStore.createIndex('createdAt', 'createdAt', { unique: false })
        momentsStore.createIndex('userId', 'userId', { unique: false })
        console.log(`✅ 创建 ${STORES.MOMENTS} store`)
      }

      // 创建聊天消息存储
      if (!db.objectStoreNames.contains(STORES.CHAT_MESSAGES)) {
        const messagesStore = db.createObjectStore(STORES.CHAT_MESSAGES, { keyPath: 'key' })
        messagesStore.createIndex('characterId', 'characterId', { unique: false })
        console.log(`✅ 创建 ${STORES.CHAT_MESSAGES} store`)
      }

      // 创建表情包存储
      if (!db.objectStoreNames.contains(STORES.EMOJIS)) {
        const emojisStore = db.createObjectStore(STORES.EMOJIS, { keyPath: 'id' })
        emojisStore.createIndex('addTime', 'addTime', { unique: false })
        console.log(`✅ 创建 ${STORES.EMOJIS} store`)
      }

      // 创建设置存储
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
        console.log(`✅ 创建 ${STORES.SETTINGS} store`)
      }

      console.log('✅ IndexedDB 数据库结构升级完成')
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
    console.log(`[IndexedDB] 初始化数据库...`)
    const db = await initDB()
    console.log(`[IndexedDB] 创建事务...`)
    const transaction = db.transaction([storeName], 'readonly')
    const store = transaction.objectStore(storeName)
    console.log(`[IndexedDB] 执行 getAll()...`)
    const request = store.getAll()
    
    return new Promise((resolve, reject) => {
      let resolved = false
      
      request.onsuccess = () => {
        if (!resolved) {
          resolved = true
          console.log(`[IndexedDB] getAll() 成功，返回 ${(request.result || []).length} 条数据`)
          resolve(request.result || [])
        }
      }
      request.onerror = () => {
        if (!resolved) {
          resolved = true
          console.error(`[IndexedDB] getAll() 失败:`, request.error)
          resolve([]) // 失败时返回空数组而不是reject
        }
      }
      
      // 添加超时保护
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          console.error(`[IndexedDB] getAll() 超时（5秒）！强制返回空数组`)
          resolve([])
        }
      }, 5000)
    })
  } catch (error) {
    console.error('[IndexedDB] 异常:', error)
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
