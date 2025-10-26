import { useState, useEffect } from 'react'
import { XiaohongshuNote } from '../types/xiaohongshu'
import { searchXiaohongshuNotes, getRecommendedNotes } from '../utils/xiaohongshuApi'
import { SearchIcon } from './Icons'

interface XiaohongshuSelectorProps {
  onClose: () => void
  onSelect: (note: XiaohongshuNote) => void
}

const XiaohongshuSelector = ({ onClose, onSelect }: XiaohongshuSelectorProps) => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [notes, setNotes] = useState<XiaohongshuNote[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('推荐')

  const categories = ['推荐', '美食', '穿搭', '美妆', '旅行', '探店']

  // 加载推荐内容
  useEffect(() => {
    loadRecommended()
  }, [])

  const loadRecommended = async () => {
    setLoading(true)
    try {
      const recommended = await getRecommendedNotes(6)
      setNotes(recommended)
    } catch (error) {
      console.error('加载推荐失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索
  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadRecommended()
      return
    }

    setLoading(true)
    try {
      const result = await searchXiaohongshuNotes(searchKeyword, 10)
      setNotes(result.notes)
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 按分类搜索
  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category)
    if (category === '推荐') {
      loadRecommended()
    } else {
      setLoading(true)
      try {
        const result = await searchXiaohongshuNotes(category, 10)
        setNotes(result.notes)
      } catch (error) {
        console.error('加载分类失败:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w'
    }
    return num.toString()
  }

  return (
    <>
      {/* 遮罩层 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
      />

      {/* 选择器内容 */}
      <div className="fixed inset-x-4 top-20 bottom-20 bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">选择小红书笔记</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose()
                // 触发手动输入
                const event = new CustomEvent('openXiaohongshuInput')
                window.dispatchEvent(event)
              }}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
            >
              ✏️ 手动输入
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <SearchIcon size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="搜索小红书笔记..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400"
            />
            {searchKeyword && (
              <button
                onClick={() => {
                  setSearchKeyword('')
                  loadRecommended()
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-200 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 笔记列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">加载中...</div>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📕</div>
                <div>暂无相关笔记</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelect(note)}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {/* 封面图 */}
                  <div className="relative w-full pb-[133%] bg-gray-100">
                    <img
                      src={note.coverImage}
                      alt={note.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI2NyIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pjwvc3ZnPg=='
                      }}
                    />
                  </div>

                  {/* 信息 */}
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {note.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>❤️</span>
                        <span>{formatNumber(note.stats.likes)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>💬</span>
                        <span>{formatNumber(note.stats.comments)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default XiaohongshuSelector
