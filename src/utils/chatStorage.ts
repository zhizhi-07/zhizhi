/**
 * 聊天记录存储 - 使用IndexedDB
 * 突破localStorage的5-10MB限制，支持无限聊天记录
 */

import { initDB, setIndexedDBItem, getIndexedDBItem, STORES } from './indexedDBStorage'

interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp?: number
  [key: string]: any
}

/**
 * 保存聊天记录到IndexedDB
 */
export async function saveChatMessages(chatId: string, messages: Message[]): Promise<boolean> {
  try {
    const data = {
      key: `chat_messages_${chatId}`,
      characterId: chatId,
      messages,
      updatedAt: Date.now()
    }
    
    const success = await setIndexedDBItem(STORES.CHAT_MESSAGES, data)
    
    if (success) {
      console.log(`✅ 聊天记录已保存到IndexedDB: ${chatId}（${messages.length}条消息）`)
    }
    
    return success
  } catch (error) {
    console.error('保存聊天记录到IndexedDB失败:', error)
    // 降级到localStorage
    try {
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages))
      console.log('⚠️ 已降级到localStorage保存')
      return true
    } catch (e) {
      console.error('localStorage也保存失败:', e)
      return false
    }
  }
}

/**
 * 从IndexedDB读取聊天记录
 */
export async function loadChatMessages(chatId: string): Promise<Message[]> {
  try {
    // 先尝试从IndexedDB读取
    const data = await getIndexedDBItem<{ messages: Message[] }>(
      STORES.CHAT_MESSAGES, 
      `chat_messages_${chatId}`
    )
    
    if (data && data.messages) {
      console.log(`✅ 从IndexedDB加载聊天记录: ${chatId}（${data.messages.length}条消息）`)
      return data.messages
    }
    
    // 如果IndexedDB没有，尝试从localStorage读取并迁移
    const localData = localStorage.getItem(`chat_messages_${chatId}`)
    if (localData) {
      const messages = JSON.parse(localData)
      console.log(`🔄 从localStorage迁移聊天记录到IndexedDB: ${chatId}`)
      
      // 异步迁移，不阻塞
      saveChatMessages(chatId, messages).catch(err => {
        console.error('迁移失败:', err)
      })
      
      return messages
    }
    
    return []
  } catch (error) {
    console.error('加载聊天记录失败:', error)
    
    // 降级到localStorage
    try {
      const localData = localStorage.getItem(`chat_messages_${chatId}`)
      if (localData) {
        return JSON.parse(localData)
      }
    } catch (e) {
      console.error('从localStorage加载也失败:', e)
    }
    
    return []
  }
}

/**
 * 获取所有聊天的消息数量统计
 */
export async function getChatStatistics(): Promise<{
  totalChats: number
  totalMessages: number
  chatSizes: Array<{ chatId: string; messageCount: number }>
}> {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORES.CHAT_MESSAGES], 'readonly')
    const store = transaction.objectStore(STORES.CHAT_MESSAGES)
    const request = store.getAll()
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const allChats = request.result || []
        let totalMessages = 0
        const chatSizes = allChats.map((chat: any) => {
          const count = chat.messages?.length || 0
          totalMessages += count
          return {
            chatId: chat.characterId,
            messageCount: count
          }
        })
        
        resolve({
          totalChats: allChats.length,
          totalMessages,
          chatSizes: chatSizes.sort((a, b) => b.messageCount - a.messageCount)
        })
      }
      
      request.onerror = () => {
        resolve({ totalChats: 0, totalMessages: 0, chatSizes: [] })
      }
    })
  } catch (error) {
    console.error('获取统计信息失败:', error)
    return { totalChats: 0, totalMessages: 0, chatSizes: [] }
  }
}

/**
 * 迁移所有localStorage的聊天记录到IndexedDB
 */
export async function migrateAllChatsToIndexedDB(): Promise<{
  success: number
  failed: number
  totalMessages: number
}> {
  console.log('🔄 开始迁移所有聊天记录到IndexedDB...')
  
  let success = 0
  let failed = 0
  let totalMessages = 0
  
  try {
    // 查找所有聊天记录key
    const chatKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('chat_messages_')) {
        chatKeys.push(key)
      }
    }
    
    console.log(`📊 找到 ${chatKeys.length} 个聊天需要迁移`)
    
    // 迁移每个聊天
    for (const key of chatKeys) {
      try {
        const data = localStorage.getItem(key)
        if (!data) continue
        
        const messages = JSON.parse(data)
        const chatId = key.replace('chat_messages_', '')
        
        const result = await saveChatMessages(chatId, messages)
        if (result) {
          success++
          totalMessages += messages.length
          console.log(`✅ 迁移成功: ${chatId}（${messages.length}条消息）`)
        } else {
          failed++
          console.error(`❌ 迁移失败: ${chatId}`)
        }
      } catch (error) {
        failed++
        console.error(`❌ 迁移 ${key} 失败:`, error)
      }
    }
    
    console.log(`✅ 迁移完成: ${success}个成功，${failed}个失败，共${totalMessages}条消息`)
  } catch (error) {
    console.error('❌ 迁移过程出错:', error)
  }
  
  return { success, failed, totalMessages }
}

/**
 * 清理localStorage中已迁移的聊天记录（可选）
 */
export function cleanupLocalStorageChats(): { cleaned: number; freedSpace: number } {
  console.log('🧹 清理localStorage中的聊天记录...')
  
  let cleaned = 0
  let freedSpace = 0
  
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('chat_messages_')) {
      keysToRemove.push(key)
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      const data = localStorage.getItem(key)
      if (data) {
        freedSpace += new Blob([data]).size
      }
      localStorage.removeItem(key)
      cleaned++
      console.log(`🗑️ 已清理: ${key}`)
    } catch (error) {
      console.error(`清理 ${key} 失败:`, error)
    }
  })
  
  console.log(`✅ 清理完成: ${cleaned}个文件，释放约 ${(freedSpace / 1024 / 1024).toFixed(2)} MB`)
  
  return { cleaned, freedSpace }
}
