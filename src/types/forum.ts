/**
 * 论坛功能 - TypeScript 类型定义
 * 
 * 这个文件包含论坛功能的所有类型定义
 * 便于在整个应用中保持类型一致性
 * 
 * @module types/forum
 */

// ==================== 枚举类型 ====================

/**
 * 帖子类型枚举
 */
export enum PostType {
  TEXT = 'text',           // 纯文字
  IMAGE = 'image',         // 图片
  VIDEO = 'video',         // 视频
  LINK = 'link'           // 链接
}

/**
 * Tab选项枚举
 */
export enum ForumTab {
  RECOMMEND = 'recommend',  // 推荐
  FOLLOWING = 'following',  // 关注
  HOT = 'hot'              // 热门
}

/**
 * 帖子排序方式
 */
export enum PostSortType {
  TIME = 'time',           // 时间排序
  HOT = 'hot',            // 热度排序
  LIKE = 'like'           // 点赞数排序
}

// ==================== 基础接口 ====================

/**
 * 帖子接口定义
 */
export interface ForumPost {
  id: string                          // 帖子唯一标识
  authorId: string                    // 作者ID
  authorName: string                  // 作者昵称
  authorAvatar: string                // 作者头像URL
  isVerified?: boolean                // 是否认证用户
  content: string                     // 帖子内容
  type: PostType                      // 帖子类型
  images?: string[]                   // 图片列表
  videoUrl?: string                   // 视频URL
  videoThumb?: string                 // 视频封面
  linkUrl?: string                    // 链接URL
  linkTitle?: string                  // 链接标题
  linkImage?: string                  // 链接预览图
  timestamp: number                   // 发布时间戳
  likeCount: number                   // 点赞数
  commentCount: number                // 评论数
  shareCount: number                  // 转发数
  viewCount?: number                  // 浏览数
  isLiked: boolean                    // 当前用户是否已点赞
  isFavorited: boolean                // 当前用户是否已收藏
  isFollowingAuthor?: boolean         // 是否关注作者
  tags?: string[]                     // 话题标签
  location?: string                   // 发布地点
  forwardFrom?: ForumPost             // 转发的原帖
  createdAt?: string                  // 创建时间（格式化）
  updatedAt?: string                  // 更新时间（格式化）
}

/**
 * 评论接口定义
 */
export interface ForumComment {
  id: string                          // 评论ID
  postId: string                      // 所属帖子ID
  authorId: string                    // 评论者ID
  authorName: string                  // 评论者昵称
  authorAvatar: string                // 评论者头像
  content: string                     // 评论内容
  timestamp: number                   // 评论时间戳
  likeCount: number                   // 点赞数
  isLiked: boolean                    // 是否已点赞
  replyTo?: string                    // 回复的评论ID
  replyToUser?: string                // 回复的用户名
  replyToUserId?: string              // 回复的用户ID
  replies?: ForumComment[]            // 子评论列表
  createdAt?: string                  // 创建时间（格式化）
}

/**
 * 草稿接口定义
 */
export interface ForumDraft {
  id: string                          // 草稿ID
  content: string                     // 内容
  images?: string[]                   // 图片
  tags?: string[]                     // 话题
  location?: string                   // 地点
  timestamp: number                   // 保存时间
}

/**
 * 用户信息接口
 */
export interface ForumUser {
  id: string                          // 用户ID
  name: string                        // 用户名
  avatar: string                      // 头像
  bio?: string                        // 个人简介
  isVerified?: boolean                // 是否认证
  followersCount?: number             // 粉丝数
  followingCount?: number             // 关注数
  postsCount?: number                 // 帖子数
}

/**
 * 话题接口
 */
export interface ForumTopic {
  id: string                          // 话题ID
  name: string                        // 话题名称
  description?: string                // 话题描述
  cover?: string                      // 封面图
  postsCount: number                  // 帖子数
  followersCount?: number             // 关注数
  isFollowing?: boolean               // 是否已关注
}

/**
 * 通知接口
 */
export interface ForumNotification {
  id: string                          // 通知ID
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system'
  fromUserId?: string                 // 来源用户ID
  fromUserName?: string               // 来源用户名
  fromUserAvatar?: string             // 来源用户头像
  postId?: string                     // 相关帖子ID
  commentId?: string                  // 相关评论ID
  content: string                     // 通知内容
  timestamp: number                   // 时间戳
  isRead: boolean                     // 是否已读
}

/**
 * 私信接口
 */
export interface ForumDirectMessage {
  id: string                          // 私信ID
  fromUserId: string                  // 发送者ID
  fromUserName: string                // 发送者名称
  fromUserAvatar: string              // 发送者头像
  toUserId: string                    // 接收者ID (currentUser)
  content: string                     // 私信内容
  timestamp: number                   // 时间戳
  isRead: boolean                     // 是否已读
}

// ==================== 过滤和查询接口 ====================

/**
 * 帖子查询条件
 */
export interface PostQueryOptions {
  tab?: ForumTab                      // Tab类型
  authorId?: string                   // 作者ID
  tag?: string                        // 话题标签
  keyword?: string                    // 关键词
  sortBy?: PostSortType               // 排序方式
  limit?: number                      // 返回数量限制
  offset?: number                     // 偏移量（分页）
}

/**
 * 评论查询条件
 */
export interface CommentQueryOptions {
  postId: string                      // 帖子ID
  sortBy?: 'time' | 'hot'            // 排序方式
  limit?: number                      // 返回数量
  offset?: number                     // 偏移量
}

// ==================== 操作结果接口 ====================

/**
 * 通用操作结果
 */
export interface OperationResult<T = any> {
  success: boolean                    // 是否成功
  data?: T                           // 返回数据
  error?: string                     // 错误信息
  message?: string                   // 提示信息
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  items: T[]                         // 数据列表
  total: number                      // 总数
  hasMore: boolean                   // 是否还有更多
  nextOffset?: number                // 下一页偏移量
}

// ==================== 统计接口 ====================

/**
 * 帖子统计
 */
export interface PostStats {
  totalPosts: number                 // 总帖子数
  todayPosts: number                 // 今日发帖数
  totalLikes: number                 // 总点赞数
  totalComments: number              // 总评论数
}

/**
 * 用户统计
 */
export interface UserStats {
  postsCount: number                 // 发帖数
  likesCount: number                 // 获赞数
  commentsCount: number              // 评论数
  followersCount: number             // 粉丝数
  followingCount: number             // 关注数
}

// ==================== 表单接口 ====================

/**
 * 发帖表单数据
 */
export interface PublishFormData {
  content: string                    // 内容
  images?: File[]                    // 图片文件
  imageUrls?: string[]               // 图片URL（已上传）
  tags?: string[]                    // 话题标签
  location?: string                  // 地点
  type?: PostType                    // 类型
  forwardFromId?: string             // 转发的帖子ID
}

/**
 * 评论表单数据
 */
export interface CommentFormData {
  content: string                    // 评论内容
  postId: string                     // 帖子ID
  replyTo?: string                   // 回复的评论ID
  replyToUser?: string               // 回复的用户名
  replyToUserId?: string             // 回复的用户ID
}

// ==================== 导出类型辅助 ====================

/**
 * 帖子创建数据（不含自动生成字段）
 */
export type PostCreateData = Omit<ForumPost, 'id' | 'timestamp' | 'likeCount' | 'commentCount' | 'shareCount' | 'isLiked' | 'isFavorited'>

/**
 * 帖子更新数据（可选字段）
 */
export type PostUpdateData = Partial<Pick<ForumPost, 'content' | 'images' | 'tags' | 'location'>>

/**
 * 评论创建数据
 */
export type CommentCreateData = Omit<ForumComment, 'id' | 'timestamp' | 'likeCount' | 'isLiked' | 'replies'>

/**
 * 评论更新数据
 */
export type CommentUpdateData = Partial<Pick<ForumComment, 'content'>>


