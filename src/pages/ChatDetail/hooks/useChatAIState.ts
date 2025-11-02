/**
 * AI 状态管理 Hook
 * 管理 AI 打字状态、回复触发等
 */

import { useState, useCallback } from 'react'

export const useChatAIState = () => {
  // AI 是否正在输入
  const [isAiTyping, setIsAiTyping] = useState(false)
  
  // 开始 AI 输入
  const startAITyping = useCallback(() => {
    setIsAiTyping(true)
  }, [])
  
  // 停止 AI 输入
  const stopAITyping = useCallback(() => {
    setIsAiTyping(false)
  }, [])
  
  return {
    isAiTyping,
    setIsAiTyping,
    startAITyping,
    stopAITyping
  }
}

