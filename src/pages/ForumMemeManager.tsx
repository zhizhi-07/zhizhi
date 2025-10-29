/**
 * ForumMemeManager.tsx - 论坛梗库管理页面
 * 
 * 论坛直接使用微信聊天的梗库，两者互通
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon } from '../components/Icons'
import { memesData } from '../utils/memesRetrieval'

const ForumMemeManager = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [memes, setMemes] = useState<Array<{ id: number, 梗: string, 含义: string }>>([])

  // 加载微信梗库
  useEffect(() => {
    setMemes(memesData)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部栏 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">梗库</h1>
        </div>
      </div>

      {/* 说明 */}
      <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
        <p className="text-sm text-blue-800 mb-2">
          💡 论坛与微信共享梗库，AI生成论坛内容时会自然融入这些梗
        </p>
        <button
          onClick={() => navigate('/settings-new')}
          className="text-sm text-[#ff6c00] font-medium active:opacity-60"
        >
          → 前往设置管理梗库
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 梗库列表 */}
        <div className="bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            当前梗库 ({memes.length}个)
          </h2>
          {memes.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              暂无梗，去设置里添加吧~
            </div>
          ) : (
            <div className="space-y-3">
              {memes.map((meme) => (
                <div
                  key={meme.id}
                  className="p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border border-orange-100"
                >
                  <div className="text-base font-medium text-gray-900 mb-1">
                    {meme['梗']}
                  </div>
                  <div className="text-sm text-gray-600">
                    {meme['含义']}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForumMemeManager
