/**
 * 聊天气泡样式管理 Hook
 */

import { useState, useEffect } from 'react'
import { storageObserver } from '../../../utils/storageObserver'

export const useChatBubbles = (chatId: string | undefined) => {
  // 用户气泡颜色
  const [userBubbleColor, setUserBubbleColor] = useState(() => {
    if (!chatId) return '#FFD4E5'
    return localStorage.getItem(`user_bubble_color_${chatId}`) || 
           localStorage.getItem('user_bubble_color') || 
           '#FFD4E5'
  })
  
  // AI 气泡颜色
  const [aiBubbleColor, setAiBubbleColor] = useState(() => {
    if (!chatId) return '#FFFFFF'
    return localStorage.getItem(`ai_bubble_color_${chatId}`) || 
           localStorage.getItem('ai_bubble_color') || 
           '#FFFFFF'
  })
  
  // 用户气泡 CSS
  const [userBubbleCSS, setUserBubbleCSS] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`user_bubble_css_${chatId}`) || 
           localStorage.getItem('user_bubble_css') || 
           ''
  })
  
  // AI 气泡 CSS
  const [aiBubbleCSS, setAiBubbleCSS] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`ai_bubble_css_${chatId}`) || 
           localStorage.getItem('ai_bubble_css') || 
           ''
  })
  
  // 红包封面
  const [redEnvelopeCover, setRedEnvelopeCover] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`red_envelope_cover_${chatId}`) || ''
  })
  
  // 红包图标
  const [redEnvelopeIcon, setRedEnvelopeIcon] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`red_envelope_icon_${chatId}`) || ''
  })
  
  // 转账封面
  const [transferCover, setTransferCover] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`transfer_cover_${chatId}`) || ''
  })
  
  // 转账图标
  const [transferIcon, setTransferIcon] = useState(() => {
    if (!chatId) return ''
    return localStorage.getItem(`transfer_icon_${chatId}`) || ''
  })
  
  // 监听 localStorage 变化，实时更新气泡样式和封面
  useEffect(() => {
    if (!chatId) return
    
    const unsubscribers = [
      // 用户气泡颜色
      storageObserver.observe(`user_bubble_color_${chatId}`, (value) => {
        setUserBubbleColor(value || localStorage.getItem('user_bubble_color') || '#FFD4E5')
      }),
      storageObserver.observe('user_bubble_color', (value) => {
        if (!localStorage.getItem(`user_bubble_color_${chatId}`)) {
          setUserBubbleColor(value || '#FFD4E5')
        }
      }),
      
      // AI 气泡颜色
      storageObserver.observe(`ai_bubble_color_${chatId}`, (value) => {
        setAiBubbleColor(value || localStorage.getItem('ai_bubble_color') || '#FFFFFF')
      }),
      storageObserver.observe('ai_bubble_color', (value) => {
        if (!localStorage.getItem(`ai_bubble_color_${chatId}`)) {
          setAiBubbleColor(value || '#FFFFFF')
        }
      }),
      
      // 用户气泡 CSS
      storageObserver.observe(`user_bubble_css_${chatId}`, (value) => {
        setUserBubbleCSS(value || localStorage.getItem('user_bubble_css') || '')
      }),
      storageObserver.observe('user_bubble_css', (value) => {
        if (!localStorage.getItem(`user_bubble_css_${chatId}`)) {
          setUserBubbleCSS(value || '')
        }
      }),
      
      // AI 气泡 CSS
      storageObserver.observe(`ai_bubble_css_${chatId}`, (value) => {
        setAiBubbleCSS(value || localStorage.getItem('ai_bubble_css') || '')
      }),
      storageObserver.observe('ai_bubble_css', (value) => {
        if (!localStorage.getItem(`ai_bubble_css_${chatId}`)) {
          setAiBubbleCSS(value || '')
        }
      }),
      
      // 红包封面和图标
      storageObserver.observe(`red_envelope_cover_${chatId}`, (value) => {
        setRedEnvelopeCover(value || '')
      }),
      storageObserver.observe(`red_envelope_icon_${chatId}`, (value) => {
        setRedEnvelopeIcon(value || '')
      }),
      
      // 转账封面和图标
      storageObserver.observe(`transfer_cover_${chatId}`, (value) => {
        setTransferCover(value || '')
      }),
      storageObserver.observe(`transfer_icon_${chatId}`, (value) => {
        setTransferIcon(value || '')
      })
    ]
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [chatId])
  
  return {
    userBubbleColor,
    aiBubbleColor,
    userBubbleCSS,
    aiBubbleCSS,
    redEnvelopeCover,
    redEnvelopeIcon,
    transferCover,
    transferIcon
  }
}

