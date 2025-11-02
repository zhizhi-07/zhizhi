/**
 * 聊天输入框状态管理 Hook
 */

import { useState, useCallback } from 'react'
import { Message } from '../types'

export const useChatInput = () => {
  // 输入框内容
  const [inputValue, setInputValue] = useState('')
  
  // 引用的消息
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null)
  
  // 正在编辑的消息
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editingContent, setEditingContent] = useState('')
  
  // 清空输入框
  const clearInput = useCallback(() => {
    setInputValue('')
  }, [])
  
  // 设置引用消息
  const setQuote = useCallback((message: Message | null) => {
    setQuotedMessage(message)
  }, [])
  
  // 取消引用
  const cancelQuote = useCallback(() => {
    setQuotedMessage(null)
  }, [])
  
  // 开始编辑消息
  const startEdit = useCallback((message: Message) => {
    setEditingMessage(message)
    setEditingContent(message.content)
    setInputValue(message.content)
  }, [])
  
  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditingMessage(null)
    setEditingContent('')
    setInputValue('')
  }, [])
  
  // 完成编辑
  const finishEdit = useCallback(() => {
    const message = editingMessage
    const content = editingContent
    setEditingMessage(null)
    setEditingContent('')
    setInputValue('')
    return { message, content }
  }, [editingMessage, editingContent])
  
  return {
    // 状态
    inputValue,
    quotedMessage,
    editingMessage,
    editingContent,
    
    // 设置器
    setInputValue,
    setEditingContent,
    
    // 方法
    clearInput,
    setQuote,
    cancelQuote,
    startEdit,
    cancelEdit,
    finishEdit
  }
}

