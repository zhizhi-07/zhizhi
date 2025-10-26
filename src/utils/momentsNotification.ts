/**
 * 朋友圈通知系统
 * 记录AI对朋友圈的点赞、评论等互动
 */

export interface MomentNotification {
  id: string
  type: 'like' | 'comment' | 'new_moment'
  momentId: string
  momentContent: string
  fromUserId: string
  fromUserName: string
  fromUserAvatar: string
  comment?: string
  timestamp: number
  read: boolean
}

// 获取所有通知
export const getMomentNotifications = (): MomentNotification[] => {
  try {
    const data = localStorage.getItem('moment_notifications')
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('读取朋友圈通知失败:', error)
    return []
  }
}

// 添加通知
export const addMomentNotification = (notification: Omit<MomentNotification, 'id' | 'timestamp' | 'read'>): void => {
  try {
    const notifications = getMomentNotifications()
    const newNotification: MomentNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
    }
    
    // 最多保留100条通知
    const updatedNotifications = [newNotification, ...notifications].slice(0, 100)
    localStorage.setItem('moment_notifications', JSON.stringify(updatedNotifications))
    console.log('📬 新朋友圈通知:', notification.type, 'from', notification.fromUserName)
  } catch (error) {
    console.error('添加朋友圈通知失败:', error)
  }
}

// 获取未读通知数量
export const getUnreadNotificationCount = (): number => {
  const notifications = getMomentNotifications()
  return notifications.filter(n => !n.read).length
}

// 标记通知为已读
export const markNotificationAsRead = (notificationId: string): void => {
  try {
    const notifications = getMomentNotifications()
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    )
    localStorage.setItem('moment_notifications', JSON.stringify(updated))
  } catch (error) {
    console.error('标记通知已读失败:', error)
  }
}

// 标记所有通知为已读
export const markAllNotificationsAsRead = (): void => {
  try {
    const notifications = getMomentNotifications()
    const updated = notifications.map(n => ({ ...n, read: true }))
    localStorage.setItem('moment_notifications', JSON.stringify(updated))
  } catch (error) {
    console.error('标记所有通知已读失败:', error)
  }
}

// 清除所有通知
export const clearAllNotifications = (): void => {
  try {
    localStorage.removeItem('moment_notifications')
  } catch (error) {
    console.error('清除通知失败:', error)
  }
}
