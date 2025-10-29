/**
 * ForumProfile.tsx - 论坛个人中心
 * 
 * 显示用户信息、我的帖子、收藏、草稿等
 * 
 * @module pages/ForumProfile
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useForum } from '../context/ForumContext'
import ForumPostCard from '../components/ForumPostCard'
import { BackIcon, SettingsIcon, AddIcon, CameraIcon } from '../components/Icons'
import type { ForumPost } from '../types/forum'
import * as forumStorage from '../utils/forumStorage'

const ForumProfile = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { posts, getDrafts, toggleLike, toggleFavorite } = useForum()
  const [activeTab, setActiveTab] = useState<'posts' | 'favorites' | 'drafts'>('posts')
  const [myPosts, setMyPosts] = useState<ForumPost[]>([])
  const [favoritePosts, setFavoritePosts] = useState<ForumPost[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  
  // 编辑状态
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editType, setEditType] = useState<'name' | 'bio' | 'avatar'>('name')
  const [editValue, setEditValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 用户信息（从localStorage读取）
  const [userInfo, setUserInfo] = useState(() => {
    const saved = localStorage.getItem('forum_user_info')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {
          id: 'user_current',
          name: '我的昵称',
          avatar: '',
          bio: '这是我的个人简介',
          followersCount: 128,
          followingCount: 256,
          postsCount: 89,
        }
      }
    }
    return {
      id: 'user_current',
      name: '我的昵称',
      avatar: '',
      bio: '这是我的个人简介',
      followersCount: 128,
      followingCount: 256,
      postsCount: 89,
    }
  })

  // 保存用户信息到localStorage
  const saveUserInfo = (newInfo: any) => {
    setUserInfo(newInfo)
    localStorage.setItem('forum_user_info', JSON.stringify(newInfo))
  }

  useEffect(() => {
    loadUserData()
  }, [activeTab])

  const loadUserData = () => {
    // 获取真实统计数据
    const stats = forumStorage.getUserStats()
    
    // 我的帖子
    const myPostsList = posts.filter(p => p.authorId === userInfo.id)
    setMyPosts(myPostsList)

    // 我的收藏
    const favorites = posts.filter(p => p.isFavorited)
    setFavoritePosts(favorites)

    // 我的草稿
    const draftsList = getDrafts()
    setDrafts(draftsList)
    
    // 更新用户信息中的统计数据
    setUserInfo((prev: any) => ({
      ...prev,
      followersCount: stats.followers,
      followingCount: stats.following,
      postsCount: stats.posts,
    }))
  }

  // ==================== 编辑功能 ====================

  /**
   * 打开编辑对话框
   */
  const handleEdit = (type: 'name' | 'bio' | 'avatar') => {
    setEditType(type)
    if (type === 'avatar') {
      fileInputRef.current?.click()
    } else {
      setEditValue(type === 'name' ? userInfo.name : userInfo.bio)
      setShowEditDialog(true)
    }
  }

  /**
   * 处理头像上传
   */
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const newInfo = {
          ...userInfo,
          avatar: event.target.result as string
        }
        saveUserInfo(newInfo)
      }
    }
    reader.readAsDataURL(file)
  }

  /**
   * 保存编辑
   */
  const handleSaveEdit = () => {
    if (!editValue.trim()) return

    const newInfo = {
      ...userInfo,
      [editType]: editValue.trim()
    }
    saveUserInfo(newInfo)
    setShowEditDialog(false)
    setEditValue('')
  }

  /**
   * 取消编辑
   */
  const handleCancelEdit = () => {
    setShowEditDialog(false)
    setEditValue('')
  }

  const renderContent = () => {
    if (activeTab === 'posts') {
      return myPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-4 opacity-30">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
          </svg>
          <p className="text-[14px] mb-4">还没有发布内容</p>
          <button
            onClick={() => navigate('/forum/publish')}
            className="px-6 py-2.5 bg-[#ff6c00] text-white rounded-full text-[14px] active:opacity-80"
          >
            发布第一条微博
          </button>
        </div>
      ) : (
        <div>
          {myPosts.map(post => (
            <ForumPostCard
              key={post.id}
              post={post}
              onLike={toggleLike}
              onComment={(id) => navigate(`/forum/post/${id}`)}
              onFavorite={toggleFavorite}
            />
          ))}
        </div>
      )
    } else if (activeTab === 'favorites') {
      return favoritePosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-4 opacity-30">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeWidth="2"/>
          </svg>
          <p className="text-[14px]">暂无收藏</p>
        </div>
      ) : (
        <div>
          {favoritePosts.map(post => (
            <ForumPostCard
              key={post.id}
              post={post}
              onLike={toggleLike}
              onComment={(id) => navigate(`/forum/post/${id}`)}
              onFavorite={toggleFavorite}
            />
          ))}
        </div>
      )
    } else {
      return drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-4 opacity-30">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2"/>
          </svg>
          <p className="text-[14px]">暂无草稿</p>
        </div>
      ) : (
        <div>
          {drafts.map(draft => (
            <div
              key={draft.id}
              className="bg-white mb-2 p-4 active:bg-gray-50"
              onClick={() => {
                // TODO: 编辑草稿
                alert('草稿编辑功能开发中')
              }}
            >
              <div className="text-[14px] text-gray-800 line-clamp-3 mb-2">
                {draft.content}
              </div>
              <div className="text-[12px] text-gray-400">
                保存于 {new Date(draft.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部玻璃白色区域 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        {/* 顶部导航 */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/forum')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">我的</h1>
          <button className="w-9 h-9 flex items-center justify-center active:opacity-60">
            <SettingsIcon size={20} className="text-gray-800" />
          </button>
        </div>
      </div>

      {/* 用户信息卡片 */}
      <div className="bg-white p-4 mb-2">
        <div className="flex items-start gap-4 mb-4">
          {/* 头像 - 可点击换头像 */}
          <button
            onClick={() => handleEdit('avatar')}
            className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center flex-shrink-0 active:opacity-80"
          >
            {userInfo.avatar ? (
              <img src={userInfo.avatar} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{userInfo.name[0]}</span>
            )}
            {/* 相机图标 */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <CameraIcon size={24} className="text-white" />
            </div>
          </button>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            {/* 昵称 - 可点击编辑 */}
            <button
              onClick={() => handleEdit('name')}
              className="flex items-center gap-2 mb-2 active:opacity-60"
            >
              <span className="text-[18px] font-semibold text-gray-900">
                {userInfo.name}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
              </svg>
            </button>
            
            {/* 个性签名 - 可点击编辑 */}
            <button
              onClick={() => handleEdit('bio')}
              className="text-left w-full active:opacity-60"
            >
              <div className="text-[13px] text-gray-500 line-clamp-2 flex items-start gap-1">
                <span className="flex-1">{userInfo.bio}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5 flex-shrink-0">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="flex items-center gap-6 pt-3 border-t border-gray-50">
          <div className="text-center">
            <div className="text-[18px] font-semibold text-gray-900">{userInfo.followingCount}</div>
            <div className="text-[12px] text-gray-500">关注</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-semibold text-gray-900">{userInfo.followersCount}</div>
            <div className="text-[12px] text-gray-500">粉丝</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-semibold text-gray-900">{myPosts.length}</div>
            <div className="text-[12px] text-gray-500">微博</div>
          </div>
        </div>
      </div>

      {/* 功能列表 */}
      <div className="bg-white mb-2">
        <button
          onClick={() => navigate('/forum/memes')}
          className="w-full px-4 py-3.5 flex items-center justify-between active:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
              <span className="text-lg">🎭</span>
            </div>
            <span className="text-[15px] text-gray-900">梗库管理</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />

      {/* 编辑对话框 */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4">
            <h3 className="text-[17px] font-semibold text-gray-900 mb-3">
              {editType === 'name' ? '修改昵称' : '修改个性签名'}
            </h3>
            
            {editType === 'name' ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                maxLength={20}
                placeholder="请输入昵称"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#ff6c00]"
                autoFocus
              />
            ) : (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                maxLength={100}
                placeholder="请输入个性签名"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#ff6c00] resize-none"
                rows={3}
                autoFocus
              />
            )}
            
            <div className="flex items-center justify-between mt-2 text-[12px] text-gray-400">
              <span>
                {editType === 'name' ? '最多20个字' : '最多100个字'}
              </span>
              <span>{editValue.length}/{editType === 'name' ? 20 : 100}</span>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-2.5 text-[15px] text-gray-700 border border-gray-200 rounded-full active:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editValue.trim()}
                className={`flex-1 py-2.5 text-[15px] rounded-full ${
                  editValue.trim()
                    ? 'bg-[#ff6c00] text-white active:opacity-80'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab切换 */}
      <div className="bg-white flex items-center">
        {[
          { key: 'posts' as const, label: '微博' },
          { key: 'favorites' as const, label: '收藏' },
          { key: 'drafts' as const, label: '草稿' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-center relative ${
              activeTab === tab.key
                ? 'text-[#ff6c00] font-medium'
                : 'text-gray-600'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-[3px] bg-[#ff6c00] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
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
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round"/>
          </svg>
          <span className="text-[11px] text-gray-600">话题</span>
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
        
        <button className="flex flex-col items-center gap-1 py-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff6c00]">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span className="text-[11px] text-[#ff6c00] font-medium">我</span>
        </button>
      </div>
    )
  }
}

export default ForumProfile

