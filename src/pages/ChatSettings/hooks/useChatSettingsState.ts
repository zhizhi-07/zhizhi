/**
 * 聊天设置状态管理 Hook
 * 管理所有设置相关的状态
 */

import { useState, useEffect } from 'react'
import { useBackground } from '../../../context/BackgroundContext'
import { blacklistManager } from '../../../utils/blacklistManager'

export const useChatSettingsState = (chatId: string | undefined) => {
  // 旁白设置
  const [narratorEnabled, setNarratorEnabled] = useState(() => {
    const saved = localStorage.getItem(`narrator_enabled_${chatId}`)
    return saved === 'true'
  })

  // AI朋友圈设置
  const [aiMomentsEnabled, setAiMomentsEnabled] = useState(() => {
    const saved = localStorage.getItem(`ai_moments_enabled_${chatId}`)
    return saved === 'true'
  })

  // AI主动消息设置
  const [aiProactiveEnabled, setAiProactiveEnabled] = useState(() => {
    const saved = localStorage.getItem(`ai_proactive_enabled_${chatId}`)
    return saved === 'true'
  })

  // AI读取消息数量设置
  const [aiMessageLimit, setAiMessageLimit] = useState(() => {
    const saved = localStorage.getItem('ai_message_limit')
    return saved ? parseInt(saved) : 15
  })

  // 记忆总结间隔设置
  const [memorySummaryInterval, setMemorySummaryInterval] = useState(() => {
    const saved = localStorage.getItem(`memory_summary_interval_${chatId}`)
    return saved ? parseInt(saved) : 30
  })

  // 气泡设置
  const [userBubbleColor, setUserBubbleColor] = useState(() => {
    return localStorage.getItem(`user_bubble_color_${chatId}`) || ''
  })
  
  const [aiBubbleColor, setAiBubbleColor] = useState(() => {
    return localStorage.getItem(`ai_bubble_color_${chatId}`) || ''
  })
  
  const [userBubbleCSS, setUserBubbleCSS] = useState(() => {
    return localStorage.getItem(`user_bubble_css_${chatId}`) || ''
  })
  
  const [aiBubbleCSS, setAiBubbleCSS] = useState(() => {
    return localStorage.getItem(`ai_bubble_css_${chatId}`) || ''
  })
  
  const [showBubbleSettings, setShowBubbleSettings] = useState(false)
  const [unifiedCSS, setUnifiedCSS] = useState('')

  // 拉黑状态
  const [isBlocked, setIsBlocked] = useState(() => {
    if (!chatId) return false
    const status = blacklistManager.getBlockStatus('user', chatId)
    return status.blockedByMe
  })

  // 背景相关
  const { background, setBackground } = useBackground()
  const [isUploading, setIsUploading] = useState(false)
  const [backgroundPreview, setBackgroundPreview] = useState(background)

  // 红包和转账封面
  const [redEnvelopeCover, setRedEnvelopeCover] = useState(() => {
    return localStorage.getItem(`red_envelope_cover_${chatId}`) || ''
  })
  
  const [redEnvelopeIcon, setRedEnvelopeIcon] = useState(() => {
    return localStorage.getItem(`red_envelope_icon_${chatId}`) || ''
  })
  
  const [transferCover, setTransferCover] = useState(() => {
    return localStorage.getItem(`transfer_cover_${chatId}`) || ''
  })
  
  const [transferIcon, setTransferIcon] = useState(() => {
    return localStorage.getItem(`transfer_icon_${chatId}`) || ''
  })

  // 同步背景预览
  useEffect(() => {
    setBackgroundPreview(background)
  }, [background])

  return {
    // 旁白设置
    narratorEnabled,
    setNarratorEnabled,
    
    // AI设置
    aiMomentsEnabled,
    setAiMomentsEnabled,
    aiProactiveEnabled,
    setAiProactiveEnabled,
    aiMessageLimit,
    setAiMessageLimit,
    
    // 记忆设置
    memorySummaryInterval,
    setMemorySummaryInterval,
    
    // 气泡设置
    userBubbleColor,
    setUserBubbleColor,
    aiBubbleColor,
    setAiBubbleColor,
    userBubbleCSS,
    setUserBubbleCSS,
    aiBubbleCSS,
    setAiBubbleCSS,
    showBubbleSettings,
    setShowBubbleSettings,
    unifiedCSS,
    setUnifiedCSS,
    
    // 拉黑状态
    isBlocked,
    setIsBlocked,
    
    // 背景相关
    background,
    setBackground,
    isUploading,
    setIsUploading,
    backgroundPreview,
    setBackgroundPreview,
    
    // 红包转账封面
    redEnvelopeCover,
    setRedEnvelopeCover,
    redEnvelopeIcon,
    setRedEnvelopeIcon,
    transferCover,
    setTransferCover,
    transferIcon,
    setTransferIcon
  }
}

