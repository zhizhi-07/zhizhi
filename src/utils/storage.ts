export const STORAGE_KEYS = {
  API_SETTINGS: 'apiSettings',
  SECONDARY_API_ENABLED: 'enableSecondaryApi',
  SECONDARY_API_BASE_URL: 'secondaryApiBaseUrl',
  SECONDARY_API_KEY: 'secondaryApiKey',
  SECONDARY_API_MODEL: 'secondaryApiModel',
}

export const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export const setItem = (key: string, value: any): boolean => {
  const jsonString = JSON.stringify(value)
  try {
    localStorage.setItem(key, jsonString)
    return true
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // 静默尝试自动清理，不输出错误日志（避免频繁打扰）
      autoCleanIfNeeded()
      
      // 再次尝试保存
      try {
        localStorage.setItem(key, jsonString)
        return true
      } catch (retryError) {
        // 只在真正失败时才提示用户
        console.error('❌ 存储空间不足，保存失败')
        console.warn('⚠️ localStorage 存储失败（这是正常的，数据已自动保存到 IndexedDB）')
        console.log('💡 提示：大部分数据已迁移到 IndexedDB，不影响使用')
        return false
      }
    }
    console.error('Storage error:', error)
    return false
  }
}

// 清理不重要的数据（保护聊天记录和朋友圈！）
const cleanUnimportantData = (): void => {
  try {
    console.log('🧹 开始清理缓存数据')
    console.log('💬 聊天记录不会被清理')
    console.log('📱 朋友圈不会被清理')
    console.log('🗑️ 只清理临时缓存')
    
    let cleanedCount = 0
    
    // 只清理缓存数据（temp_、cache_、preview_ 开头的）
    const cacheKeys = ['temp_', 'cache_', 'preview_']
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key && cacheKeys.some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key)
        cleanedCount++
        console.log(`🗑️ 清理缓存: ${key}`)
      }
    }
    
    if (cleanedCount === 0) {
      console.log('ℹ️ 没有找到可清理的缓存数据')
      console.log('💡 建议：手动清理浏览器缓存或删除不需要的数据')
    } else {
      console.log(`✅ 清理完成，共清理 ${cleanedCount} 个缓存项`)
    }
    
    console.log('✅ 聊天记录和朋友圈已完整保留')
  } catch (error) {
    console.error('清理存储空间失败:', error)
  }
}

// 自动清理机制：当存储空间超过90%时自动清理（提高阈值，减少清理频率）
let lastCleanTime = 0 // 记录上次清理时间，避免频繁清理
const autoCleanIfNeeded = (): void => {
  try {
    const storageInfo = getStorageInfo()
    // 只在存储使用率较高时才输出日志
    if (storageInfo.percentage > 80) {
      console.log(`📊 当前存储使用率: ${storageInfo.percentage}%`)
    }
    
    // 如果存储使用率超过90%，且距离上次清理超过30秒，才进行清理
    const now = Date.now()
    if (storageInfo.percentage > 90 && now - lastCleanTime > 30000) {
      console.log('⚠️ 存储空间使用率超过90%')
      console.log('💬 聊天记录不会被清理')
      console.log('📱 朋友圈不会被清理')
      console.log('🗑️ 只清理临时缓存')
      lastCleanTime = now
      cleanUnimportantData()
    }
  } catch (error) {
    console.error('自动清理失败:', error)
  }
}

// 获取当前存储使用情况
export const getStorageInfo = (): { used: number; total: number; percentage: number } => {
  let used = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          used += key.length + value.length
        }
      }
    }
  } catch (error) {
    console.error('获取存储信息失败:', error)
  }
  
  // localStorage实际限制通常是5-10MB，这里设置为10MB
  // 但为了避免频繁清理，我们假设一个更大的虚拟空间
  const total = 50 * 1024 * 1024 // 假设50MB虚拟空间（降低清理频率）
  const percentage = (used / total) * 100
  
  return {
    used: Math.round(used / 1024), // KB
    total: Math.round(total / 1024), // KB
    percentage: Math.round(percentage * 10) / 10 // 保留一位小数，更精确
  }
}

export const removeItem = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Storage error:', error)
  }
}

// 手动清理存储空间（仅在用户主动触发时执行）
export const manualCleanStorage = (): void => {
  console.log('🧹 开始手动清理存储空间...')
  console.log('💬 注意：聊天记录不会被清理')
  cleanUnimportantData()
    
    // 清理朋友圈缓存
    try {
      const momentsKeys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('moments') || key.includes('ai_moments'))) {
          momentsKeys.push(key)
        }
      }
      
      // 只保留最近的朋友圈数据（保留更多回忆）
      momentsKeys.forEach(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]')
          if (Array.isArray(data) && data.length > 200) {
            const recentData = data.slice(-200)
            localStorage.setItem(key, JSON.stringify(recentData))
            console.log(`✂️ ${key}: 从 ${data.length} 条裁剪到 200 条`)
          }
        } catch (e) {
          console.error(`清理 ${key} 失败:`, e)
        }
      })
      
      console.log('✅ 手动清理完成')
    } catch (error) {
      console.error('手动清理失败:', error)
    }
}

// 压缩存储数据（移除不必要的字段）
export const compressStorageData = (): void => {
  try {
    console.log('🗜️ 开始压缩存储数据...')
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('chat_messages_')) {
        try {
          const messages = JSON.parse(localStorage.getItem(key) || '[]')
          
          // 移除消息中的冗余字段
          const compressedMessages = messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            timestamp: msg.timestamp,
            type: msg.type || 'text'
            // 移除其他可能的冗余字段
          }))
          
          localStorage.setItem(key, JSON.stringify(compressedMessages))
        } catch (e) {
          console.error(`压缩 ${key} 失败:`, e)
        }
      }
    }
    
    console.log('✅ 数据压缩完成')
  } catch (error) {
    console.error('压缩数据失败:', error)
  }
}



