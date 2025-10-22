// 热梗使用追踪系统

export interface MemeUsage {
  memeId: number
  count: number
  lastUsed: number
}

/**
 * 记录热梗使用
 */
export function trackMemeUsage(memeId: number): void {
  try {
    const usages = getMemeUsages()
    const existing = usages.find(u => u.memeId === memeId)

    if (existing) {
      existing.count++
      existing.lastUsed = Date.now()
    } else {
      usages.push({
        memeId,
        count: 1,
        lastUsed: Date.now()
      })
    }

    localStorage.setItem('meme_usages', JSON.stringify(usages))
    console.log(`🔥 热梗使用记录: ID ${memeId}`)
  } catch (error) {
    console.error('记录热梗使用失败:', error)
  }
}

/**
 * 获取所有热梗使用记录
 */
export function getMemeUsages(): MemeUsage[] {
  try {
    const saved = localStorage.getItem('meme_usages')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('读取热梗使用记录失败:', error)
  }
  return []
}

/**
 * 获取指定热梗的使用次数
 */
export function getMemeUsageCount(memeId: number): number {
  const usages = getMemeUsages()
  const usage = usages.find(u => u.memeId === memeId)
  return usage?.count || 0
}

/**
 * 获取最常使用的热梗
 */
export function getTopUsedMemes(limit: number = 10): MemeUsage[] {
  const usages = getMemeUsages()
  return usages
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * 获取最近使用的热梗
 */
export function getRecentlyUsedMemes(limit: number = 10): MemeUsage[] {
  const usages = getMemeUsages()
  return usages
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, limit)
}

/**
 * 清空热梗使用记录
 */
export function clearMemeUsages(): void {
  try {
    localStorage.removeItem('meme_usages')
  } catch (error) {
    console.error('清空热梗使用记录失败:', error)
  }
}

/**
 * 从AI回复中检测并记录使用的热梗
 */
export function detectAndTrackMemesInResponse(response: string, memes: any[]): void {
  memes.forEach(meme => {
    // 检查回复中是否包含这个梗
    if (response.includes(meme.梗)) {
      trackMemeUsage(meme.id)
    }
  })
}
