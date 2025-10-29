/**
 * ForumInitialize.tsx - 论坛初始化页面
 * 
 * 选择要加入论坛的角色，并进行初始化
 * 
 * @module pages/ForumInitialize
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { BackIcon, AddIcon } from '../components/Icons'
import { 
  initializeForumCharacters, 
  saveForumCharacters,
  saveSelectedCharacterIds,
  getSelectedCharacterIds
} from '../utils/forumAI'
import type { Character } from '../context/CharacterContext'

const ForumInitialize = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // 读取上次选择
    return getSelectedCharacterIds()
  })
  const [initializing, setInitializing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, message: '' })

  useEffect(() => {
    // 如果没有角色，提示创建
    if (characters.length === 0) {
      // 可以显示提示或直接跳转
    }
  }, [characters])

  /**
   * 切换选择
   */
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  /**
   * 全选/全不选
   */
  const toggleSelectAll = () => {
    if (selectedIds.length === characters.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(characters.map(c => c.id))
    }
  }

  /**
   * 开始初始化
   */
  const handleInitialize = async () => {
    if (selectedIds.length === 0) {
      alert('请至少选择一个角色')
      return
    }

    const selectedCharacters = characters.filter(c => selectedIds.includes(c.id))
    
    setInitializing(true)
    setProgress({ current: 0, total: selectedCharacters.length + 1, message: '准备初始化...' })

    try {
      // 调用AI进行初始化（方案A - 顺序调用）
      const profiles = await initializeForumCharacters(
        selectedCharacters,
        (current, total, message) => {
          setProgress({ current, total, message })
        }
      )

      // 保存结果
      saveForumCharacters(profiles)
      saveSelectedCharacterIds(selectedIds)

      // 跳转到角色列表页
      navigate('/forum/character-list', { replace: true })
    } catch (error) {
      console.error('初始化失败:', error)
      alert('初始化失败，请检查API配置')
      setInitializing(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f7f7f7]">
      {/* 顶部 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {showStatusBar && <StatusBar />}
        
        <div className="px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => navigate('/forum/welcome')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
            disabled={initializing}
          >
            <BackIcon size={22} className="text-gray-800" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">选择角色</h1>
          <button
            onClick={() => navigate('/create-character')}
            className="w-9 h-9 flex items-center justify-center active:opacity-60"
            disabled={initializing}
          >
            <AddIcon size={20} className="text-[#ff6c00]" />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 说明 */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 m-4">
          <p className="text-[14px] text-gray-700 leading-relaxed">
            选择要加入论坛的角色，他们将根据自己的性格生成论坛昵称和签名
          </p>
        </div>

        {/* 统计和全选 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white mb-2">
          <span className="text-[14px] text-gray-600">
            已选择 <span className="text-[#ff6c00] font-semibold">{selectedIds.length}</span> / {characters.length} 个角色
          </span>
          <button
            onClick={toggleSelectAll}
            className="text-[14px] text-[#ff6c00] active:opacity-60"
            disabled={initializing}
          >
            {selectedIds.length === characters.length ? '全不选' : '全选'}
          </button>
        </div>

        {/* 角色列表 */}
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-4 opacity-30">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth="2"/>
            </svg>
            <p className="text-[14px] mb-4">还没有角色</p>
            <button
              onClick={() => navigate('/create-character')}
              className="px-6 py-2.5 bg-[#ff6c00] text-white rounded-full text-[14px] active:opacity-80"
            >
              创建第一个角色
            </button>
          </div>
        ) : (
          <div className="bg-white">
            {characters.map((character) => {
              const isSelected = selectedIds.includes(character.id)
              
              return (
                <button
                  key={character.id}
                  onClick={() => !initializing && toggleSelect(character.id)}
                  disabled={initializing}
                  className="w-full flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors"
                >
                  {/* 复选框 */}
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected 
                      ? 'border-[#ff6c00] bg-[#ff6c00]' 
                      : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* 头像 */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {character.avatar.startsWith('data:') ? (
                      <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        {character.avatar}
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[15px] font-medium text-gray-900 truncate">
                      {character.name}
                    </div>
                    <div className="text-[13px] text-gray-500 truncate">
                      {character.signature || character.description.substring(0, 30)}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={handleInitialize}
          disabled={selectedIds.length === 0 || initializing}
          className={`w-full py-3.5 rounded-full text-[16px] font-semibold transition-all ${
            selectedIds.length === 0 || initializing
              ? 'bg-gray-200 text-gray-400'
              : 'bg-gradient-to-r from-[#ff8140] to-[#ff6c00] text-white active:scale-98 shadow-lg'
          }`}
        >
          {initializing ? progress.message : `确定并初始化 (${selectedIds.length})`}
        </button>
        
        {/* 进度条 */}
        {initializing && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[12px] text-gray-500 mb-1">
              <span>{progress.current} / {progress.total}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ff8140] to-[#ff6c00] transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumInitialize


