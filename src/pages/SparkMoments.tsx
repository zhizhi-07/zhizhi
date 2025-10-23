import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'

interface SparkMoment {
  id: string
  contactId: string
  contactName: string
  contactAvatar: string
  content: string
  intensity: number
  timestamp: number
  category: 'chat' | 'moments' | 'call' | 'gift'
}

const SparkMoments = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const [sparkMoments, setSparkMoments] = useState<SparkMoment[]>([])
  const [selectedContact, setSelectedContact] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'time' | 'intensity'>('time')

  useEffect(() => {
    loadSparkMoments()
  }, [])

  const loadSparkMoments = () => {
    const saved = localStorage.getItem('spark_moments')
    if (saved) {
      try {
        const moments = JSON.parse(saved)
        setSparkMoments(moments)
      } catch (error) {
        console.error('加载火花时刻失败:', error)
      }
    }
  }

  const getFilteredMoments = () => {
    let filtered = sparkMoments
    
    if (selectedContact !== 'all') {
      filtered = filtered.filter(m => m.contactId === selectedContact)
    }

    if (sortBy === 'time') {
      filtered.sort((a, b) => b.timestamp - a.timestamp)
    } else {
      filtered.sort((a, b) => b.intensity - a.intensity)
    }

    return filtered
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return 'text-red-500'
    if (intensity >= 60) return 'text-orange-500'
    if (intensity >= 40) return 'text-yellow-500'
    return 'text-blue-500'
  }

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 80) return '强烈'
    if (intensity >= 60) return '明显'
    if (intensity >= 40) return '微弱'
    return '淡淡'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      chat: '聊天',
      moments: '朋友圈',
      call: '通话',
      gift: '礼物'
    }
    return labels[category] || category
  }

  const getStatistics = () => {
    const total = sparkMoments.length
    const avgIntensity = total > 0 
      ? Math.round(sparkMoments.reduce((sum, m) => sum + m.intensity, 0) / total)
      : 0
    
    const contactStats = sparkMoments.reduce((acc, m) => {
      acc[m.contactId] = (acc[m.contactId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostActive = Object.entries(contactStats)
      .sort(([, a], [, b]) => b - a)[0]

    return { total, avgIntensity, mostActive }
  }

  const filteredMoments = getFilteredMoments()
  const stats = getStatistics()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">火花时刻</h1>
        <div className="w-8" />
      </div>

      {/* 统计卡片 */}
      <div className="px-4 pt-4 pb-3">
        <div className="glass-card rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</div>
              <div className="text-xs text-gray-500">总时刻数</div>
            </div>
            <div className="text-center border-l border-r border-gray-200/50">
              <div className="text-3xl font-bold text-orange-500 mb-1">{stats.avgIntensity}</div>
              <div className="text-xs text-gray-500">平均强度</div>
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-gray-900 truncate mb-1">
                {stats.mostActive ? 
                  characters.find(c => c.id === stats.mostActive[0])?.name || '暂无' 
                  : '暂无'}
              </div>
              <div className="text-xs text-gray-500">最活跃</div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="px-4 pb-3 flex gap-3">
        <select
          value={selectedContact}
          onChange={(e) => setSelectedContact(e.target.value)}
          className="flex-1 glass-card rounded-xl px-4 py-3 text-sm text-gray-900 border-none outline-none font-medium"
        >
          <option value="all">全部联系人</option>
          {characters.map(char => (
            <option key={char.id} value={char.id}>{char.name}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'time' | 'intensity')}
          className="glass-card rounded-xl px-4 py-3 text-sm text-gray-900 border-none outline-none font-medium"
        >
          <option value="time">按时间</option>
          <option value="intensity">按强度</option>
        </select>
      </div>

      {/* 火花时刻列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4">
        {filteredMoments.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-gray-500 text-sm">暂无火花时刻</div>
            <div className="text-gray-400 text-xs mt-1">与AI互动时会自动记录</div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMoments.map((moment) => {
              const contact = characters.find(c => c.id === moment.contactId)
              return (
                <div key={moment.id} className="glass-card rounded-2xl p-5">
                  {/* 头部 */}
                  <div className="flex items-center mb-4">
                    <img
                      src={contact?.avatar || moment.contactAvatar}
                      alt={moment.contactName}
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-bold text-gray-900 text-base mb-0.5">
                        {contact?.name || moment.contactName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(moment.timestamp).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getIntensityColor(moment.intensity)} mb-0.5`}>
                        {moment.intensity}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getIntensityLabel(moment.intensity)}
                      </div>
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="bg-white/60 rounded-xl p-4 mb-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {moment.content}
                    </p>
                  </div>

                  {/* 标签 */}
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium">
                      {getCategoryLabel(moment.category)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < Math.floor(moment.intensity / 20)
                              ? getIntensityColor(moment.intensity).replace('text-', 'bg-')
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SparkMoments
