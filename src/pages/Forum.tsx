/**
 * Forum.tsx - 论坛页面（微博风格）
 * 
 * 页面结构：
 * 1. 顶部导航栏 - 包含标题、搜索、发帖按钮
 * 2. Tab切换栏 - 推荐、关注、热门
 * 3. 信息流列表 - 帖子列表（用户信息、内容、图片、互动）
 * 4. 底部工具栏 - 点赞、评论、转发、收藏
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useForum } from '../context/ForumContext'
import ForumPostCard from '../components/ForumPostCard'
import { 
  BackIcon, 
  SearchIcon, 
  AddIcon,
  ImageIcon
} from '../components/Icons'
import type { ForumTab } from '../types/forum'

// ==================== 主组件 ====================

const Forum = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { 
    posts, 
    loading, 
    currentTab,
    setTab,
    toggleLike,
    toggleFavorite,
    refreshPosts
  } = useForum()

  // ==================== 本地状态 ====================
  const [refreshing, setRefreshing] = useState(false)

  // ==================== 初始化检查 ====================
  useEffect(() => {
    // 检查是否已初始化论坛
    const isInitialized = localStorage.getItem('forum_initialized') === 'true'
    if (!isInitialized) {
      // 首次进入，跳转到欢迎页
      navigate('/forum/welcome', { replace: true })
    }
  }, [])

  // ==================== 交互处理 ====================

  /**
   * 下拉刷新
   */
  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshPosts()
    setRefreshing(false)
  }

  /**
   * 点赞/取消点赞
   */
  const handleLike = (postId: string) => {
    toggleLike(postId)
  }

  /**
   * 跳转到评论页面
   */
  const handleComment = (postId: string) => {
    navigate(`/forum/post/${postId}`)
  }

  /**
   * 收藏帖子
   */
  const handleFavorite = (postId: string) => {
    toggleFavorite(postId)
  }

  /**
   * 跳转到发帖页面
   */
  const handlePublish = () => {
    navigate('/forum/publish')
  }

  /**
   * 打开搜索
   */
  const handleSearch = () => {
    navigate('/forum/search')
  }

  /**
   * 切换Tab
   */
  const handleTabChange = (tab: ForumTab) => {
    setTab(tab)
  }


  // ==================== 渲染函数 ====================

  /**
   * 渲染Tab切换栏
   */
  const renderTabs = () => {
    const tabs = [
      { key: 'recommend' as ForumTab, label: '首页' },
      { key: 'following' as ForumTab, label: '关注' },
      { key: 'hot' as ForumTab, label: '推荐' }
    ]

    return (
      <div className="flex items-center px-4 pb-2.5">
        {tabs.map((tab, index) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-3 py-1.5 text-[14px] rounded-full transition-all mr-3 ${
              currentTab === tab.key
                ? 'bg-[#ff6c00] text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button className="ml-auto text-gray-600 text-[14px] flex items-center gap-1 active:opacity-60">
          <span>更多</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    )
  }

  /**
   * 渲染底部导航栏
   */
  const renderBottomNav = () => {
    return (
      <div className="bg-white border-t border-gray-100 flex items-center justify-around py-2 safe-area-bottom">
        {/* 首页 */}
        <button className="flex flex-col items-center gap-1 py-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff6c00]">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <span className="text-[11px] text-[#ff6c00] font-medium">首页</span>
        </button>
        
        {/* 话题 */}
        <button 
          onClick={() => navigate('/forum/topics')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round"/>
          </svg>
          <span className="text-[11px] text-gray-600">话题</span>
        </button>
        
        {/* 发布 */}
        <button 
          onClick={handlePublish}
          className="flex flex-col items-center -mt-3 active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] rounded-full flex items-center justify-center shadow-lg">
            <AddIcon size={24} className="text-white" />
          </div>
        </button>
        
        {/* 消息 */}
        <button 
          onClick={() => navigate('/forum/notifications')}
          className="flex flex-col items-center gap-1 py-1 active:opacity-60"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11px] text-gray-600">消息</span>
        </button>
        
        {/* 我 */}
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

  /**
   * 渲染单个帖子 - 使用可复用组件
   */
  const renderPost = (post: ForumPost) => {
    return (
      <ForumPostCard
        key={post.id}
        post={post}
        onLike={handleLike}
        onComment={handleComment}
        onFavorite={handleFavorite}
      />
    )
  }

  /**
   * 渲染加载状态
   */
  const renderLoading = () => {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  /**
   * 渲染空状态
   */
  const renderEmpty = () => {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <ImageIcon size={64} className="mb-4 opacity-30" />
        <p className="text-sm">暂无内容</p>
      </div>
    )
  }

  // ==================== 主渲染 ====================

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部玻璃白色区域 - 包含状态栏、导航和Tab */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {/* 状态栏 */}
        {showStatusBar && <StatusBar />}
        
        {/* 顶部导航栏 */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          {/* 左侧 - 返回桌面 */}
          <button
            onClick={() => navigate('/desktop')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60 transition-opacity"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>

          {/* 中间 - 搜索框 */}
          <button
            onClick={handleSearch}
            className="flex-1 mx-3 h-9 bg-gray-100 rounded-full flex items-center px-3 active:bg-gray-200 transition-colors"
          >
            <SearchIcon size={16} className="text-gray-500" />
            <span className="ml-2 text-[14px] text-gray-500">搜索你感兴趣的内容</span>
          </button>

          {/* 右侧 - 发帖 */}
          <button
            onClick={handlePublish}
            className="w-9 h-9 flex items-center justify-center active:opacity-60 transition-opacity"
          >
            <AddIcon size={20} className="text-[#ff6c00]" />
          </button>
        </div>

        {/* Tab切换栏 */}
        {renderTabs()}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto bg-[#f7f7f7]">
        {loading ? (
          renderLoading()
        ) : posts.length === 0 ? (
          renderEmpty()
        ) : (
          <div>
            {posts.map(post => renderPost(post))}
          </div>
        )}
      </div>

      {/* 底部导航栏 */}
      {renderBottomNav()}
    </div>
  )
}

export default Forum

