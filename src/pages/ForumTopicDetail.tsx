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
import * as forumStorage from '../utils/forumStorage'

const ForumTopicDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { showStatusBar } = useSettings()
  const [topic, setTopic] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [replyingTo, setReplyingTo] = useState<{postId: string, commentId: string} | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [userComments, setUserComments] = useState<any[]>([]) // 用户发表的所有评论
  const [generating, setGenerating] = useState(false)

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
    
    // 添加当前用户到用户列表
    const currentUser = {
      id: 'currentUser',
      name: '我',
      bio: '这是我的账号',
      avatar: '😊',
      followers: 0
    }
    const allUsers = [currentUser, ...(foundTopic.users || [])]
    setUsers(allUsers)
    
    // 确保每个帖子都有comments数组
    const postsWithComments = (foundTopic.posts || []).map((post: any) => ({
      ...post,
      comments: post.comments || []
    }))
    setPosts(postsWithComments)
    
    console.log('📚 加载话题帖子:', postsWithComments)
    
    // 保存NPC用户信息到localStorage（用于用户主页）
    const npcUsers = JSON.parse(localStorage.getItem('forum_npc_users') || '[]')
    const updatedNpcUsers = [...npcUsers]
    foundTopic.users?.forEach((user: any) => {
      if (!updatedNpcUsers.find(u => u.id === user.id)) {
        updatedNpcUsers.push({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio || '这个人很懒，什么都没留下',
          followers: user.followers || Math.floor(Math.random() * 500) + 50,
          following: Math.floor(Math.random() * 200) + 20,
          posts: 0 // 会在ForumUserProfile中动态计算
        })
      }
    })
    localStorage.setItem('forum_npc_users', JSON.stringify(updatedNpcUsers))
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

  // 发送回复
  const sendReply = () => {
    if (!replyContent.trim() || !replyingTo) return
    
    const newComment = {
      id: `user_c_${Date.now()}`,
      authorId: 'currentUser', // 用户ID
      content: replyContent.trim(),
      likes: 0,
      timestamp: Date.now(),
      replyTo: replyingTo.commentId || undefined, // 空字符串转为undefined，表示直接评论帖子
      isUserComment: true // 标记为用户评论
    }
    
    console.log('💬 发送评论:', newComment)
    console.log('📮 回复到帖子ID:', replyingTo.postId)
    
    // 添加到帖子评论列表
    const updatedPosts = posts.map(post => {
      if (post.id === replyingTo.postId) {
        const updatedPost = {
          ...post,
          comments: [...(post.comments || []), newComment]
        }
        console.log('✅ 更新帖子:', updatedPost)
        return updatedPost
      }
      return post
    })
    
    console.log('📝 更新后的所有帖子:', updatedPosts)
    setPosts(updatedPosts)
    
    // 记录用户评论（用于后续AI生成）
    setUserComments([...userComments, {
      ...newComment,
      postId: replyingTo.postId
    }])
    
    // 保存到localStorage
    if (topic) {
      const topics = JSON.parse(localStorage.getItem('forum_topics_list') || '[]')
      const updatedTopics = topics.map((t: any) => {
        if (t.id === topic.id) {
          return { ...t, posts: updatedPosts }
        }
        return t
      })
      localStorage.setItem('forum_topics_list', JSON.stringify(updatedTopics))
      console.log('💾 已保存到localStorage')
    }
    
    // 清空输入
    setReplyContent('')
    setReplyingTo(null)
  }

  // AI生成后续互动
  const generateInteractions = async () => {
    if (userComments.length === 0) {
      alert('你还没有发表任何评论哦')
      return
    }
    
    setGenerating(true)
    
    try {
      // 调用AI API
      const apiSettings = localStorage.getItem('apiSettings')
      if (!apiSettings) {
        throw new Error('请先配置API')
      }
      
      const settings = JSON.parse(apiSettings)
      
      // 构建prompt
      const prompt = `你是论坛互动生成器。用户在话题"${topic.name}"中发了${userComments.length}条评论。

用户的评论：
${userComments.map((c, i) => {
  const post = posts.find(p => p.id === c.postId)
  const originalComment = post?.comments.find((oc: any) => oc.id === c.replyTo)
  const originalAuthor = originalComment ? getUserInfo(originalComment.authorId) : null
  return `【评论${i+1}】ID:${c.id} 回复@${originalAuthor?.name}说："${c.content}"`
}).join('\n')}

现有用户列表：
${users.filter(u => u.id !== 'currentUser').slice(0, 10).map(u => `${u.id}|${u.name}`).join('\n')}

请生成3-5条回复，每行一个，格式：
回复|评论ID|用户ID|回复内容

示例：
回复|user_c_1234567890|user1|哈哈说得对
回复|user_c_1234567890|user3|楼主观点我不同意
回复|user_c_1234567890|user5|有道理诶

要求：
- 内容真实自然，15-30字
- 不同用户有不同态度
- 直接输出，不要代码块标记
- 每行格式必须是：回复|评论ID|用户ID|回复内容
`

      console.log('🎯 发送prompt:', prompt)
      
      const response = await fetch(settings.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
          max_tokens: 2000
        })
      })
      
      if (!response.ok) {
        throw new Error('API调用失败')
      }
      
      const data = await response.json()
      const result = data.choices?.[0]?.message?.content || ''
      
      console.log('📦 AI返回:', result)
      
      // 解析简单格式：回复|评论ID|用户ID|回复内容
      const lines = result.split('\n').filter((l: string) => l.trim().startsWith('回复'))
      
      if (lines.length === 0) {
        throw new Error('AI没有生成回复')
      }
      
      const replies: any[] = []
      lines.forEach((line: string) => {
        const parts = line.split('|')
        if (parts.length === 4) {
          replies.push({
            targetCommentId: parts[1].trim(),
            userId: parts[2].trim(),
            content: parts[3].trim()
          })
        }
      })
      
      console.log('✅ 解析成功:', replies)
      
      // 应用生成的互动
      applyReplies(replies)
      
      alert(`✨ AI生成完成！收到 ${replies.length} 条回复`)
      
    } catch (error) {
      console.error('❌ 生成失败:', error)
      alert('生成失败：' + (error as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  // 应用AI生成的回复
  const applyReplies = (replies: any[]) => {
    let updatedPosts = [...posts]
    
    // 添加回复并创建通知
    replies.forEach((reply: any) => {
      const userComment = userComments.find(c => c.id === reply.targetCommentId)
      if (userComment) {
        const replyUser = users.find(u => u.id === reply.userId)
        
        updatedPosts = updatedPosts.map(post => {
          if (post.id === userComment.postId) {
            const newComment = {
              id: `ai_c_${Date.now()}_${Math.random()}`,
              authorId: reply.userId,
              content: reply.content,
              likes: Math.floor(Math.random() * 20),
              timestamp: Date.now() + Math.random() * 600000,
              replyTo: reply.targetCommentId
            }
            
            // 创建评论通知
            if (replyUser) {
              forumStorage.addNotification({
                type: 'comment',
                fromUserId: reply.userId,
                fromUserName: replyUser.name,
                fromUserAvatar: replyUser.avatar,
                content: reply.content,
                postId: post.id,
                commentId: newComment.id,
                isRead: false
              })
              console.log('🔔 创建通知:', replyUser.name, '回复了你')
            }
            
            return {
              ...post,
              comments: [...post.comments, newComment]
            }
          }
          return post
        })
      }
    })
    
    setPosts(updatedPosts)
    
    // 保存到话题
    const topics = JSON.parse(localStorage.getItem('forum_topics_list') || '[]')
    const updatedTopics = topics.map((t: any) => {
      if (t.id === topic.id) {
        return { ...t, posts: updatedPosts, postsCount: updatedPosts.length }
      }
      return t
    })
    localStorage.setItem('forum_topics_list', JSON.stringify(updatedTopics))
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
          <button
            onClick={generateInteractions}
            disabled={generating || userComments.length === 0}
            className={`w-9 h-9 flex items-center justify-center ${
              userComments.length > 0 ? 'active:scale-90 transition-transform' : 'opacity-30'
            }`}
            title="生成互动反应"
          >
            {generating ? (
              <div className="w-5 h-5 border-2 border-[#ff6c00] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#ff6c00]">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
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
                <button
                  onClick={() => post.authorId !== 'currentUser' && navigate(`/forum/user/${post.authorId}`)}
                  className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0 active:opacity-70"
                  disabled={post.authorId === 'currentUser'}
                >
                  {author.avatar}
                </button>
                <div className="flex-1">
                  <button
                    onClick={() => post.authorId !== 'currentUser' && navigate(`/forum/user/${post.authorId}`)}
                    className="text-[15px] font-medium text-gray-900 active:text-[#ff6c00] text-left"
                    disabled={post.authorId === 'currentUser'}
                  >
                    {author.name}
                  </button>
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
              <div className="flex items-center gap-4 text-[13px] pt-3 border-t border-gray-50">
                <span className="text-gray-500">❤️ {formatCount(post.likes)}</span>
                <button
                  onClick={() => setReplyingTo({postId: post.id, commentId: ''})}
                  className="text-gray-500 hover:text-[#ff6c00] active:opacity-60 flex items-center gap-1"
                >
                  💬 <span>{post.comments?.length || 0}</span> <span className="text-[#ff6c00]">评论</span>
                </button>
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
                        <button
                          onClick={() => comment.authorId !== 'currentUser' && navigate(`/forum/user/${comment.authorId}`)}
                          className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0 active:opacity-70"
                          disabled={comment.authorId === 'currentUser'}
                        >
                          {commentAuthor?.avatar || '😊'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px]">
                            <button
                              onClick={() => comment.authorId !== 'currentUser' && navigate(`/forum/user/${comment.authorId}`)}
                              className="font-medium text-gray-900 active:text-[#ff6c00]"
                              disabled={comment.authorId === 'currentUser'}
                            >
                              {commentAuthor?.name}
                            </button>
                            {replyToAuthor && (
                              <span className="text-gray-500"> 回复 <button
                                onClick={() => replyToComment?.authorId !== 'currentUser' && navigate(`/forum/user/${replyToComment?.authorId}`)}
                                className="text-[#5b7599] active:text-[#ff6c00]"
                                disabled={replyToComment?.authorId === 'currentUser'}
                              >
                                @{replyToAuthor.name}
                              </button></span>
                            )}
                            <span className="text-gray-700">: {comment.content}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                            <span>{formatTime(comment.timestamp)}</span>
                            {comment.likes > 0 && <span>❤️ {comment.likes}</span>}
                            <button
                              onClick={() => setReplyingTo({postId: post.id, commentId: comment.id})}
                              className="text-[#ff6c00] hover:text-[#ff8533] active:opacity-60"
                            >
                              回复
                            </button>
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

      {/* 评论/回复输入框 */}
      {replyingTo && (
        <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[13px] text-gray-600">
              {replyingTo.commentId 
                ? `回复 @${getUserInfo(
                    posts.find(p => p.id === replyingTo.postId)
                      ?.comments.find((c: any) => c.id === replyingTo.commentId)
                      ?.authorId
                  )?.name || '用户'}`
                : '评论'}
            </span>
            <button
              onClick={() => {
                setReplyingTo(null)
                setReplyContent('')
              }}
              className="ml-auto text-[12px] text-gray-500 active:opacity-60"
            >
              取消
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="说点什么..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-full text-[14px] outline-none focus:border-[#ff6c00]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendReply()
                }
              }}
            />
            <button
              onClick={sendReply}
              disabled={!replyContent.trim()}
              className={`px-4 py-2 rounded-full text-[14px] font-medium ${
                replyContent.trim()
                  ? 'bg-[#ff6c00] text-white active:opacity-80'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              发送
            </button>
          </div>
        </div>
      )}

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
          <span className="text-[11px] text-[#ff6c00] font-medium">话题</span>
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


