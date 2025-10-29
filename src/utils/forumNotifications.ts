/**
 * 论坛通知管理器
 * 
 * 使用现有的 IOSNotification 组件显示论坛通知
 * 
 * @module utils/forumNotifications
 */

export interface ForumNotificationData {
  title: string
  subtitle?: string
  message: string
  type: 'init' | 'comment' | 'like' | 'follow' | 'dm' | 'system'
  targetId?: string // 帖子ID、评论ID等
}

// 通知队列
let notificationQueue: ForumNotificationData[] = []
let notificationCallback: ((notification: ForumNotificationData) => void) | null = null

/**
 * 注册通知回调
 */
export function registerNotificationCallback(callback: (notification: ForumNotificationData) => void) {
  notificationCallback = callback
  
  // 处理队列中的通知
  while (notificationQueue.length > 0) {
    const notification = notificationQueue.shift()
    if (notification) {
      callback(notification)
    }
  }
}

/**
 * 显示通知
 */
function showNotification(notification: ForumNotificationData) {
  if (notificationCallback) {
    notificationCallback(notification)
  } else {
    // 如果回调未注册，加入队列
    notificationQueue.push(notification)
  }
}

/**
 * 论坛初始化通知
 */
export function notifyForumInitStart() {
  showNotification({
    title: '论坛',
    subtitle: '正在初始化',
    message: '正在生成论坛内容，请稍候...',
    type: 'init'
  })
}

export function notifyForumInitProgress(message: string) {
  showNotification({
    title: '论坛',
    subtitle: '初始化中',
    message: message,
    type: 'init'
  })
}

export function notifyForumInitComplete() {
  showNotification({
    title: '论坛',
    subtitle: '初始化完成',
    message: '论坛已准备就绪，快去看看吧！',
    type: 'system'
  })
}

/**
 * 评论通知
 */
export function notifyNewComment(userName: string, content: string, postId: string) {
  showNotification({
    title: '论坛消息',
    subtitle: `${userName} 评论了你的帖子`,
    message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
    type: 'comment',
    targetId: postId
  })
}

/**
 * 点赞通知
 */
export function notifyNewLike(userName: string, postId: string) {
  showNotification({
    title: '论坛消息',
    subtitle: `${userName} 赞了你的帖子`,
    message: '快去看看吧~',
    type: 'like',
    targetId: postId
  })
}

/**
 * 关注通知
 */
export function notifyNewFollow(userName: string) {
  showNotification({
    title: '论坛消息',
    subtitle: `${userName} 关注了你`,
    message: '又多了一个新朋友！',
    type: 'follow'
  })
}

/**
 * 私信通知
 */
export function notifyNewDirectMessage(userName: string, content: string) {
  showNotification({
    title: '论坛私信',
    subtitle: `${userName} 给你发了私信`,
    message: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
    type: 'dm'
  })
}

/**
 * 多人互动通知（聚合）
 */
export function notifyMultipleInteractions(userNames: string[], type: 'comment' | 'like', count: number) {
  const actionText = type === 'comment' ? '评论了' : '赞了'
  const displayNames = userNames.slice(0, 2).join('、')
  const message = count > 2 
    ? `${displayNames}等${count}人${actionText}你的帖子`
    : `${displayNames}${actionText}你的帖子`
  
  showNotification({
    title: '论坛消息',
    subtitle: `${count}条新互动`,
    message: message,
    type: type
  })
}

/**
 * 系统通知
 */
export function notifySystem(message: string) {
  showNotification({
    title: '论坛',
    message: message,
    type: 'system'
  })
}
