/**
 * 单条消息气泡组件
 * 支持编辑、删除、Swipe等功能
 */

import { useState } from 'react'
import type { ChatMessage } from '../../types/offline'
import HtmlRenderer from './HtmlRenderer'

interface MessageBubbleProps {
  message: ChatMessage
  characterName?: string
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
  onSwipeLeft?: (messageId: string) => void
  onSwipeRight?: (messageId: string) => void
}

const MessageBubble = ({
  message,
  characterName = 'AI',
  onEdit,
  onDelete,
  onRegenerate,
  onSwipeLeft,
  onSwipeRight
}: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const isUser = message.role === 'user'
  const hasSwipes = message.swipes && message.swipes.length > 1
  const currentSwipeIndex = message.currentSwipeIndex ?? 0
  const totalSwipes = message.swipes?.length ?? 1
  
  // 检测是否包含完整HTML文档（需要更多空间）
  const isFullHtml = message.content.includes('<!DOCTYPE') || 
                     message.content.includes('<html') ||
                     message.content.includes('<script')

  // 保存编辑
  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message.id, editContent.trim())
      setIsEditing(false)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`${isFullHtml ? 'w-full' : 'max-w-[80%]'} ${isUser ? 'order-2' : 'order-1'}`}>
        {/* 角色名称 - 完整HTML时隐藏 */}
        {!isFullHtml && (
          <div className={`text-xs text-gray-500 mb-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {isUser ? 'You' : characterName}
          </div>
        )}

        {/* 消息气泡 */}
        <div
          className={`${isFullHtml ? 'rounded-lg bg-gray-50 overflow-hidden' : 'rounded-2xl px-4 py-3'} ${
            isUser
              ? 'bg-blue-500 text-white'
              : isFullHtml 
                ? '' 
                : 'bg-white border border-gray-200 text-gray-800'
          }`}
          style={{
            boxShadow: isFullHtml ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {isEditing ? (
            // 编辑模式
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-sm"
                style={{ 
                  minHeight: '60px',
                  color: isUser ? 'white' : '#1f2937'
                }}
                autoFocus
              />
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : '#3b82f6',
                    color: isUser ? 'white' : 'white'
                  }}
                >
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
                    color: isUser ? 'white' : '#6b7280'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            // 显示模式
            <HtmlRenderer 
              content={message.content}
              className="text-sm"
            />
          )}
        </div>

        {/* Swipe 控制条（仅AI消息） */}
        {!isUser && hasSwipes && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              onClick={() => onSwipeLeft?.(message.id)}
              disabled={currentSwipeIndex === 0}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
              style={{
                backgroundColor: currentSwipeIndex === 0 ? '#e5e7eb' : '#3b82f6',
                color: currentSwipeIndex === 0 ? '#9ca3af' : '#ffffff'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <span className="text-xs text-gray-500 font-medium min-w-[40px] text-center">
              {currentSwipeIndex + 1}/{totalSwipes}
            </span>

            <button
              onClick={() => onSwipeRight?.(message.id)}
              disabled={currentSwipeIndex === totalSwipes - 1}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
              style={{
                backgroundColor: currentSwipeIndex === totalSwipes - 1 ? '#e5e7eb' : '#3b82f6',
                color: currentSwipeIndex === totalSwipes - 1 ? '#9ca3af' : '#ffffff'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* 操作按钮 */}
        {showActions && !isEditing && (
          <div className={`flex items-center gap-1 mt-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
              title="编辑"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            {!isUser && onRegenerate && (
              <button
                onClick={() => onRegenerate(message.id)}
                className="px-2 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors"
                title="重新生成"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
              </button>
            )}

            <button
              onClick={() => onDelete?.(message.id)}
              className="px-2 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors"
              title="删除"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
