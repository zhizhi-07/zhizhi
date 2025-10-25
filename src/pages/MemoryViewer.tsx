import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { memoryManager, Memory } from '../utils/memorySystem'
import memoryIcon from '../assets/memory-icon.webp'

const MemoryViewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  const character = id ? getCharacter(id) : undefined

  const [memories, setMemories] = useState<Memory[]>([])
  const [filter, setFilter] = useState<'all' | Memory['type']>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (id) {
      loadMemories()
    }
  }, [id, filter, searchKeyword])

  const loadMemories = () => {
    if (!id) return

    const system = memoryManager.getSystem(id)
    const query: any = {}
    
    if (filter !== 'all') {
      query.type = filter
    }
    
    if (searchKeyword) {
      query.keyword = searchKeyword
    }

    const results = system.searchMemories(query)
    setMemories(results)
    setStats(system.getStatistics())
  }

  const handleDeleteMemory = (memoryId: string) => {
    if (!id) return
    
    if (confirm('确定要删除这条记忆吗？')) {
      const system = memoryManager.getSystem(id)
      // @ts-ignore
      system.memories.delete(memoryId)
      // @ts-ignore
      system.saveMemories()
      loadMemories()
    }
  }

  const handleExport = () => {
    if (!id) return
    
    const system = memoryManager.getSystem(id)
    const data = system.exportMemories()
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${character?.name}_memories_${Date.now()}.json`
    a.click()
  }

  const getTypeLabel = (type: Memory['type']) => {
    const labels = {
      fact: '事实',
      preference: '偏好',
      event: '事件',
      emotion: '情绪',
      relationship: '关系'
    }
    return labels[type]
  }

  const getTypeColor = (type: Memory['type']) => {
    // 统一使用黑色
    return 'bg-gray-100 text-gray-900'
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    if (days < 365) return `${Math.floor(days / 30)}个月前`
    return `${Math.floor(days / 365)}年前`
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="ios-button text-gray-700 hover:text-gray-900"
            >
              <BackIcon size={24} />
            </button>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{character?.name} 的记忆</h1>
              {stats && (
                <p className="text-xs text-gray-500">
                  共 {stats.total} 条记忆
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleExport}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            导出
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.fact}</div>
              <div className="text-xs text-gray-500">事实</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.preference}</div>
              <div className="text-xs text-gray-500">偏好</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.event}</div>
              <div className="text-xs text-gray-500">事件</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.emotion}</div>
              <div className="text-xs text-gray-500">情绪</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{stats.byType.relationship}</div>
              <div className="text-xs text-gray-500">关系</div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="bg-white p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="搜索记忆..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'glass-card text-gray-700'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('fact')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'fact' 
                ? 'bg-gray-900 text-white' 
                : 'glass-card text-gray-700'
            }`}
          >
            事实
          </button>
          <button
            onClick={() => setFilter('preference')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'preference' 
                ? 'bg-gray-900 text-white' 
                : 'glass-card text-gray-700'
            }`}
          >
            偏好
          </button>
          <button
            onClick={() => setFilter('event')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'event' 
                ? 'bg-gray-900 text-white' 
                : 'glass-card text-gray-700'
            }`}
          >
            事件
          </button>
          <button
            onClick={() => setFilter('emotion')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'emotion' 
                ? 'bg-gray-900 text-white' 
                : 'glass-card text-gray-700'
            }`}
          >
            情绪
          </button>
          <button
            onClick={() => setFilter('relationship')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === 'relationship' 
                ? 'bg-gray-900 text-white' 
                : 'glass-card text-gray-700'
            }`}
          >
            关系
          </button>
        </div>
      </div>

      {/* 记忆列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {memories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <img src={memoryIcon} alt="记忆" className="w-20 h-20 mx-auto mb-3 opacity-30" />
            <div>暂无记忆</div>
          </div>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(memory.type)}`}>
                  {getTypeLabel(memory.type)}
                </span>
                <button
                  onClick={() => handleDeleteMemory(memory.id)}
                  className="text-gray-400 hover:text-red-500 text-xs"
                >
                  删除
                </button>
              </div>
              
              <div className="text-gray-800 mb-2">{memory.content}</div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span>重要度: {memory.importance.toFixed(1)}/10</span>
                  <span>访问: {memory.accessCount}次</span>
                </div>
                <span>{formatDate(memory.timestamp)}</span>
              </div>
              
              {memory.tags.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {memory.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MemoryViewer
