/**
 * ForumTopicDetail.tsx - 话题详情页
 * 
 * 显示话题下的所有帖子和讨论
 * 
 * @module pages/ForumTopicDetail
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, AddIcon } from '../components/Icons'

const ForumTopicDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { showStatusBar } = useSettings()
  const [topic, setTopic] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    if (!id) {
      navigate('/forum/topics', { replace: true })
      return
    }

    // 加载话题数据
    const topics = JSON.parse(localStorage.getItem('forum_topics_list') || '[]')
    const foundTopic = topics.find((t: any) => t.id === id)
    
    if (!foundTopic) {
      alert('话题不存在')
      navigate('/forum/topics', { replace: true })
      return
    }

    setTopic(foundTopic)
    setUsers(foundTopic.users || [])
    setPosts(foundTopic.posts || [])
  }, [id])

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

  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString()
    if (count < 10000) return (count / 1000).toFixed(1) + 'k'
    return (count / 10000).toFixed(1) + 'w'
  }

  const getUserInfo = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  if (!topic) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-[#ff6c00] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/forum/topics')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">#{topic.name}</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* 话题信息 */}
      <div className="bg-white p-4 mb-2">
        <h2 className="text-[18px] font-bold text-gray-900 mb-2">
          #{topic.name}
        </h2>
        <p className="text-[14px] text-gray-600 mb-3">
          {topic.description}
        </p>
        <div className="flex items-center gap-4 text-[13px] text-gray-500">
          <span>{formatCount(topic.postsCount)} 帖子</span>
          <span>· {formatCount(topic.followersCount)} 人关注</span>
        </div>
      </div>

      {/* 帖子列表 */}
      <div className="flex-1 overflow-y-auto">
        {posts.map(post => {
          const author = getUserInfo(post.authorId)
          if (!author) return null

          return (
            <div key={post.id} className="bg-white mb-2 p-4">
              {/* 作者信息 */}
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                  {author.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-medium text-gray-900">
                    {author.name}
                  </div>
                  <div className="text-[12px] text-gray-400">
                    {formatTime(post.timestamp)} · {formatCount(author.followers)} 粉丝
                  </div>
                </div>
              </div>

              {/* 内容 */}
              <div className="text-[15px] text-gray-800 leading-relaxed mb-3">
                {post.content}
              </div>

              {/* 互动栏 */}
              <div className="flex items-center gap-4 text-[13px] text-gray-500 pt-3 border-t border-gray-50">
                <span>❤️ {formatCount(post.likes)}</span>
                <span>💬 {post.comments.length}</span>
              </div>

              {/* 评论列表 */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                  {post.comments.map((comment: any) => {
                    const commentAuthor = getUserInfo(comment.authorId)
                    const replyToComment = comment.replyTo 
                      ? post.comments.find((c: any) => c.id === comment.replyTo)
                      : null
                    const replyToAuthor = replyToComment 
                      ? getUserInfo(replyToComment.authorId)
                      : null

                    return (
                      <div key={comment.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                          {commentAuthor?.avatar || '😊'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px]">
                            <span className="font-medium text-gray-900">{commentAuthor?.name}</span>
                            {replyToAuthor && (
                              <span className="text-gray-500"> 回复 <span className="text-[#5b7599]">@{replyToAuthor.name}</span></span>
                            )}
                            <span className="text-gray-700">: {comment.content}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                            <span>{formatTime(comment.timestamp)}</span>
                            {comment.likes > 0 && <span>❤️ {comment.likes}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 底部导航 */}
      {renderBottomNav()}
    </div>
  )

  function renderBottomNav() {
    return (
      <div className="bg-white border-t border-gray-100 flex items-center justify-around py-2">
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
          className="flex flex-col items-center gap-1 py-1"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff6c00]">
            <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
          </svg>
          <span className="text-[11px] text-[#ff6c00] font-medium">超话</span>
        </button>
        
        <button 
          onClick={() => navigate('/forum/publish')}
          className="flex flex-col items-center -mt-3 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] rounded-full flex items-center justify-center shadow-lg">
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
    )
  }
}

export default ForumTopicDetail


