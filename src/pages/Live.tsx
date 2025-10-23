import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const Live = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [activeTab, setActiveTab] = useState<'recommend' | 'following'>('recommend')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [liveCount, setLiveCount] = useState(6)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLiveCount(6)
    }, 1000)
  }

  const handleLoadMore = () => {
    setLiveCount(prev => prev + 4)
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 - 液态玻璃效果 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900 -ml-2 transition-colors"
          >
            <BackIcon size={24} />
          </button>
          <h1 className="text-base font-semibold text-gray-900">直播</h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
        {/* 搜索框 */}
        {showSearch && (
          <div className="mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索直播间或主播"
              className="w-full px-4 py-2 bg-gray-100 rounded-full text-sm outline-none focus:bg-gray-200 transition-colors"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('recommend')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'recommend' ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          推荐
          {activeTab === 'recommend' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-900 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('following')}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'following' ? 'text-gray-900' : 'text-gray-500'
          }`}
        >
          关注
          {activeTab === 'following' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-900 rounded-full"></div>
          )}
        </button>
      </div>

      {/* 直播内容区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'recommend' ? (
          <>
            {/* 分类筛选 */}
            <div className="p-4 pb-2">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                {['全部', '游戏', '娱乐', '美食', '音乐', '运动', '学习', '聊天'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category === '全部' ? null : category)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      (category === '全部' && !selectedCategory) || selectedCategory === category
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 下拉刷新提示 */}
            {isRefreshing && (
              <div className="flex justify-center py-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  刷新中...
                </div>
              </div>
            )}

            {/* 推荐直播 */}
            <div className="p-4 pt-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">正在直播</h3>
                <button 
                  onClick={handleRefresh}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  刷新
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: liveCount }, (_, i) => i + 1).map((item) => (
                  <div 
                    key={item} 
                    className="bg-white rounded-xl overflow-hidden cursor-pointer ios-button border border-gray-200 hover:border-gray-300 transition-all"
                    onClick={() => navigate(`/live/${item}`)}
                  >
                    {/* 直播封面 */}
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-gray-400 text-sm">直播封面</div>
                      </div>
                      {/* 观看人数标签 */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-white text-xs">
                        {(Math.random() * 10).toFixed(1)}万
                      </div>
                      {/* 直播中标签 */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 rounded text-white text-xs font-medium">
                        直播中
                      </div>
                    </div>
                    {/* 直播信息 */}
                    <div className="p-2.5">
                      <div className="flex items-start gap-2">
                        {/* 主播头像 */}
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            直播标题 {item}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            主播名称
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 加载更多按钮 */}
              {liveCount < 20 && (
                <button
                  onClick={handleLoadMore}
                  className="w-full mt-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-700 font-medium transition-colors"
                >
                  加载更多
                </button>
              )}
            </div>
          </>
        ) : (
          /* 关注的主播 */
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">我的关注</h3>
              <span className="text-xs text-gray-500">5人</span>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => {
                const isLive = item <= 2
                return (
                  <div 
                    key={item} 
                    className="bg-white rounded-xl p-3 flex items-center gap-3 cursor-pointer ios-button border border-gray-200 hover:border-gray-300 transition-all"
                    onClick={() => navigate(`/live/${item}`)}
                  >
                    {/* 主播头像 */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                      {isLive && (
                        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-red-500 rounded text-white text-xs font-medium">
                          直播中
                        </div>
                      )}
                    </div>
                    {/* 主播信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">主播名称 {item}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {isLive ? `${(Math.random() * 5 + 1).toFixed(1)}万人观看` : `最近直播：${item}小时前`}
                      </div>
                    </div>
                    {/* 操作按钮 */}
                    <button 
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isLive 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/live/${item}`)
                      }}
                    >
                      {isLive ? '进入直播间' : '查看详情'}
                    </button>
                  </div>
                )
              })}
            </div>
            
            {/* 空状态提示 */}
            <div className="mt-8 text-center text-gray-400 text-sm">
              <div className="mb-2">暂无更多关注的主播</div>
              <button className="text-gray-600 hover:text-gray-900 font-medium">
                去发现更多
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Live
