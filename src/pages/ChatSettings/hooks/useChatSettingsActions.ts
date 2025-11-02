/**
 * 聊天设置操作 Hook
 * 管理所有设置相关的操作函数
 */

import { useCallback } from 'react'
import { blacklistManager } from '../../../utils/blacklistManager'
import { compressImage } from '../../../utils/imageUtils'

interface ChatSettingsState {
  chatId: string | undefined
  narratorEnabled: boolean
  setNarratorEnabled: (value: boolean) => void
  aiMomentsEnabled: boolean
  setAiMomentsEnabled: (value: boolean) => void
  aiProactiveEnabled: boolean
  setAiProactiveEnabled: (value: boolean) => void
  aiMessageLimit: number
  setAiMessageLimit: (value: number) => void
  memorySummaryInterval: number
  setMemorySummaryInterval: (value: number) => void
  userBubbleColor: string
  setUserBubbleColor: (value: string) => void
  aiBubbleColor: string
  setAiBubbleColor: (value: string) => void
  userBubbleCSS: string
  setUserBubbleCSS: (value: string) => void
  aiBubbleCSS: string
  setAiBubbleCSS: (value: string) => void
  unifiedCSS: string
  setUnifiedCSS: (value: string) => void
  isBlocked: boolean
  setIsBlocked: (value: boolean) => void
  setBackground: (value: string) => void
  setIsUploading: (value: boolean) => void
  setBackgroundPreview: (value: string) => void
  redEnvelopeCover: string
  setRedEnvelopeCover: (value: string) => void
  redEnvelopeIcon: string
  setRedEnvelopeIcon: (value: string) => void
  transferCover: string
  setTransferCover: (value: string) => void
  transferIcon: string
  setTransferIcon: (value: string) => void
}

export const useChatSettingsActions = (state: ChatSettingsState) => {
  const { chatId } = state

  // 切换旁白
  const handleToggleNarrator = useCallback(() => {
    const newValue = !state.narratorEnabled
    state.setNarratorEnabled(newValue)
    localStorage.setItem(`narrator_enabled_${chatId}`, String(newValue))
  }, [chatId, state])

  // 切换AI朋友圈
  const handleToggleAiMoments = useCallback(() => {
    const newValue = !state.aiMomentsEnabled
    state.setAiMomentsEnabled(newValue)
    localStorage.setItem(`ai_moments_enabled_${chatId}`, String(newValue))
  }, [chatId, state])

  // 切换AI主动消息
  const handleToggleAiProactive = useCallback(() => {
    const newValue = !state.aiProactiveEnabled
    state.setAiProactiveEnabled(newValue)
    localStorage.setItem(`ai_proactive_enabled_${chatId}`, String(newValue))
  }, [chatId, state])

  // 更新消息数量限制
  const handleUpdateMessageLimit = useCallback((value: number) => {
    state.setAiMessageLimit(value)
    localStorage.setItem('ai_message_limit', String(value))
  }, [state])

  // 更新记忆总结间隔
  const handleUpdateMemorySummaryInterval = useCallback((value: number) => {
    state.setMemorySummaryInterval(value)
    localStorage.setItem(`memory_summary_interval_${chatId}`, String(value))
  }, [chatId, state])

  // 解析统一CSS
  const handleParseUnifiedCSS = useCallback(() => {
    const css = state.unifiedCSS.trim()
    if (!css) return

    const lines = css.split('\n')
    let userCSS = ''
    let aiCSS = ''
    let currentTarget = ''

    lines.forEach(line => {
      const trimmed = line.trim()
      if (trimmed === '用户:' || trimmed === '用户：') {
        currentTarget = 'user'
      } else if (trimmed === 'AI:' || trimmed === 'AI：') {
        currentTarget = 'ai'
      } else if (trimmed && currentTarget) {
        if (currentTarget === 'user') {
          userCSS += trimmed + '\n'
        } else if (currentTarget === 'ai') {
          aiCSS += trimmed + '\n'
        }
      }
    })

    state.setUserBubbleCSS(userCSS.trim())
    state.setAiBubbleCSS(aiCSS.trim())
  }, [state])

  // 保存气泡设置
  const handleSaveBubbleSettings = useCallback(() => {
    localStorage.setItem(`user_bubble_color_${chatId}`, state.userBubbleColor)
    localStorage.setItem(`ai_bubble_color_${chatId}`, state.aiBubbleColor)
    localStorage.setItem(`user_bubble_css_${chatId}`, state.userBubbleCSS)
    localStorage.setItem(`ai_bubble_css_${chatId}`, state.aiBubbleCSS)
    alert('气泡设置已保存！')
  }, [chatId, state])

  // 重置气泡设置
  const handleResetBubbleSettings = useCallback(() => {
    state.setUserBubbleColor('')
    state.setAiBubbleColor('')
    state.setUserBubbleCSS('')
    state.setAiBubbleCSS('')
    localStorage.removeItem(`user_bubble_color_${chatId}`)
    localStorage.removeItem(`ai_bubble_color_${chatId}`)
    localStorage.removeItem(`user_bubble_css_${chatId}`)
    localStorage.removeItem(`ai_bubble_css_${chatId}`)
    alert('气泡设置已重置！')
  }, [chatId, state])

  // 切换拉黑状态
  const handleToggleBlacklist = useCallback(() => {
    if (!chatId) return
    
    if (state.isBlocked) {
      blacklistManager.unblock('user', chatId)
      state.setIsBlocked(false)
    } else {
      blacklistManager.block('user', chatId)
      state.setIsBlocked(true)
    }
  }, [chatId, state])

  // 上传背景图片
  const handleBackgroundUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    state.setIsUploading(true)
    try {
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8
      })
      
      state.setBackground(compressedDataUrl)
      state.setBackgroundPreview(compressedDataUrl)
      localStorage.setItem(`chat_background_${chatId}`, compressedDataUrl)
    } catch (error) {
      console.error('背景上传失败:', error)
      alert('背景上传失败，请重试')
    } finally {
      state.setIsUploading(false)
    }
  }, [chatId, state])

  // 移除背景
  const handleRemoveBackground = useCallback(() => {
    state.setBackground('')
    state.setBackgroundPreview('')
    localStorage.removeItem(`chat_background_${chatId}`)
  }, [chatId, state])

  // 上传红包封面
  const handleRedEnvelopeCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      state.setRedEnvelopeCover(dataUrl)
      localStorage.setItem(`red_envelope_cover_${chatId}`, dataUrl)
    }
    reader.readAsDataURL(file)
  }, [chatId, state])

  // 移除红包封面
  const handleRemoveRedEnvelopeCover = useCallback(() => {
    state.setRedEnvelopeCover('')
    localStorage.removeItem(`red_envelope_cover_${chatId}`)
  }, [chatId, state])

  // 上传红包图标
  const handleRedEnvelopeIconUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      state.setRedEnvelopeIcon(dataUrl)
      localStorage.setItem(`red_envelope_icon_${chatId}`, dataUrl)
    }
    reader.readAsDataURL(file)
  }, [chatId, state])

  // 移除红包图标
  const handleRemoveRedEnvelopeIcon = useCallback(() => {
    state.setRedEnvelopeIcon('')
    localStorage.removeItem(`red_envelope_icon_${chatId}`)
  }, [chatId, state])

  // 上传转账封面
  const handleTransferCoverUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      state.setTransferCover(dataUrl)
      localStorage.setItem(`transfer_cover_${chatId}`, dataUrl)
    }
    reader.readAsDataURL(file)
  }, [chatId, state])

  // 移除转账封面
  const handleRemoveTransferCover = useCallback(() => {
    state.setTransferCover('')
    localStorage.removeItem(`transfer_cover_${chatId}`)
  }, [chatId, state])

  // 上传转账图标
  const handleTransferIconUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      state.setTransferIcon(dataUrl)
      localStorage.setItem(`transfer_icon_${chatId}`, dataUrl)
    }
    reader.readAsDataURL(file)
  }, [chatId, state])

  // 移除转账图标
  const handleRemoveTransferIcon = useCallback(() => {
    state.setTransferIcon('')
    localStorage.removeItem(`transfer_icon_${chatId}`)
  }, [chatId, state])

  return {
    handleToggleNarrator,
    handleToggleAiMoments,
    handleToggleAiProactive,
    handleUpdateMessageLimit,
    handleUpdateMemorySummaryInterval,
    handleParseUnifiedCSS,
    handleSaveBubbleSettings,
    handleResetBubbleSettings,
    handleToggleBlacklist,
    handleBackgroundUpload,
    handleRemoveBackground,
    handleRedEnvelopeCoverUpload,
    handleRemoveRedEnvelopeCover,
    handleRedEnvelopeIconUpload,
    handleRemoveRedEnvelopeIcon,
    handleTransferCoverUpload,
    handleRemoveTransferCover,
    handleTransferIconUpload,
    handleRemoveTransferIcon
  }
}

