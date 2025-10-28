import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon } from '../components/Icons'
import { getDiaries, generateDiary, saveDiary, deleteDiary, exportDiaries, Diary } from '../utils/diarySystem'
import { useCharacter } from '../context/CharacterContext'
import FlipPhotoCard from '../components/FlipPhotoCard'
import diaryIcon from '../assets/diary-icon.webp'
import pencilIcon from '../assets/pencil-icon.webp'
import calendarIcon from '../assets/calendar-icon.webp'
import trashIcon from '../assets/trash-icon.webp'

const DiaryPage = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { id } = useParams()
  const { getCharacter } = useCharacter()
  const character = id ? getCharacter(id) : undefined
  
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // 加载日记
  useEffect(() => {
    if (id) {
      const loaded = getDiaries(id)
      setDiaries(loaded)
    }
  }, [id])
  
  // 监听localStorage变化，实时更新日记列表
  useEffect(() => {
    if (!id) return
    
    const handleStorageChange = () => {
      const loaded = getDiaries(id)
      setDiaries(loaded)
      console.log('📔 日记列表已刷新，当前有', loaded.length, '篇日记')
    }
    
    const handleDiaryUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.characterId === id) {
        console.log('🔔 收到日记更新通知，立即刷新')
        handleStorageChange()
        // 自动展开最新的日记
        if (customEvent.detail?.diaryId) {
          setExpandedId(customEvent.detail.diaryId)
        }
      }
    }
    
    // 监听自定义事件（同标签页内，立即响应）
    window.addEventListener('diaryUpdated', handleDiaryUpdated)
    
    // 监听storage事件（跨标签页）
    window.addEventListener('storage', handleStorageChange)
    
    // 使用定时器定期检查（兜底方案）
    const interval = setInterval(handleStorageChange, 2000)
    
    return () => {
      window.removeEventListener('diaryUpdated', handleDiaryUpdated)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [id])
  
  // 生成新日记
  const handleGenerateDiary = async () => {
    if (!id || !character) return
    
    setIsGenerating(true)
    
    try {
      // 获取聊天记录
      const messagesKey = `chat_messages_${id}`
      const savedMessages = localStorage.getItem(messagesKey)
      const messages = savedMessages ? JSON.parse(savedMessages) : []
      
      // 获取当前状态
      const statusKey = `character_status_${id}`
      const savedStatus = localStorage.getItem(statusKey)
      const status = savedStatus ? JSON.parse(savedStatus) : {
        weather: '晴 25°C',
        location: '家里',
        mood: '平静'
      }
      
      // 生成日记（传递最近的日记，避免重复）
      const diary = await generateDiary(
        id,
        character.name,
        character.description,
        messages,
        status,
        diaries.slice(0, 3) // 传递最近3篇日记
      )
      
      if (diary) {
        // 保存日记
        saveDiary(id, diary)
        
        // 更新列表
        setDiaries(prev => [diary, ...prev])
        
        // 自动展开新日记
        setExpandedId(diary.id)
        
        // 提示
        alert('✅ 日记写好了！')
      } else {
        alert('TA今天不想写日记 😊')
      }
    } catch (error) {
      console.error('生成日记失败:', error)
      alert('❌ 生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // 删除日记
  const handleDelete = (diaryId: string) => {
    if (!id) return
    
    if (confirm('确定要删除这篇日记吗？')) {
      deleteDiary(id, diaryId)
      setDiaries(prev => prev.filter(d => d.id !== diaryId))
    }
  }
  
  // 导出日记
  const handleExport = () => {
    if (!id) return
    
    const text = exportDiaries(id)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${character?.name || 'TA'}的日记_${new Date().toLocaleDateString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col">
        {/* 顶部：StatusBar + 导航栏一体化 */}
        <div className="glass-effect shadow-sm bg-white/80 backdrop-blur-lg flex-shrink-0">
          {showStatusBar && <StatusBar />}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="ios-button text-gray-700 hover:text-gray-900"
            >
              <BackIcon size={24} />
            </button>
            
            <div className="flex items-center gap-2">
              <img src={diaryIcon} alt="日记" className="w-6 h-6 object-contain" />
              <h1 className="text-base font-semibold text-gray-900">
                {character?.name || 'TA'}的日记本
              </h1>
            </div>
            
            <button
              onClick={handleExport}
              className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-white/50 transition-colors"
              disabled={diaries.length === 0}
            >
              导出
            </button>
          </div>
        </div>
      
      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pb-20">
        {/* 生成按钮 */}
        <button
          onClick={handleGenerateDiary}
          disabled={isGenerating}
          className="w-full glass-card rounded-2xl p-6 mb-6 shadow-lg border border-white/50 hover:shadow-xl transition-all active:scale-98 disabled:opacity-50"
        >
          {isGenerating ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img src={pencilIcon} alt="写日记" className="w-12 h-12 object-contain" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-gray-700">
                {character?.name || 'TA'}正在写日记...
              </div>
              <div className="text-sm text-gray-500">
                回忆今天发生的事...
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <img src={pencilIcon} alt="写日记" className="w-16 h-16 object-contain" />
              <div className="text-lg font-medium text-gray-900">
                让TA写一篇日记
              </div>
              <div className="text-sm text-gray-500">
                点击后，TA会根据最近的聊天写一篇日记
              </div>
            </div>
          )}
        </button>
        
        {/* 日记列表 */}
        {diaries.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center shadow-lg border border-white/50">
            <img src={diaryIcon} alt="日记" className="w-24 h-24 object-contain mx-auto mb-4" />
            <div className="text-gray-600 mb-2">还没有日记</div>
            <div className="text-sm text-gray-400">
              点击上面的按钮，让TA写第一篇日记吧
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {diaries.map((diary) => (
              <div
                key={diary.id}
                className="glass-card rounded-2xl p-5 shadow-lg border border-white/50 hover:shadow-xl transition-all"
              >
                {/* 日记头部 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={calendarIcon} alt="日期" className="w-4 h-4 object-contain" />
                      <span className="text-sm font-medium text-gray-700">
                        {diary.date} {diary.time}
                      </span>
                    </div>
                    {diary.weather && (
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>☀️ {diary.weather}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDelete(diary.id)}
                    className="text-gray-400 hover:opacity-70 transition-opacity p-1"
                  >
                    <img src={trashIcon} alt="删除" className="w-5 h-5 object-contain" />
                  </button>
                </div>
                
                {/* 日记内容 */}
                <div
                  className={`text-gray-800 leading-relaxed ${
                    expandedId === diary.id ? 'max-h-[600px] overflow-y-auto' : ''
                  }`}
                >
                  {diary.content.split(/(\[照片:.+?\])/).map((part, index) => {
                    // 检查是否是照片标记
                    const photoMatch = part.match(/\[照片:(.+?)\]/)
                    if (photoMatch) {
                      const description = photoMatch[1]
                      return (
                        <div key={index} className="my-3 flex justify-center">
                          <FlipPhotoCard 
                            description={description}
                            messageId={Date.now() + index}
                          />
                        </div>
                      )
                    }
                    // 普通文本，保留换行
                    return <span key={index} className="whitespace-pre-wrap">{part}</span>
                  })}
                </div>
                
                {/* 展开/收起按钮 */}
                {diary.content.length > 100 && (
                  <button
                    onClick={() => setExpandedId(expandedId === diary.id ? null : diary.id)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {expandedId === diary.id ? '▲ 收起' : '▼ 展开阅读'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* 统计信息 */}
        {diaries.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            共 {diaries.length} 篇日记
          </div>
        )}
        </div>
      </div>
      </div>
    </div>
  )
}

export default DiaryPage
