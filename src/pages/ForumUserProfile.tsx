/**
 * ForumUserProfile.tsx - 论坛用户详情页
 * 
 * 显示其他用户的信息、帖子、可以私信
 * 
 * @module pages/ForumUserProfile
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, MoreVerticalIcon } from '../components/Icons'

interface UserProfile {
  id: string
  name: string
  avatar: string
  bio: string
  followers: number
  following: number
  posts: number
}

const ForumUserProfile = () => {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { showStatusBar } = useSettings()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return
    
    // 从localStorage加载用户信息
    const users = JSON.parse(localStorage.getItem('forum_npc_users') || '[]')
    const foundUser = users.find((u: any) => u.id === userId)
    
    if (foundUser) {
      setUser(foundUser)
      // 加载用户的帖子（从话题中获取）
      const topics = JSON.parse(localStorage.getItem('forum_topics_list') || '[]')
      const userPosts: any[] = []
      topics.forEach((topic: any) => {
        if (topic.posts) {
          const userTopicPosts = topic.posts.filter((p: any) => p.authorId === userId)
          userPosts.push(...userTopicPosts.map((p: any) => ({
            ...p,
            topicName: topic.name
          })))
        }
      })
      setPosts(userPosts)
    }
  }, [userId])

  const handleSendMessage = () => {
    if (!user) return
    // 保存要私信的用户信息到localStorage，然后跳转到聊天详情
    localStorage.setItem('forum_dm_target', JSON.stringify({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      posts: posts.map(p => ({
        content: p.content,
        topicName: p.topicName,
        timestamp: p.timestamp
      }))
    }))
    // TODO: 跳转到私信聊天页面
    alert(`即将私信 ${user.name}，功能开发中...`)
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-400">用户不存在</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部栏 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>
          
          <h1 className="text-[17px] font-semibold text-gray-900">个人主页</h1>
          
          <button className="w-9 h-9 flex items-center justify-center active:opacity-60">
            <MoreVerticalIcon size={20} className="text-gray-800" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 用户信息卡片 */}
        <div className="bg-white p-4 mb-2">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-2xl flex-shrink-0">
              {user.avatar || user.name[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-[18px] font-semibold text-gray-900 mb-1">{user.name}</h2>
              <p className="text-[14px] text-gray-600">{user.bio || '这个人很懒，什么都没留下'}</p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-[18px] font-semibold text-gray-900">{user.following}</div>
              <div className="text-[12px] text-gray-500">关注</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-semibold text-gray-900">{user.followers}</div>
              <div className="text-[12px] text-gray-500">粉丝</div>
            </div>
            <div className="text-center">
              <div className="text-[18px] font-semibold text-gray-900">{posts.length}</div>
              <div className="text-[12px] text-gray-500">帖子</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-gray-100 text-gray-700 text-[14px] font-medium rounded-full active:bg-gray-200">
              关注
            </button>
            <button
              onClick={handleSendMessage}
              className="flex-1 py-2 bg-[#ff6c00] text-white text-[14px] font-medium rounded-full active:opacity-80"
            >
              私信
            </button>
          </div>
        </div>

        {/* 用户帖子 */}
        <div className="bg-white">
          <div className="px-4 py-3 border-b border-gray-50">
            <span className="text-[15px] font-medium text-gray-900">
              TA的帖子 ({posts.length})
            </span>
          </div>
          
          {posts.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-[14px]">
              暂无帖子
            </div>
          ) : (
            <div>
              {posts.map((post) => (
                <div key={post.id} className="p-4 border-b border-gray-50">
                  <div className="flex items-center gap-2 mb-2 text-[12px] text-gray-500">
                    <span>#{post.topicName}</span>
                    <span>·</span>
                    <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="text-[15px] text-gray-800 leading-relaxed">
                    {post.content}
                  </div>
                  {post.comments && (
                    <div className="mt-2 text-[13px] text-gray-500">
                      💬 {post.comments.length} 评论
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForumUserProfile
