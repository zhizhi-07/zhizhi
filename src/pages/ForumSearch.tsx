/**
 * ForumSearch.tsx - 搜索页面
 * 
 * 支持搜索帖子、话题、用户
 * 显示搜索历史和热门话题
 * 
 * @module pages/ForumSearch
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useForum } from '../context/ForumContext'
import { BackIcon, SearchIcon, AddIcon } from '../components/Icons'
import type { ForumPost } from '../types/forum'

const ForumSearch = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { loadPosts } = useForum()
  
  // ==================== 状态管理 ====================
  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<ForumPost[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [hotTopics, setHotTopics] = useState<{ name: string; count: number }[]>([])
  const [activeTab, setActiveTab] = useState<'posts' | 'topics' | 'users'>('posts')
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  // ==================== 初始化 ====================
  
  useEffect(() => {
    // 加载搜索历史
    const history = localStorage.getItem('forum_search_history')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (error) {
        console.error('加载搜索历史失败:', error)
      }
    }

    // 加载热门话题（模拟数据）
    setHotTopics([
      { name: '微博热搜', count: 12800 },
      { name: '今日话题', count: 8500 },
      { name: '科技资讯', count: 6200 },
      { name: '娱乐八卦', count: 5100 },
      { name: '美食分享', count: 3800 },
    ])

    // 自动聚焦
    inputRef.current?.focus()
  }, [])

  // ==================== 搜索处理 ====================
  
  /**
   * 执行搜索
   */
  const handleSearch = async (searchKeyword?: string) => {
    const kw = searchKeyword || keyword
    if (!kw.trim()) return

    try {
      setSearching(true)
      setShowResults(true)

      // 保存搜索历史
      const newHistory = [kw, ...searchHistory.filter(h => h !== kw)].slice(0, 10)
      setSearchHistory(newHistory)
      localStorage.setItem('forum_search_history', JSON.stringify(newHistory))

      // 执行搜索（这里使用本地数据，后续可接入API）
      await loadPosts({ keyword: kw })
      
      // 模拟搜索结果
      setSearchResults([])
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setSearching(false)
    }
  }

  /**
   * 清空搜索历史
   */
  const handleClearHistory = () => {
    if (window.confirm('确定清空搜索历史吗？')) {
      setSearchHistory([])
      localStorage.removeItem('forum_search_history')
    }
  }

  /**
   * 删除单条历史
   */
  const handleRemoveHistory = (item: string) => {
    const newHistory = searchHistory.filter(h => h !== item)
    setSearchHistory(newHistory)
    localStorage.setItem('forum_search_history', JSON.stringify(newHistory))
  }

  /**
   * 点击历史记录
   */
  const handleHistoryClick = (item: string) => {
    setKeyword(item)
    handleSearch(item)
  }

  /**
   * 点击话题
   */
  const handleTopicClick = (topic: string) => {
    setKeyword(topic)
    handleSearch(topic)
  }

  // ==================== 渲染函数 ====================

  /**
   * 渲染搜索历史
   */
  const renderHistory = () => {
    if (searchHistory.length === 0) return null

    return (
      <div className="bg-white mt-2 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-medium text-gray-900">搜索历史</span>
          <button
            onClick={handleClearHistory}
            className="text-[13px] text-gray-500 active:opacity-60"
          >
            清空
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {searchHistory.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full"
            >
              <button
                onClick={() => handleHistoryClick(item)}
                className="text-[14px] text-gray-700 active:opacity-60"
              >
                {item}
              </button>
              <button
                onClick={() => handleRemoveHistory(item)}
                className="w-4 h-4 flex items-center justify-center active:opacity-60"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /**
   * 渲染热门话题
   */
  const renderHotTopics = () => {
    return (
      <div className="bg-white mt-2 p-4">
        <div className="mb-3">
          <span className="text-[15px] font-medium text-gray-900">热门话题</span>
        </div>
        <div className="space-y-3">
          {hotTopics.map((topic, index) => (
            <button
              key={index}
              onClick={() => handleTopicClick(topic.name)}
              className="w-full flex items-center gap-3 active:opacity-60"
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center text-[12px] font-bold ${
                index < 3 ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 text-left">
                <div className="text-[15px] text-gray-900 font-medium">#{topic.name}</div>
                <div className="text-[12px] text-gray-400">{(topic.count / 10000).toFixed(1)}w 讨论</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <path d="M9 18l6-6-6-6" strokeLinecap="round"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /**
   * 渲染搜索结果
   */
  const renderResults = () => {
    if (searching) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-3 border-[#ff6c00] border-t-transparent rounded-full" />
        </div>
      )
    }

    if (searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-30">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <p className="text-[14px]">未找到相关内容</p>
        </div>
      )
    }

    return (
      <div className="bg-white mt-2">
        {/* Tab切换 */}
        <div className="flex border-b border-gray-100">
          {[
            { key: 'posts' as const, label: '帖子' },
            { key: 'topics' as const, label: '话题' },
            { key: 'users' as const, label: '用户' }
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

        {/* 结果列表 */}
        <div>
          {searchResults.map(post => (
            <div
              key={post.id}
              onClick={() => navigate(`/forum/post/${post.id}`)}
              className="p-4 border-b border-gray-50 active:bg-gray-50"
            >
              {/* 简化的帖子显示 */}
              <div className="text-[14px] text-gray-900 line-clamp-2 mb-1">
                {post.content}
              </div>
              <div className="text-[12px] text-gray-400">
                {post.authorName} · {post.likeCount} 赞 · {post.commentCount} 评论
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ==================== 主渲染 ====================

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部玻璃白色区域 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {/* 状态栏 */}
        {showStatusBar && <StatusBar />}

        {/* 搜索栏 */}
        <div className="px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center active:opacity-60"
        >
          <BackIcon size={22} className="text-gray-800" />
        </button>
        
        <div className="flex-1 h-9 bg-gray-100 rounded-full flex items-center px-3">
          <SearchIcon size={16} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索你感兴趣的内容"
            className="flex-1 ml-2 text-[14px] bg-transparent outline-none"
          />
          {keyword && (
            <button
              onClick={() => {
                setKeyword('')
                setShowResults(false)
              }}
              className="w-5 h-5 flex items-center justify-center active:opacity-60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={!keyword.trim()}
          className={`text-[15px] ${
            keyword.trim() ? 'text-[#ff6c00]' : 'text-gray-400'
          } active:opacity-60`}
        >
          搜索
        </button>
      </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {showResults ? (
          renderResults()
        ) : (
          <>
            {renderHistory()}
            {renderHotTopics()}
          </>
        )}
      </div>

      {/* 底部导航 */}
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
          <span className="text-[11px] text-gray-600">超话</span>
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
    </div>
  )
}

export default ForumSearch

