/**
 * 内存清理工具
 * 用于清理localStorage中的旧数据，释放内存
 */

interface CleanupStats {
  deletedKeys: number
  freedSpace: number // 估算的字节数
  errors: string[]
}

/**
 * 清理旧的聊天消息（只保留最近N条）
 */
export function cleanupOldMessages(maxMessagesPerChat: number = 1000): CleanupStats {
  const stats: CleanupStats = {
    deletedKeys: 0,
    freedSpace: 0,
    errors: []
  }

  try {
    // 查找所有聊天消息key
    const messageKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('chat_messages_')) {
        messageKeys.push(key)
      }
    }

    console.log(`🔍 找到 ${messageKeys.length} 个聊天记录`)

    messageKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key)
        if (!data) return

        const originalSize = new Blob([data]).size
        const messages = JSON.parse(data)

        if (Array.isArray(messages) && messages.length > maxMessagesPerChat) {
          // 只保留最近的消息
          const trimmedMessages = messages.slice(-maxMessagesPerChat)
          localStorage.setItem(key, JSON.stringify(trimmedMessages))

          const newSize = new Blob([JSON.stringify(trimmedMessages)]).size
          const freed = originalSize - newSize

          console.log(`✂️ ${key}: 从 ${messages.length} 条消息裁剪到 ${maxMessagesPerChat} 条，释放 ${(freed / 1024).toFixed(2)} KB`)
          stats.freedSpace += freed
          stats.deletedKeys++
        }
      } catch (error) {
        stats.errors.push(`处理 ${key} 失败: ${error}`)
      }
    })

    console.log(`✅ 清理完成: 处理了 ${stats.deletedKeys} 个聊天，释放约 ${(stats.freedSpace / 1024).toFixed(2)} KB`)
  } catch (error) {
    stats.errors.push(`清理失败: ${error}`)
  }

  return stats
}

/**
 * 清理过期的临时数据
 */
export function cleanupExpiredData(): CleanupStats {
  const stats: CleanupStats = {
    deletedKeys: 0,
    freedSpace: 0,
    errors: []
  }

  try {
    const keysToDelete: string[] = []
    const now = Date.now()
    const ONE_DAY = 24 * 60 * 60 * 1000

    // 查找所有带时间戳的临时数据
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      // 清理过期的红包数据
      if (key.startsWith('red_envelope_')) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const envelope = JSON.parse(data)
            if (envelope.timestamp && (now - envelope.timestamp > 7 * ONE_DAY)) {
              keysToDelete.push(key)
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }

      // 可以添加更多清理规则...
    }

    keysToDelete.forEach(key => {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          stats.freedSpace += new Blob([data]).size
        }
        localStorage.removeItem(key)
        stats.deletedKeys++
      } catch (error) {
        stats.errors.push(`删除 ${key} 失败: ${error}`)
      }
    })

    console.log(`🗑️ 清理过期数据: 删除 ${stats.deletedKeys} 个key，释放约 ${(stats.freedSpace / 1024).toFixed(2)} KB`)
  } catch (error) {
    stats.errors.push(`清理过期数据失败: ${error}`)
  }

  return stats
}

/**
 * 获取localStorage使用情况
 */
export function getStorageUsage(): {
  totalSize: number
  itemCount: number
  topKeys: Array<{ key: string; size: number }>
} {
  let totalSize = 0
  const items: Array<{ key: string; size: number }> = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    const value = localStorage.getItem(key)
    if (value) {
      const size = new Blob([value]).size
      totalSize += size
      items.push({ key, size })
    }
  }

  // 按大小排序，取前10
  const topKeys = items
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)

  return {
    totalSize,
    itemCount: localStorage.length,
    topKeys
  }
}

/**
 * 完整的内存清理（包括所有步骤）
 */
export function performFullCleanup(maxMessagesPerChat: number = 1000): {
  messageCleanup: CleanupStats
  expiredCleanup: CleanupStats
  before: ReturnType<typeof getStorageUsage>
  after: ReturnType<typeof getStorageUsage>
} {
  console.log('🧹 开始完整清理...')

  const before = getStorageUsage()
  console.log(`📊 清理前: ${(before.totalSize / 1024 / 1024).toFixed(2)} MB, ${before.itemCount} 个项目`)

  const messageCleanup = cleanupOldMessages(maxMessagesPerChat)
  const expiredCleanup = cleanupExpiredData()

  const after = getStorageUsage()
  console.log(`📊 清理后: ${(after.totalSize / 1024 / 1024).toFixed(2)} MB, ${after.itemCount} 个项目`)
  console.log(`✨ 总共释放约 ${((before.totalSize - after.totalSize) / 1024 / 1024).toFixed(2)} MB`)

  return {
    messageCleanup,
    expiredCleanup,
    before,
    after
  }
}
