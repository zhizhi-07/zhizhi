/**
 * 聊天背景管理 Hook
 */

import { useState, useEffect, CSSProperties } from 'react'
import { useBackground } from '../../../context/BackgroundContext'
import { storageObserver } from '../../../utils/storageObserver'

export const useChatBackground = (chatId: string | undefined) => {
  const { background: globalBackground } = useBackground()
  
  // 读取当前聊天的专属背景
  const [chatBackground, setChatBackground] = useState(() => {
    return chatId ? localStorage.getItem(`chat_background_${chatId}`) || '' : ''
  })
  
  // 检查是否应用全局背景到所有界面
  const [applyToAllPages, setApplyToAllPages] = useState(() => {
    const saved = localStorage.getItem('apply_background_to_all_pages')
    return saved === 'true'
  })
  
  // 监听聊天背景变化
  useEffect(() => {
    if (!chatId) return
    return storageObserver.observe(`chat_background_${chatId}`, (value) => {
      setChatBackground(value || '')
    })
  }, [chatId])
  
  // 监听设置变化
  useEffect(() => {
    return storageObserver.observe('apply_background_to_all_pages', (value) => {
      setApplyToAllPages(value === 'true')
    })
  }, [])
  
  // 获取当前聊天的背景样式
  const getBackgroundStyle = (): CSSProperties => {
    // 优先级：聊天专属背景 > 全局背景（如果勾选） > 默认
    let bg = chatBackground
    if (!bg && applyToAllPages) {
      bg = globalBackground
    }
    
    if (!bg) {
      return {
        background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
      }
    }
    
    if (bg.startsWith('http') || bg.startsWith('data:image')) {
      return {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    
    return {
      background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
    }
  }
  
  // 获取当前背景（用于传递给子组件）
  const background = chatBackground || (applyToAllPages ? globalBackground : '')
  
  return {
    chatBackground,
    applyToAllPages,
    getBackgroundStyle,
    background
  }
}

