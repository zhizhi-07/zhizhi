/**
 * 时间处理工具函数
 */

import { Message } from '../types'

/**
 * 判断是否应该显示时间分隔线
 * 规则：两条消息间隔超过5分钟就显示
 */
export const shouldShowTimeDivider = (currentMsg: Message, prevMsg: Message | null): boolean => {
  if (!prevMsg || !currentMsg.timestamp || !prevMsg.timestamp) {
    return false
  }
  
  const timeDiff = currentMsg.timestamp - prevMsg.timestamp
  const FIVE_MINUTES = 5 * 60 * 1000
  
  return timeDiff > FIVE_MINUTES
}

/**
 * 格式化时间戳为显示文本
 * 规则：
 * - 今天：显示 HH:MM
 * - 昨天：显示 "昨天 HH:MM"
 * - 今年：显示 "MM月DD日 HH:MM"
 * - 往年：显示 "YYYY年MM月DD日 HH:MM"
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  const isThisYear = date.getFullYear() === now.getFullYear()
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString()
  const day = date.getDate().toString()
  const year = date.getFullYear()
  
  if (isToday) {
    return `${hours}:${minutes}`
  } else if (isYesterday) {
    return `昨天 ${hours}:${minutes}`
  } else if (isThisYear) {
    return `${month}月${day}日 ${hours}:${minutes}`
  } else {
    return `${year}年${month}月${day}日 ${hours}:${minutes}`
  }
}

/**
 * 获取当前时间的 HH:MM 格式
 */
export const getCurrentTime = (): string => {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 获取当前时间戳（毫秒）
 */
export const getCurrentTimestamp = (): number => {
  return Date.now()
}

/**
 * 格式化通话时长
 * @param seconds 秒数
 * @returns 格式化的时长字符串，如 "1:23" 或 "12:34"
 */
export const formatCallDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

