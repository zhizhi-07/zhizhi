/**
 * ForumCommentItem.tsx - 论坛评论项组件
 * 
 * 可复用的评论展示组件
 * 支持回复、点赞等功能
 * 
 * @module components/ForumCommentItem
 */

import React from 'react'
import type { ForumComment } from '../types/forum'

// ==================== 组件Props ====================

interface ForumCommentItemProps {
  comment: ForumComment
  onReply?: (comment: ForumComment) => void
  onLike?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  showReplies?: boolean
}

// ==================== 主组件 ====================

const ForumCommentItem: React.FC<ForumCommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onDelete,
  showReplies = true,
}) => {
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

  return (
    <div className="px-4 py-3 border-b border-gray-50">
      <div className="flex gap-2.5">
        {/* 头像 */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {comment.authorAvatar ? (
            <img 
              src={comment.authorAvatar} 
              alt={comment.authorName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-blue-400 to-purple-400">
              <span className="text-sm font-medium">{comment.authorName[0]}</span>
            </div>
          )}
        </div>
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] text-gray-900 font-medium mb-1">
            {comment.authorName}
          </div>
          <div className="text-[14px] text-gray-800 leading-[1.5] mb-2">
            {comment.replyToUser && (
              <span className="text-[#5b7599]">回复 @{comment.replyToUser}: </span>
            )}
            {comment.content}
          </div>
          
          {/* 操作栏 */}
          <div className="flex items-center gap-3 text-[12px] text-gray-400">
            <span>{formatTime(comment.timestamp)}</span>
            
            {onReply && (
              <button
                onClick={() => onReply(comment)}
                className="active:opacity-60"
              >
                回复
              </button>
            )}
            
            {onLike && comment.likeCount > 0 && (
              <button
                onClick={() => onLike(comment.id)}
                className={`active:opacity-60 ${comment.isLiked ? 'text-[#ff6c00]' : ''}`}
              >
                {formatCount(comment.likeCount)} 赞
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="ml-auto active:opacity-60 text-red-400"
              >
                删除
              </button>
            )}
          </div>

          {/* 子评论（回复列表） */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 ml-2 pl-3 border-l-2 border-gray-100 space-y-2">
              {comment.replies.map(reply => (
                <ForumCommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  showReplies={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForumCommentItem


