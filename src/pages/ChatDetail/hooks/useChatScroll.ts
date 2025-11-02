/**
 * 聊天滚动和分页加载 Hook
 */

import { useState, useEffect, useRef, useCallback } from 'react'

export const useChatScroll = (totalMessageCount: number, chatId: string | undefined) => {
  // 显示的消息数量（分页加载）
  const [displayCount, setDisplayCount] = useState(30)
  
  // 是否正在加载更多
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // 消息容器ref
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 记录上一次的滚动高度（用于保持滚动位置）
  const prevScrollHeightRef = useRef(0)
  
  // 是否是首次加载
  const isFirstLoadRef = useRef(true)
  
  // 记录上一次的消息数量
  const prevMessageCountRef = useRef(0)
  
  // 是否应该平滑滚动
  const shouldSmoothScrollRef = useRef(true)
  
  // 滚动到底部
  const scrollToBottom = useCallback((smooth: boolean = false) => {
    const container = messagesContainerRef.current
    if (!container) return
    
    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }, [])
  
  // 处理滚动事件（检测是否需要加载更多）
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || isLoadingMore) return
    
    // 检测是否滚动到顶部（距离顶部小于100px）
    if (container.scrollTop < 100 && displayCount < totalMessageCount) {
      setIsLoadingMore(true)
      prevScrollHeightRef.current = container.scrollHeight
      
      // 加载更多30条
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + 30, totalMessageCount))
        setIsLoadingMore(false)
      }, 100)
    }
  }, [isLoadingMore, displayCount, totalMessageCount])
  
  // 监听滚动事件
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // 加载更多后保持滚动位置
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    // 如果是加载更多（不是首次），保持滚动位置
    if (prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current
      if (scrollDiff > 0) {
        container.scrollTop = scrollDiff
      }
      prevScrollHeightRef.current = 0
    } else {
      // 首次加载或切换聊天后，强制滚动到底部
      setTimeout(() => {
        container.scrollTop = container.scrollHeight
      }, 100)
    }
  }, [displayCount])
  
  // 切换聊天时重置displayCount
  useEffect(() => {
    setDisplayCount(30)
    isFirstLoadRef.current = true
    prevMessageCountRef.current = 0
    
    // 立即尝试滚动一次
    setTimeout(() => {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }, 200)
  }, [chatId])
  
  // 新消息到达时自动滚动到底部
  useEffect(() => {
    if (totalMessageCount === 0) return
    
    const container = messagesContainerRef.current
    if (!container) return
    
    // 检查是否在底部附近（距离底部小于200px）
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200
    
    // 如果是首次加载或在底部附近，自动滚动到底部
    if (isFirstLoadRef.current || isNearBottom) {
      setTimeout(() => {
        scrollToBottom(shouldSmoothScrollRef.value)
      }, 100)
      
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false
      }
    }
    
    prevMessageCountRef.current = totalMessageCount
  }, [totalMessageCount, scrollToBottom])
  
  return {
    displayCount,
    isLoadingMore,
    messagesContainerRef,
    messagesEndRef,
    scrollToBottom,
    shouldSmoothScrollRef
  }
}

