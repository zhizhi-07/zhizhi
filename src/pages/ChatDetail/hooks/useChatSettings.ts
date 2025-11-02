/**
 * 聊天设置管理 Hook
 */

import { useState, useEffect } from 'react'
import { storageObserver } from '../../../utils/storageObserver'

export const useChatSettings = (chatId: string | undefined) => {
  // 旁白设置
  const [enableNarration, setEnableNarration] = useState(() => {
    if (!chatId) return false
    const saved = localStorage.getItem(`narrator_enabled_${chatId}`)
    return saved === 'true'
  })
  
  // AI读取消息数量设置
  const [aiMessageLimit, setAiMessageLimit] = useState(() => {
    const saved = localStorage.getItem('ai_message_limit')
    return saved ? parseInt(saved) : 15
  })
  
  // AI可以直接主动打电话，不需要设置开关
  const enableProactiveCalls = true
  
  // 情侣空间激活状态
  const [hasCoupleSpaceActive, setHasCoupleSpaceActive] = useState(false)
  
  // 监听旁白设置变化
  useEffect(() => {
    if (!chatId) return
    
    const unsubscribers = [
      storageObserver.observe(`narrator_enabled_${chatId}`, (value) => {
        setEnableNarration(value === 'true')
      })
    ]
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [chatId])
  
  // 检查情侣空间状态
  useEffect(() => {
    if (!chatId) return
    
    const checkCoupleSpace = () => {
      const coupleSpaceData = localStorage.getItem('couple_space_data')
      if (coupleSpaceData) {
        try {
          const data = JSON.parse(coupleSpaceData)
          const isActive = data.characterId === chatId && data.status === 'active'
          setHasCoupleSpaceActive(isActive)
        } catch (error) {
          console.error('解析情侣空间数据失败:', error)
        }
      }
    }
    
    checkCoupleSpace()
    
    // 监听情侣空间数据变化
    return storageObserver.observe('couple_space_data', () => {
      checkCoupleSpace()
    })
  }, [chatId])
  
  return {
    enableNarration,
    setEnableNarration,
    aiMessageLimit,
    setAiMessageLimit,
    enableProactiveCalls,
    hasCoupleSpaceActive,
    setHasCoupleSpaceActive
  }
}

