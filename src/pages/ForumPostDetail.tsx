/**
 * ForumPostDetail.tsx - 帖子详情页
 * 
 * 完整展示帖子内容和评论
 * 支持评论、回复、点赞等互动
 * 
 * @module pages/ForumPostDetail
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useForum } from '../context/ForumContext'
import ForumCommentItem from '../components/ForumCommentItem'
import { BackIcon, MoreVerticalIcon, AddIcon } from '../components/Icons'
import type { ForumPost, ForumComment } from '../types/forum'
import { getForumCharacters } from '../utils/forumAI'
import { parseMentions, handleMentions, insertMention } from '../utils/forumAIReply'

const ForumPostDetail = () => {
  const navigate = useNavigate()
  const { id: postId } = useParams<{ id: string }>()
  const { showStatusBar } = useSettings()
  const { getPost, getComments, addComment, toggleLike } = useForum()
  
  // ==================== 状态管理 ====================
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [showInput, setShowInput] = useState(false)
  const [showMentionSelector, setShowMentionSelector] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)

  // ==================== 数据加载 ====================
  
  useEffect(() => {
    if (!postId) {
      navigate('/forum', { replace: true })
      return
    }

    // 加载帖子数据
    const postData = getPost(postId)
    if (!postData) {
      alert('帖子不存在')
      navigate('/forum', { replace: true })
      return
    }
    setPost(postData)

    // 加载评论数据
    const commentsData = getComments(postId)
    setComments(commentsData)
  }, [postId, getPost, getComments, navigate])

  // ==================== 交互处理 ====================
  
  /**
   * 点赞帖子
   */
  const handleLike = () => {
    if (!post) return
    toggleLike(post.id)
    setPost(prev => prev ? {
      ...prev,
      isLiked: !prev.isLiked,
      likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
    } : null)
  }

  /**
   * 发送评论
   */
  const handleSendComment = async () => {
    if (!post || !commentText.trim()) return

    try {
      const currentUser = {
        id: 'currentUser',
        name: '我',
        avatar: '😊',
      }

      addComment({
        postId: post.id,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content: commentText.trim(),
        replyTo: replyTo?.id,
        replyToUser: replyTo?.name,
        replyToUserId: replyTo?.id,
        isLiked: false,
        likeCount: 0,
      })

      // 检查是否@了角色，触发AI回复
      const mentions = parseMentions(commentText)
      if (mentions.length > 0) {
        console.log('🎯 检测到@角色，准备生成回复:', mentions)
        // 异步处理AI回复，不阻塞用户操作
        handleMentions(
          post.id,
          commentText.trim(),
          currentUser.id,
          currentUser.name,
          replyTo?.id
        ).then(() => {
          // AI回复完成后刷新评论列表
          const updatedComments = getComments(post.id)
          setComments(updatedComments)
        })
      }
      
      // 立即刷新评论列表
      const updatedComments = getComments(post.id)
      setComments(updatedComments)
      
      setCommentText('')
      setReplyTo(null)
      
      // 更新帖子评论数
      setPost(prev => prev ? {
        ...prev,
        commentCount: prev.commentCount + 1
      } : null)
    } catch (error) {
      console.error('发送评论失败:', error)
      alert('评论失败，请重试')
    }
  }

  /**
   * 回复评论
   */
  const handleReply = (comment: ForumComment) => {
    setReplyTo({
      id: comment.id,
      name: comment.authorName
    })
    setShowInput(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

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

  // ==================== 渲染 ====================

  if (!post) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#ff6c00] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部玻璃白色区域 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {/* 状态栏 */}
        {showStatusBar && <StatusBar />}

        {/* 顶部导航栏 */}
        <div className="px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center active:opacity-60"
        >
          <BackIcon size={22} className="text-gray-800" />
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">详情</h1>
        <button className="w-9 h-9 flex items-center justify-center active:opacity-60">
          <MoreVerticalIcon size={20} className="text-gray-800" />
        </button>
      </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 帖子内容 */}
        <div className="bg-white mb-2 p-4">
          {/* 用户信息 */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-orange-400 to-pink-400">
                  <span className="text-lg font-medium">{post.authorName[0]}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-[15px] text-gray-900">{post.authorName}</span>
                {post.isVerified && (
                  <svg width="14" height="14" viewBox="0 0 16 16" className="text-[#ff8200]">
                    <path d="M8 0L10 5L16 6L12 10L13 16L8 13L3 16L4 10L0 6L6 5L8 0Z" fill="currentColor"/>
                  </svg>
                )}
              </div>
              <div className="text-[12px] text-gray-400 mt-0.5">
                {formatTime(post.timestamp)}
                {post.location && ` · ${post.location}`}
              </div>
            </div>
          </div>

          {/* 内容 */}
          <div className="text-gray-800 text-[16px] leading-[1.6] mb-3">
            {post.content}
          </div>

          {/* 标签 */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag, index) => (
                <span key={index} className="text-[14px] text-[#5b7599]">
                  #{tag}#
                </span>
              ))}
            </div>
          )}

          {/* 图片 */}
          {post.images && post.images.length > 0 && (
            <div className={`grid ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 || post.images.length === 4 ? 'grid-cols-2' : 'grid-cols-3'} gap-[3px] mb-3`}>
              {post.images.slice(0, 9).map((image, index) => (
                <div key={index} className="aspect-square rounded-[4px] overflow-hidden bg-gray-100">
                  <img src={image} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* 互动数据 */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-50 text-[13px] text-gray-500">
            <span>{formatCount(post.likeCount)} 赞</span>
            <span>{formatCount(post.commentCount)} 评论</span>
            <span>{formatCount(post.shareCount)} 转发</span>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="bg-white">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-[15px] font-medium text-gray-900">
              评论 {comments.length}
            </span>
          </div>
          
          {comments.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-[14px]">
              暂无评论
            </div>
          ) : (
            <div>
              {comments.map((comment) => (
                <ForumCommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部区域 */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        {/* 评论工具栏 */}
        <div className="px-4 py-2 flex items-center gap-3 border-b border-gray-50">
          <button
            onClick={() => setShowInput(true)}
            className="flex-1 h-9 px-3 bg-gray-100 rounded-full text-left text-[14px] text-gray-500"
          >
            说点什么...
          </button>
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 px-3 py-1.5 active:opacity-60"
          >
            {post.isLiked ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff6c00]">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            )}
          </button>
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-around py-2">
          <button 
            onClick={() => navigate('/forum')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-[11px] text-gray-600">首页</span>
          </button>
          
          <button 
            onClick={() => navigate('/forum/topics')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] text-gray-600">话题</span>
          </button>
          
          <button className="flex flex-col items-center -mt-3">
            <div className="w-12 h-12 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] rounded-full flex items-center justify-center shadow-lg opacity-50">
              <AddIcon size={24} className="text-white" />
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/forum/notifications')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] text-gray-600">消息</span>
          </button>
          
          <button 
            onClick={() => navigate('/forum/profile')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] text-gray-600">我</span>
          </button>
        </div>
      </div>

      {/* 底部评论输入框 - 始终显示 */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 p-4 safe-area-bottom z-50">
        {replyTo && (
          <div className="flex items-center justify-between mb-2 text-[13px] text-gray-500">
            <span>回复 @{replyTo.name}</span>
            <button
              onClick={() => {
                setReplyTo(null)
                setCommentText('')
              }}
              className="text-gray-400 active:opacity-60"
            >
              取消
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMentionSelector(!showMentionSelector)}
            className="w-9 h-9 flex items-center justify-center text-[#ff6c00] active:opacity-60"
            title="@角色"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 8h-6a4 4 0 1 0 0 8h0V14"/>
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value)
              setCursorPosition(e.target.selectionStart || 0)
            }}
            onClick={(e) => setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
            placeholder={replyTo ? `回复 @${replyTo.name}` : "说点什么..."}
            className="flex-1 h-10 px-3 bg-gray-100 rounded-full text-[14px] outline-none"
          />
          <button
            onClick={handleSendComment}
            disabled={!commentText.trim()}
            className={`px-5 h-10 rounded-full text-[14px] font-medium ${
              commentText.trim()
                ? 'bg-[#ff6c00] text-white active:opacity-80'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            发送
          </button>
        </div>

        {/* 角色选择器 */}
        {showMentionSelector && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-2xl max-h-[300px] overflow-y-auto">
            <div className="p-2">
              <div className="text-[13px] text-gray-500 px-3 py-2">选择要@的角色</div>
              {getForumCharacters().map((character) => (
                <button
                  key={character.characterId}
                  onClick={() => {
                    const result = insertMention(commentText, cursorPosition, character.originalName)
                    setCommentText(result.newValue)
                    setCursorPosition(result.newCursorPos)
                    setShowMentionSelector(false)
                    inputRef.current?.focus()
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {character.forumAvatar || character.originalAvatar || '😊'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[14px] font-medium text-gray-900 truncate">
                      {character.forumNickname || character.originalName}
                    </div>
                    <div className="text-[12px] text-gray-500 truncate">
                      @{character.originalName}
                    </div>
                  </div>
                </button>
              ))}
              {getForumCharacters().length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <p className="text-[14px]">暂无可@的角色</p>
                  <p className="text-[12px] mt-1">请先在论坛初始化时添加角色</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumPostDetail

