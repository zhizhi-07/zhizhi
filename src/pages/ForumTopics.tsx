/**
 * ForumTopics.tsx - 论坛话题/超话页面
 * 
 * 显示热门话题，可以关注话题
 * 
 * @module pages/ForumTopics
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, SearchIcon, AddIcon } from '../components/Icons'

interface Topic {
  id: string
  name: string
  description: string
  cover?: string
  postsCount: number
  followersCount: number
  isFollowing: boolean
  isHot: boolean
}

const ForumTopics = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [topics, setTopics] = useState<Topic[]>([])
  const [activeTab, setActiveTab] = useState<'hot' | 'following'>('hot')

  useEffect(() => {
    loadTopics()
    
    // 每3秒检查一次是否有新话题生成完成
    const interval = setInterval(() => {
      loadTopics()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const loadTopics = () => {
    // 从localStorage加载用户创建的话题
    const savedTopics = localStorage.getItem('forum_topics_list')
    let userTopics: Topic[] = []
    
    if (savedTopics) {
      try {
        userTopics = JSON.parse(savedTopics)
      } catch (e) {
        console.error('加载话题失败:', e)
      }
    }
    
    // 默认话题数据
    const defaultTopics: Topic[] = [
      {
        id: 'default_1',
        name: '今日热搜',
        description: '实时热点，大家都在看',
        postsCount: 128900,
        followersCount: 456700,
        isFollowing: false,
        isHot: true,
      },
      {
        id: 'default_2',
        name: '科技前沿',
        description: 'AI、编程、前沿科技讨论',
        postsCount: 89600,
        followersCount: 234500,
        isFollowing: false,
        isHot: true,
      },
      {
        id: 'default_3',
        name: '美食分享',
        description: '吃货天堂，分享美食',
        postsCount: 67800,
        followersCount: 189000,
        isFollowing: false,
        isHot: true,
      },
      {
        id: 'default_4',
        name: '游戏天地',
        description: '游戏资讯、攻略、交流',
        postsCount: 145600,
        followersCount: 567800,
        isFollowing: false,
        isHot: true,
      },
      {
        id: 'default_5',
        name: '摄影分享',
        description: '记录生活，分享美好瞬间',
        postsCount: 45600,
        followersCount: 123400,
        isFollowing: false,
        isHot: false,
      },
    ]
    
    // 合并用户话题和默认话题（用户话题在前）
    setTopics([...userTopics, ...defaultTopics])
  }

  const toggleFollow = (topicId: string) => {
    setTopics(prev => prev.map(t => 
      t.id === topicId ? { ...t, isFollowing: !t.isFollowing } : t
    ))
  }

  const formatCount = (count: number): string => {
    if (count < 10000) return (count / 1000).toFixed(1) + 'k'
    return (count / 10000).toFixed(1) + 'w'
  }

  const filteredTopics = activeTab === 'following' 
    ? topics.filter(t => t.isFollowing)
    : topics

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部玻璃白色区域 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/forum')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>

          <h1 className="text-[17px] font-semibold text-gray-900">超话</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/forum/search')}
              className="w-9 h-9 flex items-center justify-center active:opacity-60"
            >
              <SearchIcon size={20} className="text-gray-800" />
            </button>
            <button
              onClick={() => navigate('/forum/create-topic')}
              className="w-9 h-9 flex items-center justify-center active:opacity-60"
            >
              <AddIcon size={20} className="text-[#ff6c00]" />
            </button>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex items-center px-4 pb-2.5">
          <button
            onClick={() => setActiveTab('hot')}
            className={`px-3 py-1.5 text-[14px] rounded-full transition-all mr-3 ${
              activeTab === 'hot'
                ? 'bg-[#ff6c00] text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            热门
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-3 py-1.5 text-[14px] rounded-full transition-all ${
              activeTab === 'following'
                ? 'bg-[#ff6c00] text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            关注
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {filteredTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-4 opacity-30">
              <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeWidth="2"/>
            </svg>
            <p className="text-[14px]">暂无关注的话题</p>
          </div>
        ) : (
          <div>
            {filteredTopics.map((topic, index) => (
              <div
                key={topic.id}
                onClick={() => navigate(`/forum/topic/${topic.id}`)}
                className="bg-white mb-2 p-4 active:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  {/* 排名/图标 */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    topic.isHot && index < 3
                      ? 'bg-gradient-to-br from-[#ff8140] to-[#ff6c00]'
                      : 'bg-gray-100'
                  }`}>
                    {topic.isHot && index < 3 ? (
                      <span className="text-white font-bold text-[16px]">{index + 1}</span>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                        <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[16px] font-semibold text-gray-900">
                        #{topic.name}
                      </h3>
                      {topic.isHot && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-500 text-[11px] rounded">
                          热
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[13px] text-gray-500 mb-2">
                      {topic.description}
                    </p>
                    
                    <div className="flex items-center gap-3 text-[12px] text-gray-400">
                      <span>{formatCount(topic.postsCount)} 帖子</span>
                      <span>· {formatCount(topic.followersCount)} 人关注</span>
                    </div>
                  </div>

                  {/* 关注按钮 */}
                  <button
                    onClick={() => toggleFollow(topic.id)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex-shrink-0 ${
                      topic.isFollowing
                        ? 'bg-gray-100 text-gray-600 border border-gray-200'
                        : 'bg-[#ff6c00] text-white'
                    }`}
                  >
                    {topic.isFollowing ? '已关注' : '关注'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
        
        <button className="flex flex-col items-center gap-1 py-1">
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

export default ForumTopics

