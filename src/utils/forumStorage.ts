/**
 * 论坛功能 - 数据存储工具
 * 
 * 封装所有与论坛数据持久化相关的操作
 * 使用 localStorage 作为存储介质
 * 
 * @module utils/forumStorage
 */

import type { 
  ForumPost, 
  ForumComment, 
  ForumDraft, 
  ForumTopic,
  ForumNotification,
  ForumDirectMessage,
  PostQueryOptions,
  CommentQueryOptions,
  PaginatedResult,
  PostSortType
} from '../types/forum'
import { notifyNewComment, notifyNewLike, notifyNewFollow, notifyNewDirectMessage } from './forumNotifications'

// ==================== 存储键名常量 ====================

const STORAGE_KEYS = {
  POSTS: 'forum_posts',                    // 帖子列表
  COMMENTS: 'forum_comments',              // 评论列表
  DRAFTS: 'forum_drafts',                  // 草稿箱
  FAVORITES: 'forum_favorites',            // 收藏的帖子ID
  LIKES: 'forum_likes',                    // 点赞的帖子ID
  COMMENT_LIKES: 'forum_comment_likes',    // 点赞的评论ID
  TOPICS: 'forum_topics',                  // 话题列表
  FOLLOWING_TOPICS: 'forum_following_topics', // 关注的话题ID
  FOLLOWING_USERS: 'forum_following_users',   // 关注的用户ID
  NOTIFICATIONS: 'forum_notifications',    // 通知列表
  DIRECT_MESSAGES: 'forum_direct_messages',// 私信列表
  USER_POSTS: 'forum_user_posts',          // 用户发帖记录
} as const

// ==================== 工具函数 ====================

/**
 * 安全地解析JSON
 */
function safeJSONParse<T>(str: string | null, defaultValue: T): T {
  if (!str) return defaultValue
  try {
    return JSON.parse(str) as T
  } catch (error) {
    console.error('JSON解析失败:', error)
    return defaultValue
  }
}

/**
 * 安全地保存JSON
 */
function safeJSONSave(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('保存数据失败:', error)
    return false
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ==================== 帖子相关操作 ====================

/**
 * 获取所有帖子
 */
export function getPosts(): ForumPost[] {
  return safeJSONParse<ForumPost[]>(
    localStorage.getItem(STORAGE_KEYS.POSTS),
    []
  )
}

/**
 * 保存所有帖子
 */
export function savePosts(posts: ForumPost[]): boolean {
  return safeJSONSave(STORAGE_KEYS.POSTS, posts)
}

/**
 * 获取单个帖子
 */
export function getPostById(id: string): ForumPost | null {
  const posts = getPosts()
  return posts.find(post => post.id === id) || null
}

/**
 * 添加帖子
 */
export function addPost(post: Omit<ForumPost, 'id' | 'timestamp'>): ForumPost {
  const posts = getPosts()
  const newPost: ForumPost = {
    ...post,
    id: generateId(),
    timestamp: Date.now(),
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    isLiked: false,
    isFavorited: false,
  }
  posts.unshift(newPost) // 新帖子在最前面
  savePosts(posts)
  
  // 增加帖子数统计
  incrementPosts()
  
  // 模拟社交互动（延迟触发）
  setTimeout(() => {
    // 30%概率获得新粉丝
    if (Math.random() < 0.3) {
      const followerCount = Math.floor(Math.random() * 2) + 1 // 1-2个新粉丝
      incrementFollowers(followerCount)
      for (let i = 0; i < followerCount; i++) {
        createNewFollowerNotification()
      }
    }
    
    // 50%概率获得点赞通知
    if (Math.random() < 0.5) {
      const likeCount = Math.floor(Math.random() * 50) + 10
      incrementLikes(likeCount)
      createAggregatedLikeNotification(newPost.id)
    }
  }, Math.random() * 3000 + 2000) // 2-5秒后
  
  return newPost
}

/**
 * 更新帖子
 */
export function updatePost(id: string, updates: Partial<ForumPost>): boolean {
  const posts = getPosts()
  const index = posts.findIndex(post => post.id === id)
  if (index === -1) return false
  
  posts[index] = { ...posts[index], ...updates }
  return savePosts(posts)
}

/**
 * 删除帖子
 */
export function deletePost(id: string): boolean {
  const posts = getPosts()
  const filtered = posts.filter(post => post.id !== id)
  if (filtered.length === posts.length) return false
  
  // 同时删除相关评论
  const comments = getComments()
  const filteredComments = comments.filter(comment => comment.postId !== id)
  saveComments(filteredComments)
  
  return savePosts(filtered)
}

/**
 * 查询帖子（支持过滤和排序）
 */
export function queryPosts(options: PostQueryOptions = {}): PaginatedResult<ForumPost> {
  let posts = getPosts()
  
  // 过滤
  if (options.authorId) {
    posts = posts.filter(post => post.authorId === options.authorId)
  }
  
  if (options.tag) {
    posts = posts.filter(post => 
      post.tags && post.tags.includes(options.tag!)
    )
  }
  
  if (options.keyword) {
    const keyword = options.keyword.toLowerCase()
    posts = posts.filter(post => 
      post.content.toLowerCase().includes(keyword) ||
      post.authorName.toLowerCase().includes(keyword)
    )
  }
  
  // 排序
  if (options.sortBy === 'hot') {
    posts.sort((a, b) => 
      (b.likeCount + b.commentCount * 2) - (a.likeCount + a.commentCount * 2)
    )
  } else if (options.sortBy === 'like') {
    posts.sort((a, b) => b.likeCount - a.likeCount)
  } else {
    // 默认按时间排序
    posts.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  // 分页
  const limit = options.limit || 20
  const offset = options.offset || 0
  const items = posts.slice(offset, offset + limit)
  
  return {
    items,
    total: posts.length,
    hasMore: offset + limit < posts.length,
    nextOffset: offset + limit
  }
}

// ==================== 评论相关操作 ====================

/**
 * 获取所有评论
 */
export function getComments(): ForumComment[] {
  return safeJSONParse<ForumComment[]>(
    localStorage.getItem(STORAGE_KEYS.COMMENTS),
    []
  )
}

/**
 * 保存所有评论
 */
export function saveComments(comments: ForumComment[]): boolean {
  return safeJSONSave(STORAGE_KEYS.COMMENTS, comments)
}

/**
 * 获取帖子的评论
 */
export function getPostComments(postId: string): ForumComment[] {
  const comments = getComments()
  return comments.filter(comment => comment.postId === postId)
}

/**
 * 添加评论
 */
export function addComment(comment: Omit<ForumComment, 'id' | 'timestamp'>): ForumComment {
  const comments = getComments()
  const newComment: ForumComment = {
    ...comment,
    id: generateId(),
    timestamp: Date.now(),
    likeCount: 0,
    isLiked: false,
  }
  comments.push(newComment)
  saveComments(comments)
  
  // 更新帖子的评论数
  const posts = getPosts()
  const postIndex = posts.findIndex(p => p.id === comment.postId)
  if (postIndex !== -1) {
    posts[postIndex].commentCount++
    savePosts(posts)
  }
  
  // 如果是回复评论，创建通知（但不是自己回复自己）
  if (comment.replyTo && comment.replyToUserId && comment.replyToUserId !== comment.authorId) {
    addNotification({
      type: 'comment',
      fromUserId: comment.authorId,
      fromUserName: comment.authorName,
      fromUserAvatar: comment.authorAvatar,
      content: comment.content,
      postId: comment.postId,
      commentId: newComment.id,
      isRead: false,
    })
  }
  
  // 模拟社交互动（延迟触发）
  setTimeout(() => {
    // 40%概率获得点赞通知
    if (Math.random() < 0.4) {
      const likeCount = Math.floor(Math.random() * 30) + 5
      incrementLikes(likeCount)
      createAggregatedLikeNotification(comment.postId, newComment.id)
    }
  }, Math.random() * 4000 + 3000) // 3-7秒后
  
  return newComment
}

/**
 * 删除评论
 */
export function deleteComment(id: string): boolean {
  const comments = getComments()
  const comment = comments.find(c => c.id === id)
  if (!comment) return false
  
  const filtered = comments.filter(c => c.id !== id)
  saveComments(filtered)
  
  // 更新帖子的评论数
  const posts = getPosts()
  const postIndex = posts.findIndex(p => p.id === comment.postId)
  if (postIndex !== -1) {
    posts[postIndex].commentCount = Math.max(0, posts[postIndex].commentCount - 1)
    savePosts(posts)
  }
  
  return true
}

// ==================== 点赞相关操作 ====================

/**
 * 获取点赞的帖子ID列表
 */
export function getLikedPostIds(): string[] {
  return safeJSONParse<string[]>(
    localStorage.getItem(STORAGE_KEYS.LIKES),
    []
  )
}

/**
 * 检查帖子是否已点赞
 */
export function isPostLiked(postId: string): boolean {
  const likedIds = getLikedPostIds()
  return likedIds.includes(postId)
}

/**
 * 点赞帖子
 */
export function likePost(postId: string): boolean {
  const likedIds = getLikedPostIds()
  if (likedIds.includes(postId)) return false
  
  likedIds.push(postId)
  localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likedIds))
  
  // 更新帖子点赞数
  const posts = getPosts()
  const postIndex = posts.findIndex(p => p.id === postId)
  if (postIndex !== -1) {
    posts[postIndex].likeCount++
    posts[postIndex].isLiked = true
    savePosts(posts)
  }
  
  return true
}

/**
 * 取消点赞帖子
 */
export function unlikePost(postId: string): boolean {
  const likedIds = getLikedPostIds()
  const filtered = likedIds.filter(id => id !== postId)
  if (filtered.length === likedIds.length) return false
  
  localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(filtered))
  
  // 更新帖子点赞数
  const posts = getPosts()
  const postIndex = posts.findIndex(p => p.id === postId)
  if (postIndex !== -1) {
    posts[postIndex].likeCount = Math.max(0, posts[postIndex].likeCount - 1)
    posts[postIndex].isLiked = false
    savePosts(posts)
  }
  
  return true
}

/**
 * 切换帖子点赞状态
 */
export function togglePostLike(postId: string): boolean {
  const likedIds = getLikedPostIds()
  const isLiked = likedIds.includes(postId)
  
  if (isLiked) {
    return unlikePost(postId)
  } else {
    return likePost(postId)
  }
}

// ==================== 收藏相关操作 ====================

/**
 * 获取收藏的帖子ID列表
 */
export function getFavoritedPostIds(): string[] {
  return safeJSONParse<string[]>(
    localStorage.getItem(STORAGE_KEYS.FAVORITES),
    []
  )
}

/**
 * 收藏帖子
 */
export function favoritePost(postId: string): boolean {
  const favoritedIds = getFavoritedPostIds()
  if (favoritedIds.includes(postId)) return false
  
  favoritedIds.push(postId)
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favoritedIds))
  
  // 更新帖子收藏状态
  const posts = getPosts()
  const postIndex = posts.findIndex(p => p.id === postId)
  if (postIndex !== -1) {
    posts[postIndex].isFavorited = true
    savePosts(posts)
  }
  
  return true
}

/**
 * 取消收藏帖子
 */
export function unfavoritePost(postId: string): boolean {
  const favoritedIds = getFavoritedPostIds()
  const filtered = favoritedIds.filter(id => id !== postId)
  if (filtered.length === favoritedIds.length) return false
  
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered))
  
  // 更新帖子收藏状态
  const posts = getPosts()
  const postIndex = posts.findIndex(p => p.id === postId)
  if (postIndex !== -1) {
    posts[postIndex].isFavorited = false
    savePosts(posts)
  }
  
  return true
}

/**
 * 切换帖子收藏状态
 */
export function togglePostFavorite(postId: string): boolean {
  const favoritedIds = getFavoritedPostIds()
  const isFavorited = favoritedIds.includes(postId)
  
  if (isFavorited) {
    return unfavoritePost(postId)
  } else {
    return favoritePost(postId)
  }
}

// ==================== 关注用户相关操作 ====================

/**
 * 获取关注的用户ID列表
 */
export function getFollowingUserIds(): string[] {
  return safeJSONParse<string[]>(
    localStorage.getItem(STORAGE_KEYS.FOLLOWING_USERS),
    []
  )
}

/**
 * 检查是否已关注用户
 */
export function isUserFollowed(userId: string): boolean {
  const followingIds = getFollowingUserIds()
  return followingIds.includes(userId)
}

/**
 * 关注用户
 */
export function followUser(userId: string, userName: string): boolean {
  const followingIds = getFollowingUserIds()
  if (followingIds.includes(userId)) return false
  
  followingIds.push(userId)
  localStorage.setItem(STORAGE_KEYS.FOLLOWING_USERS, JSON.stringify(followingIds))
  
  // 如果不是关注自己，给对方发送通知
  if (userId !== 'currentUser') {
    addNotification({
      type: 'follow',
      fromUserId: 'currentUser',
      fromUserName: '我',
      fromUserAvatar: '😊',
      content: '关注了你',
      isRead: false
    })
  }
  
  return true
}

/**
 * 取消关注用户
 */
export function unfollowUser(userId: string): boolean {
  const followingIds = getFollowingUserIds()
  const filtered = followingIds.filter(id => id !== userId)
  if (filtered.length === followingIds.length) return false
  
  localStorage.setItem(STORAGE_KEYS.FOLLOWING_USERS, JSON.stringify(filtered))
  return true
}

/**
 * 切换关注用户状态
 */
export function toggleFollowUser(userId: string, userName: string): boolean {
  const isFollowing = isUserFollowed(userId)
  
  if (isFollowing) {
    return unfollowUser(userId)
  } else {
    return followUser(userId, userName)
  }
}

// ==================== 草稿相关操作 ====================

/**
 * 获取所有草稿
 */
export function getDrafts(): ForumDraft[] {
  return safeJSONParse<ForumDraft[]>(
    localStorage.getItem(STORAGE_KEYS.DRAFTS),
    []
  )
}

/**
 * 保存草稿
 */
export function saveDraft(draft: Omit<ForumDraft, 'id' | 'timestamp'>): ForumDraft {
  const drafts = getDrafts()
  const newDraft: ForumDraft = {
    ...draft,
    id: generateId(),
    timestamp: Date.now(),
  }
  drafts.unshift(newDraft)
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts))
  return newDraft
}

/**
 * 删除草稿
 */
export function deleteDraft(id: string): boolean {
  const drafts = getDrafts()
  const filtered = drafts.filter(draft => draft.id !== id)
  if (filtered.length === drafts.length) return false
  
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(filtered))
  return true
}

/**
 * 清空所有草稿
 */
export function clearDrafts(): boolean {
  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify([]))
  return true
}

// ==================== 数据清理和维护 ====================

/**
 * 清空所有论坛数据
 */
export function clearAllForumData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

/**
 * 获取存储空间使用情况
 */
export function getStorageInfo(): {
  posts: number
  comments: number
  drafts: number
  totalSize: string
} {
  const posts = getPosts()
  const comments = getComments()
  const drafts = getDrafts()
  
  // 估算大小（粗略）
  let totalBytes = 0
  Object.values(STORAGE_KEYS).forEach(key => {
    const item = localStorage.getItem(key)
    if (item) {
      totalBytes += item.length * 2 // UTF-16 每字符2字节
    }
  })
  
  return {
    posts: posts.length,
    comments: comments.length,
    drafts: drafts.length,
    totalSize: `${(totalBytes / 1024).toFixed(2)} KB`
  }
}

/**
 * 导出所有数据（用于备份）
 */
export function exportAllData(): string {
  const data: Record<string, any> = {}
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const item = localStorage.getItem(key)
    if (item) {
      data[name] = JSON.parse(item)
    }
  })
  return JSON.stringify(data, null, 2)
}

/**
 * 导入数据（用于恢复）
 */
export function importData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr)
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name]) {
        localStorage.setItem(key, JSON.stringify(data[name]))
      }
    })
    return true
  } catch (error) {
    console.error('导入数据失败:', error)
    return false
  }
}

// ==================== 初始化数据 ====================

/**
 * 初始化模拟数据（仅在首次使用时）
 */
export function initializeMockData(): void {
  const existingPosts = getPosts()
  if (existingPosts.length > 0) return // 已有数据，不初始化

  const mockPosts: ForumPost[] = [
    {
      id: generateId(),
      authorId: 'user1',
      authorName: '思思考考',
      authorAvatar: '',
      isVerified: true,
      content: '今天天气真好！☀️ 分享一下我的日常，希望大家都能开开心心的度过每一天。生活中的小确幸总是让人感到温暖。',
      type: 'text' as any,
      timestamp: Date.now() - 3600000, // 1小时前
      likeCount: 1288,
      commentCount: 156,
      shareCount: 89,
      viewCount: 8900,
      isLiked: false,
      isFavorited: false,
      tags: ['日常', '心情'],
      location: '北京·朝阳区',
    },
    {
      id: generateId(),
      authorId: 'user2',
      authorName: '科技达人',
      authorAvatar: '',
      isVerified: true,
      content: '刚刚看到一个很有意思的技术分享，关于AI的最新进展。科技改变生活，未来可期！🚀',
      type: 'text' as any,
      timestamp: Date.now() - 7200000, // 2小时前
      likeCount: 2156,
      commentCount: 234,
      shareCount: 178,
      viewCount: 15600,
      isLiked: false,
      isFavorited: false,
      tags: ['科技', 'AI'],
      location: '上海·浦东新区',
    },
    {
      id: generateId(),
      authorId: 'user3',
      authorName: '美食探店',
      authorAvatar: '',
      isVerified: false,
      content: '今天打卡了一家超级好吃的餐厅！环境很棒，菜品也很精致。强烈推荐给大家！😋',
      type: 'text' as any,
      timestamp: Date.now() - 10800000, // 3小时前
      likeCount: 567,
      commentCount: 89,
      shareCount: 45,
      viewCount: 4500,
      isLiked: false,
      isFavorited: false,
      tags: ['美食', '探店'],
      location: '广州·天河区',
    },
    {
      id: generateId(),
      authorId: 'user4',
      authorName: '旅行日记',
      authorAvatar: '',
      isVerified: true,
      content: '在海边看日落🌅 人生就是要多出去走走，看看这个美丽的世界。每一次旅行都是一次心灵的洗礼。',
      type: 'text' as any,
      timestamp: Date.now() - 14400000, // 4小时前
      likeCount: 3456,
      commentCount: 567,
      shareCount: 289,
      viewCount: 23400,
      isLiked: false,
      isFavorited: false,
      tags: ['旅行', '风景'],
      location: '三亚·海棠湾',
    },
    {
      id: generateId(),
      authorId: 'user5',
      authorName: '音乐分享',
      authorAvatar: '',
      isVerified: false,
      content: '最近在听的一首歌，单曲循环了一整天🎵 音乐真的是治愈心灵的良药。推荐给喜欢的朋友们！',
      type: 'text' as any,
      timestamp: Date.now() - 18000000, // 5小时前
      likeCount: 892,
      commentCount: 145,
      shareCount: 67,
      viewCount: 6700,
      isLiked: false,
      isFavorited: false,
      tags: ['音乐', '分享'],
      location: '杭州·西湖区',
    },
  ]

  savePosts(mockPosts)
  console.log('✅ 论坛模拟数据初始化完成')
}

// ==================== 通知管理 ====================

/**
 * 添加通知
 */
export function addNotification(notification: Omit<ForumNotification, 'id' | 'timestamp'>): ForumNotification {
  const notifications = getNotifications()
  const newNotification: ForumNotification = {
    ...notification,
    id: generateId(),
    timestamp: Date.now(),
  }
  notifications.unshift(newNotification) // 新通知放在最前面
  saveNotifications(notifications)
  
  // 触发通知栏显示
  if (notification.type === 'comment' && notification.fromUserName) {
    notifyNewComment(
      notification.fromUserName,
      notification.content || '',
      notification.postId || ''
    )
  } else if (notification.type === 'like' && notification.fromUserName) {
    notifyNewLike(
      notification.fromUserName,
      notification.postId || ''
    )
  } else if (notification.type === 'follow' && notification.fromUserName) {
    notifyNewFollow(notification.fromUserName)
  }
  
  return newNotification
}

/**
 * 获取通知列表
 */
export function getNotifications(): ForumNotification[] {
  return safeJSONParse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS), [])
}

/**
 * 保存通知列表
 */
function saveNotifications(notifications: ForumNotification[]): void {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications))
}

/**
 * 标记通知为已读
 */
export function markNotificationAsRead(notificationId: string): boolean {
  const notifications = getNotifications()
  const notification = notifications.find(n => n.id === notificationId)
  if (notification) {
    notification.isRead = true
    saveNotifications(notifications)
    return true
  }
  return false
}

/**
 * 标记所有通知为已读
 */
export function markAllNotificationsAsRead(): void {
  const notifications = getNotifications()
  notifications.forEach(n => n.isRead = true)
  saveNotifications(notifications)
}

/**
 * 获取未读通知数量
 */
export function getUnreadNotificationCount(): number {
  const notifications = getNotifications()
  return notifications.filter(n => !n.isRead).length
}

// ==================== 社交互动模拟 ====================

/**
 * 生成随机用户名
 */
function generateRandomUsername(): string {
  const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', '云', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦', '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '酆', '鲍', '史', '唐', '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常', '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黄', '和', '穆', '萧', '尹']
  const names = ['子涵', '雨轩', '浩宇', '思远', '梓涵', '欣怡', '晨曦', '雨萱', '诗涵', '梓萱', '静怡', '佳怡', '嘉怡', '紫涵', '雨桐', '梓琪', '雨泽', '宇轩', '子轩', '博文', '俊杰', '明轩', '天宇', '宇航', '晨阳', '子豪', '梓豪', '浩然', '雨辰', '子辰', '梓辰', '宇辰', '晨辰', '雨晨', '子晨', '梓晨', '宇晨', '诗琪', '雨琪', '梓琦', '宇琦', '晨琦', '子琦', '梓琪', '宇琪', '晨琪', '雨琦']
  
  // 70%概率使用"姓+名"，30%概率只用名字
  if (Math.random() < 0.7) {
    const surname = surnames[Math.floor(Math.random() * surnames.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    return surname + name
  } else {
    return names[Math.floor(Math.random() * names.length)]
  }
}

/**
 * 创建聚合点赞通知
 */
export function createAggregatedLikeNotification(postId: string, commentId?: string): void {
  // 随机生成3-5个点赞的人
  const likeCount = Math.floor(Math.random() * 3) + 3
  const names: string[] = []
  for (let i = 0; i < likeCount; i++) {
    names.push(generateRandomUsername())
  }
  
  // 总点赞数（包括显示的和隐藏的）
  const totalLikes = likeCount + Math.floor(Math.random() * 100) + 10
  
  const displayNames = names.slice(0, 3).join('、')
  const content = `${displayNames}等${totalLikes}个人赞了你${commentId ? '的评论' : '的微博'}`
  
  addNotification({
    type: 'like',
    fromUserId: 'system',
    fromUserName: displayNames,
    fromUserAvatar: '',
    content: content,
    postId: postId,
    commentId: commentId,
    isRead: false,
  })
}

/**
 * 创建新粉丝通知
 */
export function createNewFollowerNotification(): void {
  const followerName = generateRandomUsername()
  
  addNotification({
    type: 'follow',
    fromUserId: `user_${Date.now()}`,
    fromUserName: followerName,
    fromUserAvatar: '',
    content: '关注了你',
    isRead: false,
  })
}

/**
 * 用户统计数据
 */
interface UserStats {
  followers: number
  following: number
  posts: number
  likes: number
}

/**
 * 获取用户统计
 */
export function getUserStats(): UserStats {
  const stats = safeJSONParse(localStorage.getItem('forum_user_stats'), {
    followers: 0,
    following: 0,
    posts: 0,
    likes: 0
  })
  return stats
}

/**
 * 更新用户统计
 */
function saveUserStats(stats: UserStats): void {
  localStorage.setItem('forum_user_stats', JSON.stringify(stats))
}

/**
 * 增加粉丝数（模拟）
 */
export function incrementFollowers(count: number = 1): void {
  const stats = getUserStats()
  stats.followers += count
  saveUserStats(stats)
}

/**
 * 增加帖子数
 */
export function incrementPosts(): void {
  const stats = getUserStats()
  stats.posts += 1
  saveUserStats(stats)
}

/**
 * 增加获赞数
 */
export function incrementLikes(count: number = 1): void {
  const stats = getUserStats()
  stats.likes += count
  saveUserStats(stats)
}

// ==================== 私信管理 ====================

/**
 * 获取所有私信
 */
export function getDirectMessages(): ForumDirectMessage[] {
  const messages = safeJSONParse<ForumDirectMessage[]>(
    localStorage.getItem(STORAGE_KEYS.DIRECT_MESSAGES),
    []
  )
  // 按时间降序排序
  return messages.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * 添加私信
 */
export function addDirectMessage(message: Omit<ForumDirectMessage, 'id'>): ForumDirectMessage {
  const messages = getDirectMessages()
  const newMessage: ForumDirectMessage = {
    ...message,
    id: `dm_${Date.now()}_${Math.random()}`
  }
  messages.unshift(newMessage)
  localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(messages))
  
  // 触发私信通知栏显示
  if (message.toUserId === 'currentUser' && message.fromUserName) {
    notifyNewDirectMessage(message.fromUserName, message.content)
  }
  
  return newMessage
}

/**
 * 标记私信为已读
 */
export function markDirectMessageAsRead(messageId: string): void {
  const messages = getDirectMessages()
  const updated = messages.map(msg =>
    msg.id === messageId ? { ...msg, isRead: true } : msg
  )
  localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(updated))
}

/**
 * 标记所有私信为已读
 */
export function markAllDirectMessagesAsRead(): void {
  const messages = getDirectMessages()
  const updated = messages.map(msg => ({ ...msg, isRead: true }))
  localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(updated))
}

/**
 * 删除私信
 */
export function deleteDirectMessage(messageId: string): void {
  const messages = getDirectMessages()
  const filtered = messages.filter(msg => msg.id !== messageId)
  localStorage.setItem(STORAGE_KEYS.DIRECT_MESSAGES, JSON.stringify(filtered))
}

/**
 * 获取未读私信数量
 */
export function getUnreadDirectMessageCount(): number {
  const messages = getDirectMessages()
  return messages.filter(msg => !msg.isRead).length
}

