/**
 * 🚨 紧急清理工具 - 解决 localStorage 超限问题
 * 
 * 当出现 QuotaExceededError 时运行此脚本
 */

import { setIndexedDBItem, STORES } from './indexedDBStorage'

/**
 * 紧急清理 localStorage，迁移到 IndexedDB
 */
export async function emergencyCleanup(): Promise<void> {
  console.log('🚨 开始紧急清理 localStorage...')
  
  try {
    // 1. 备份 chatList
    const chatListData = localStorage.getItem('chatList')
    if (chatListData) {
      try {
        const chats = JSON.parse(chatListData)
        console.log(`📦 发现 chatList，包含 ${chats.length} 个聊天`)
        
        // 迁移到 IndexedDB
        await setIndexedDBItem(STORES.SETTINGS, {
          key: 'chatList',
          chats: chats
        })
        
        // 清理 localStorage
        localStorage.removeItem('chatList')
        console.log('✅ chatList 已迁移到 IndexedDB 并清理')
      } catch (error) {
        console.error('❌ chatList 迁移失败:', error)
      }
    }
    
    // 2. 清理群聊消息（迁移到 IndexedDB）
    const keysToClean: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('group_messages_')) {
        keysToClean.push(key)
      }
    }
    
    console.log(`📦 发现 ${keysToClean.length} 个群聊消息需要清理`)
    
    for (const key of keysToClean) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const messages = JSON.parse(data)
          const groupId = key.replace('group_messages_', '')
          
          // 只保留最近500条消息
          const limitedMessages = messages.slice(-500)
          
          // 迁移到 IndexedDB
          await setIndexedDBItem(STORES.GROUP_MESSAGES, {
            key,
            groupId,
            messages: limitedMessages,
            lastUpdated: Date.now()
          })
          
          // 清理 localStorage
          localStorage.removeItem(key)
          console.log(`✅ ${key} 已迁移 (保留${limitedMessages.length}条)`)
        }
      } catch (error) {
        console.error(`❌ ${key} 清理失败:`, error)
      }
    }
    
    // 3. 清理单聊消息（迁移到 IndexedDB）
    const chatKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('chat_messages_')) {
        chatKeys.push(key)
      }
    }
    
    console.log(`📦 发现 ${chatKeys.length} 个单聊消息需要清理`)
    
    for (const key of chatKeys) {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const messages = JSON.parse(data)
          const characterId = key.replace('chat_messages_', '')
          
          // 只保留最近1000条消息
          const limitedMessages = messages.slice(-1000)
          
          // 迁移到 IndexedDB
          await setIndexedDBItem(STORES.CHAT_MESSAGES, {
            key,
            characterId,
            messages: limitedMessages
          })
          
          // 清理 localStorage
          localStorage.removeItem(key)
          console.log(`✅ ${key} 已迁移 (保留${limitedMessages.length}条)`)
        }
      } catch (error) {
        console.error(`❌ ${key} 清理失败:`, error)
      }
    }
    
    // 4. 显示清理结果
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 紧急清理完成！')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 检查清理后的存储使用情况
    let totalSize = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += key.length + value.length
        }
      }
    }
    
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2)
    console.log(`📊 localStorage 当前使用: ${sizeMB} MB`)
    console.log(`📦 剩余项目数: ${localStorage.length}`)
    
    alert(`✅ 清理完成！\n\n已迁移数据到 IndexedDB\nlocalStorage 使用: ${sizeMB} MB\n\n请刷新页面`)
    
  } catch (error) {
    console.error('🚨 紧急清理失败:', error)
    alert('❌ 清理失败，请查看控制台')
  }
}

/**
 * 暴露到全局，方便紧急调用
 */
if (typeof window !== 'undefined') {
  (window as any).emergencyCleanup = emergencyCleanup
}

/**
 * 检查 localStorage 使用情况
 */
export function checkLocalStorageUsage(): void {
  let totalSize = 0
  const items: Array<{ key: string; size: number }> = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key)
      if (value) {
        const size = key.length + value.length
        totalSize += size
        items.push({ key, size })
      }
    }
  }
  
  // 按大小排序
  items.sort((a, b) => b.size - a.size)
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 localStorage 使用情况')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`项目数: ${localStorage.length}`)
  console.log('\n🔝 占用最大的前10项:')
  
  items.slice(0, 10).forEach((item, index) => {
    const sizeMB = (item.size / 1024 / 1024).toFixed(2)
    console.log(`  ${index + 1}. ${item.key}: ${sizeMB} MB`)
  })
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

if (typeof window !== 'undefined') {
  (window as any).checkStorage = checkLocalStorageUsage
}
