/**
 * 后台AI回复系统
 * 允许用户退出聊天界面后，AI仍然可以继续生成回复
 */

interface PendingAIReply {
  characterId: string
  requestTime: number
  isProcessing: boolean
}

// 存储正在处理的AI回复
const pendingReplies: Map<string, PendingAIReply> = new Map()

/**
 * 标记AI正在回复
 */
export function markAIReplying(characterId: string) {
  pendingReplies.set(characterId, {
    characterId,
    requestTime: Date.now(),
    isProcessing: true
  })
  localStorage.setItem('ai_replying', JSON.stringify(Array.from(pendingReplies.entries())))
}

/**
 * 标记AI回复完成
 */
export function markAIReplyComplete(characterId: string) {
  pendingReplies.delete(characterId)
  localStorage.setItem('ai_replying', JSON.stringify(Array.from(pendingReplies.entries())))
}

/**
 * 检查AI是否正在回复
 */
export function isAIReplying(characterId: string): boolean {
  return pendingReplies.has(characterId)
}

/**
 * 恢复待处理的AI回复状态（页面刷新后）
 */
export function restorePendingReplies() {
  const saved = localStorage.getItem('ai_replying')
  if (saved) {
    try {
      const entries = JSON.parse(saved) as Array<[string, PendingAIReply]>
      entries.forEach(([key, value]) => {
        // 只恢复5分钟内的待处理回复
        if (Date.now() - value.requestTime < 5 * 60 * 1000) {
          pendingReplies.set(key, value)
        }
      })
    } catch (e) {
      console.error('恢复AI回复状态失败:', e)
    }
  }
}

/**
 * 获取所有待处理的AI回复
 */
export function getAllPendingReplies(): string[] {
  return Array.from(pendingReplies.keys())
}

// 页面加载时恢复状态
if (typeof window !== 'undefined') {
  restorePendingReplies()
}
