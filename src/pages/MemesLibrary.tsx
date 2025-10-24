import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { memesData, Meme } from '../utils/memesRetrieval'
import { getMemeUsageCount } from '../utils/memeUsageTracker'

const MemesLibrary = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customMemes, setCustomMemes] = useState<Meme[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMeme, setNewMeme] = useState({ meme: '', meaning: '', keywords: '' })

  useEffect(() => {
    loadCustomMemes()
  }, [])

  const loadCustomMemes = () => {
    const saved = localStorage.getItem('custom_memes')
    if (saved) {
      try {
        setCustomMemes(JSON.parse(saved))
      } catch (error) {
        console.error('加载自定义热梗失败:', error)
      }
    }
  }

  const saveCustomMemes = (memes: Meme[]) => {
    localStorage.setItem('custom_memes', JSON.stringify(memes))
    setCustomMemes(memes)
  }

  const getAllMemes = () => {
    return [...memesData, ...customMemes]
  }

  const getCategories = () => {
    const categories = new Set<string>()
    getAllMemes().forEach(meme => {
      meme.keywords.forEach(keyword => {
        if (keyword.length <= 4) {
          categories.add(keyword)
        }
      })
    })
    return Array.from(categories).slice(0, 20)
  }

  const getFilteredMemes = () => {
    let filtered = getAllMemes()

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(meme =>
        meme.梗.toLowerCase().includes(query) ||
        meme.含义.toLowerCase().includes(query) ||
        meme.keywords.some(k => k.toLowerCase().includes(query))
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(meme =>
        meme.keywords.some(k => k.includes(selectedCategory))
      )
    }

    return filtered
  }

  const getTopUsedMemes = () => {
    return getAllMemes()
      .map(meme => ({
        ...meme,
        usageCount: getMemeUsageCount(meme.id)
      }))
      .filter(m => m.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
  }

  const handleAddMeme = () => {
    if (!newMeme.meme || !newMeme.meaning || !newMeme.keywords) {
      alert('请填写完整信息')
      return
    }

    const keywords = newMeme.keywords.split(/[,，\s]+/).filter(k => k.trim())
    const newId = Math.max(...getAllMemes().map(m => m.id), 0) + 1

    const meme: Meme = {
      id: newId,
      梗: newMeme.meme,
      含义: newMeme.meaning,
      keywords
    }

    saveCustomMemes([...customMemes, meme])
    setNewMeme({ meme: '', meaning: '', keywords: '' })
    setShowAddDialog(false)
  }

  const handleDeleteMeme = (id: number) => {
    if (confirm('确定要删除这个热梗吗？')) {
      saveCustomMemes(customMemes.filter(m => m.id !== id))
    }
  }

  const isCustomMeme = (id: number) => {
    return customMemes.some(m => m.id === id)
  }

  const filteredMemes = getFilteredMemes()
  const topMemes = getTopUsedMemes()
  const categories = getCategories()

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">热梗库</h1>
        <button
          onClick={() => setShowAddDialog(true)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">+</span>
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="px-4 pt-4 pb-3">
        <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索热梗、含义或关键词"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 ml-3 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 text-lg ios-button"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 热门热梗 */}
      {topMemes.length > 0 && !searchQuery && (
        <div className="px-4 pb-3">
          <div className="text-xs font-bold text-gray-600 mb-2.5 px-1">最常使用</div>
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar">
            {topMemes.map((meme) => (
              <div
                key={meme.id}
                className="flex-shrink-0 glass-card rounded-xl px-4 py-3 border border-orange-200/30"
              >
                <div className="text-sm font-bold text-gray-900 whitespace-nowrap mb-1">
                  {meme.梗}
                </div>
                <div className="text-xs text-orange-600 font-medium">
                  使用 {meme.usageCount} 次
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'glass-card text-blue-600 shadow-sm'
                : 'bg-white/50 text-gray-600'
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedCategory === category
                  ? 'glass-card text-blue-600 shadow-sm'
                  : 'bg-white/50 text-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 热梗列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4">
        {filteredMemes.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-gray-500 text-sm">没有找到相关热梗</div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMemes.map((meme) => {
              const usageCount = getMemeUsageCount(meme.id)
              const custom = isCustomMeme(meme.id)
              
              return (
                <div key={meme.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{meme.梗}</h3>
                        {custom && (
                          <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-lg font-medium">
                            自定义
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{meme.含义}</p>
                    </div>
                    {custom && (
                      <button
                        onClick={() => handleDeleteMeme(meme.id)}
                        className="ml-3 text-red-500 text-sm ios-button font-medium"
                      >
                        删除
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1.5">
                      {meme.keywords.slice(0, 5).map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                      {meme.keywords.length > 5 && (
                        <span className="px-2 py-1 text-gray-400 text-xs">
                          +{meme.keywords.length - 5}
                        </span>
                      )}
                    </div>
                    {usageCount > 0 && (
                      <div className="text-xs text-gray-500 font-medium ml-2">
                        使用 {usageCount} 次
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* 底部统计 */}
            <div className="text-center py-4 text-xs text-gray-400">
              共 {filteredMemes.length} 个热梗
            </div>
          </div>
        )}
      </div>

      {/* 添加热梗对话框 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-4">添加自定义热梗</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">热梗内容</label>
                <input
                  type="text"
                  value={newMeme.meme}
                  onChange={(e) => setNewMeme({ ...newMeme, meme: e.target.value })}
                  placeholder="例如：尊嘟假嘟"
                  className="w-full glass-card rounded-xl px-4 py-3 text-sm text-gray-900 border-none outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">含义说明</label>
                <textarea
                  value={newMeme.meaning}
                  onChange={(e) => setNewMeme({ ...newMeme, meaning: e.target.value })}
                  placeholder="例如：真的假的"
                  rows={3}
                  className="w-full glass-card rounded-xl px-4 py-3 text-sm text-gray-900 border-none outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">关键词（用逗号分隔）</label>
                <input
                  type="text"
                  value={newMeme.keywords}
                  onChange={(e) => setNewMeme({ ...newMeme, keywords: e.target.value })}
                  placeholder="例如：真的假的,尊嘟假嘟,震惊"
                  className="w-full glass-card rounded-xl px-4 py-3 text-sm text-gray-900 border-none outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddDialog(false)
                  setNewMeme({ meme: '', meaning: '', keywords: '' })
                }}
                className="flex-1 glass-card rounded-xl py-3 text-sm font-medium text-gray-700 ios-button"
              >
                取消
              </button>
              <button
                onClick={handleAddMeme}
                className="flex-1 bg-blue-500 text-white rounded-xl py-3 text-sm font-medium ios-button"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MemesLibrary
