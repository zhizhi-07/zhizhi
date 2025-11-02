/**
 * 消息操作 Hook（长按菜单、撤回、删除等）
 */

import { useState, useRef, useCallback } from 'react'
import { Message } from '../types'

export const useChatMessageActions = () => {
  // 长按消息相关
  const [longPressedMessage, setLongPressedMessage] = useState<Message | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  
  // 批量删除模式
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<number>>(new Set())
  
  // 长按开始
  const handleLongPressStart = useCallback((message: Message, event: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    longPressTimerRef.current = window.setTimeout(() => {
      setLongPressedMessage(message)
      // 触发震动反馈（如果支持）
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 长按500ms触发
  }, [])
  
  // 长按结束
  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])
  
  // 长按取消
  const handleLongPressCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])
  
  // 清除长按消息
  const clearLongPressedMessage = useCallback(() => {
    setLongPressedMessage(null)
  }, [])
  
  // 切换批量删除模式
  const toggleBatchDeleteMode = useCallback(() => {
    setIsBatchDeleteMode(prev => !prev)
    if (isBatchDeleteMode) {
      // 退出批量删除模式时清空选中
      setSelectedMessageIds(new Set())
    }
  }, [isBatchDeleteMode])
  
  // 切换消息选中状态
  const toggleMessageSelection = useCallback((messageId: number) => {
    setSelectedMessageIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }, [])
  
  // 全选消息
  const selectAllMessages = useCallback((messageIds: number[]) => {
    setSelectedMessageIds(new Set(messageIds))
  }, [])
  
  // 清空选中
  const clearSelection = useCallback(() => {
    setSelectedMessageIds(new Set())
  }, [])
  
  // 退出批量删除模式
  const exitBatchDeleteMode = useCallback(() => {
    setIsBatchDeleteMode(false)
    setSelectedMessageIds(new Set())
  }, [])
  
  return {
    // 长按相关
    longPressedMessage,
    setLongPressedMessage,
    longPressTimerRef,
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressCancel,
    clearLongPressedMessage,
    
    // 批量删除相关
    isBatchDeleteMode,
    selectedMessageIds,
    toggleBatchDeleteMode,
    toggleMessageSelection,
    selectAllMessages,
    clearSelection,
    exitBatchDeleteMode
  }
}

