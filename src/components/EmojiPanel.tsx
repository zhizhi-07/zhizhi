import { useState, useEffect, useRef } from 'react'
import { getEmojis, incrementUseCount, Emoji } from '../utils/emojiStorage'

interface EmojiPanelProps {
  show: boolean
  onClose: () => void
  onSelect: (emoji: Emoji) => void
}

const EmojiPanel = ({ show, onClose, onSelect }: EmojiPanelProps) => {
  const [emojis, setEmojis] = useState<Emoji[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'frequent'>('all')
  const emojisCacheRef = useRef<Emoji[] | null>(null) // 缓存表情包，避免重复加载

  useEffect(() => {
    if (show) {
      loadEmojis()
    }
  }, [show])

  const loadEmojis = async () => {
    console.log('🔍 EmojiPanel: 开始加载表情包...')
    try {
      // 添加3秒超时保护（兼容无痕模式）
      const loaded = await Promise.race([
        getEmojis(),
        new Promise<Emoji[]>((_, reject) => 
          setTimeout(() => reject(new Error('表情包加载超时')), 3000)
        )
      ])
      console.log(`🔍 EmojiPanel: 加载了 ${loaded.length} 个表情包`, loaded)
      
      // 更新缓存
      emojisCacheRef.current = loaded
      setEmojis(loaded)
    } catch (error) {
      console.warn('⚠️ EmojiPanel: 表情包加载失败（可能是无痕模式）:', error)
      // 加载失败时显示空列表
      setEmojis([])
      emojisCacheRef.current = []
    }
  }

  const handleSelectEmoji = (emoji: Emoji) => {
    // 立即发送表情包，不等待使用次数更新
    onSelect(emoji)
    onClose()
    
    // 异步更新使用次数，不阻塞界面
    incrementUseCount(emoji.id).catch(err => {
      console.error('更新表情包使用次数失败:', err)
    })
  }

  const frequentEmojis = emojis
    .filter(e => e.useCount > 0)
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 12)

  const displayEmojis = activeTab === 'frequent' ? frequentEmojis : emojis

  if (!show) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* 表情包面板 */}
      <div className="fixed bottom-0 left-0 right-0 glass-effect rounded-t-2xl z-50 max-h-[60vh] flex flex-col shadow-2xl">
        {/* 顶部标签栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'text-[#576B95] border-[#576B95]'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              全部表情
            </button>
            <button
              onClick={() => setActiveTab('frequent')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                activeTab === 'frequent'
                  ? 'text-[#576B95] border-[#576B95]'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              常用表情
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* 表情包网格 */}
        <div className="flex-1 overflow-y-auto p-4">
          {displayEmojis.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <svg className="w-12 h-12 mb-3" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <circle cx="9" cy="9" r="1"/>
                <circle cx="15" cy="9" r="1"/>
              </svg>
              <div className="text-sm">
                {activeTab === 'frequent' ? '还没有常用表情包' : '还没有表情包'}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {activeTab === 'frequent' ? '多发几次表情包就会出现在这里' : '在发现页面添加表情包'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {displayEmojis.map((emoji) => (
                <div
                  key={emoji.id}
                  onClick={() => handleSelectEmoji(emoji)}
                  className="relative aspect-square rounded-xl overflow-hidden glass-card shadow-lg border border-gray-200/50 active:scale-95 cursor-pointer transition-transform"
                >
                  <img
                    src={emoji.url}
                    alt={emoji.description}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {activeTab === 'frequent' && emoji.useCount > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {emoji.useCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default EmojiPanel
