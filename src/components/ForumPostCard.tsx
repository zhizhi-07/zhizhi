/**
 * ForumPostCard.tsx - 论坛帖子卡片组件
 * 
 * 可复用的帖子展示组件
 * 用于论坛主页、用户主页、搜索结果等场景
 * 
 * @module components/ForumPostCard
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CommentIcon, MoreVerticalIcon } from './Icons'
import type { ForumPost } from '../types/forum'

// ==================== 组件Props ====================

interface ForumPostCardProps {
  post: ForumPost
  onLike?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
  onFavorite?: (postId: string) => void
  showActions?: boolean          // 是否显示互动按钮
  compact?: boolean              // 紧凑模式
}

// ==================== 主组件 ====================

const ForumPostCard: React.FC<ForumPostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onFavorite,
  showActions = true,
  compact = false,
}) => {
  const navigate = useNavigate()

  // ==================== 工具函数 ====================

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}-${date.getDate()}`
  }

  /**
   * 格式化数字
   */
  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString()
    if (count < 10000) return (count / 1000).toFixed(1) + 'k'
    return (count / 10000).toFixed(1) + 'w'
  }

  /**
   * 渲染图片
   */
  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null

    // 单图
    if (post.images.length === 1) {
      return (
        <div className="mt-2.5 rounded-md overflow-hidden max-w-[85%]">
          <img 
            src={post.images[0]} 
            alt="图片" 
            className="w-full max-h-[400px] object-cover"
          />
        </div>
      )
    }

    // 多图
    const gridClass = post.images.length === 2 || post.images.length === 4 
      ? 'grid-cols-2' 
      : 'grid-cols-3'

    return (
      <div className={`mt-2.5 grid ${gridClass} gap-[3px]`}>
        {post.images.slice(0, 9).map((image, index) => (
          <div 
            key={index}
            className="aspect-square rounded-[4px] overflow-hidden bg-gray-100"
          >
            <img 
              src={image} 
              alt={`图片${index + 1}`} 
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    )
  }

  // ==================== 渲染 ====================

  return (
    <div className={`bg-white ${compact ? 'p-3' : 'mb-2 px-4 py-3'}`}>
      {/* 用户信息栏 */}
      <div className="flex items-start gap-2.5">
        {/* 头像 */}
        <div 
          className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer"
          onClick={() => navigate(`/profile/${post.authorId}`)}
        >
          {post.authorAvatar ? (
            <img 
              src={post.authorAvatar} 
              alt={post.authorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-orange-400 to-pink-400">
              <span className="text-lg font-medium">{post.authorName[0]}</span>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          {/* 用户名和更多按钮 */}
          <div className="flex items-start justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[15px] text-gray-900">
                {post.authorName}
              </span>
              {post.isVerified && (
                <svg width="14" height="14" viewBox="0 0 16 16" className="text-[#ff8200] mt-0.5">
                  <path 
                    d="M8 0L10 5L16 6L12 10L13 16L8 13L3 16L4 10L0 6L6 5L8 0Z" 
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
            <button className="text-gray-400 p-0.5 -mt-1 active:opacity-60">
              <MoreVerticalIcon size={16} />
            </button>
          </div>

          {/* 发布时间和地点 */}
          <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-2.5">
            <span>{formatTime(post.timestamp)}</span>
            {post.location && (
              <>
                <span>·</span>
                <span>{post.location}</span>
              </>
            )}
          </div>

          {/* 帖子内容 */}
          <div className="text-gray-800 text-[15px] leading-[1.6] mb-2">
            {post.content}
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="text-[14px] text-[#5b7599] cursor-pointer active:opacity-60"
                >
                  #{tag}#
                </span>
              ))}
            </div>
          )}

          {/* 图片 */}
          {renderImages()}

          {/* 互动工具栏 */}
          {showActions && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
              {/* 收藏 */}
              <button 
                onClick={() => onFavorite?.(post.id)}
                className="flex items-center gap-1.5 active:opacity-60 transition-opacity"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={post.isFavorited ? 'currentColor' : 'none'} className={post.isFavorited ? 'text-yellow-500' : 'text-gray-400'}>
                  <path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[13px] text-gray-500">
                  {post.isFavorited ? '已收藏' : ''}
                </span>
              </button>

              {/* 评论 */}
              <button 
                onClick={() => onComment?.(post.id)}
                className="flex items-center gap-1.5 active:opacity-60 transition-opacity"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-[13px] text-gray-500">
                  {post.commentCount > 0 ? formatCount(post.commentCount) : ''}
                </span>
              </button>

              {/* 点赞 */}
              <button 
                onClick={() => onLike?.(post.id)}
                className="flex items-center gap-1.5 active:opacity-60 transition-opacity"
              >
                {post.isLiked ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff6c00]">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <span className={`text-[13px] ${post.isLiked ? 'text-[#ff6c00]' : 'text-gray-500'}`}>
                  {post.likeCount > 0 ? formatCount(post.likeCount) : ''}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForumPostCard


