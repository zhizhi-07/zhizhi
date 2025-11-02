/**
 * Token 统计管理 Hook
 */

import { useState, useCallback } from 'react'
import { TokenStats, LorebookEntry } from '../types'

export const useChatTokenStats = () => {
  // Token 统计数据
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    total: 0,
    remaining: 0,
    percentage: 0,
    systemPrompt: 0,
    lorebook: 0,
    messages: 0
  })
  
  // 响应时间（毫秒）
  const [responseTime, setResponseTime] = useState(0)
  
  // Lorebook 条目
  const [lorebookEntries, setLorebookEntries] = useState<LorebookEntry[]>([])
  
  // 更新Token统计
  const updateTokenStats = useCallback((stats: Partial<TokenStats>) => {
    setTokenStats(prev => ({ ...prev, ...stats }))
  }, [])
  
  // 重置Token统计
  const resetTokenStats = useCallback(() => {
    setTokenStats({
      total: 0,
      remaining: 0,
      percentage: 0,
      systemPrompt: 0,
      lorebook: 0,
      messages: 0
    })
    setResponseTime(0)
    setLorebookEntries([])
  }, [])
  
  return {
    tokenStats,
    responseTime,
    lorebookEntries,
    setTokenStats,
    setResponseTime,
    setLorebookEntries,
    updateTokenStats,
    resetTokenStats
  }
}

