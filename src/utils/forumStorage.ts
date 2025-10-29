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
  PostQueryOptions,
  CommentQueryOptions,
  PaginatedResult,
  PostSortType
} from '../types/forum'

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

