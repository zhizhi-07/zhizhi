import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCharacter } from '../context/CharacterContext'
import { useAILife } from '../context/AILifeContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, LocationIcon } from '../components/Icons'

const AIFootprint = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const { getAIStatus, getTodayTrack } = useAILife()
  const { characterId } = useParams()
  
  const character = characters.find(c => c.id === characterId) || characters[0]
  const aiStatus = getAIStatus(character?.id || '')
  const todayTrack = getTodayTrack(character?.id || '')
  
  // 加载生活配置
  const [lifeConfig, setLifeConfig] = useState<any>(null)
  
  useEffect(() => {
    const loadConfig = () => {
      const saved = localStorage.getItem(`life_config_${character?.id}`)
      if (saved) {
        setLifeConfig(JSON.parse(saved))
      }
    }
    loadConfig()
    
    // 监听配置更新
    const handleConfigUpdate = () => loadConfig()
    window.addEventListener('lifeConfigUpdate', handleConfigUpdate)
    return () => window.removeEventListener('lifeConfigUpdate', handleConfigUpdate)
  }, [character?.id])

  // 格式化时长
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '刚到'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
    }
    return `${mins}分钟`
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-50 to-white" />
      
      <div className="relative z-10 h-full flex flex-col">
        {/* 顶部导航栏 */}
        <div className="glass-effect sticky top-0 z-50">
          {showStatusBar && <StatusBar />}
          <div className="px-4 py-3 flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center ios-button"
            >
              <BackIcon size={20} className="text-gray-700" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900">{character?.name}的足迹</h1>
            </div>
            <button 
              onClick={() => navigate(`/life-settings/${character?.id}`)}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center ios-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15l9-9-9-9m0 18l-9-9 9-9" />
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m6-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* 主内容 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-6">
          {/* AI头像和基本信息 */}
          <div className="px-4 pt-4 pb-6">
            <div className="glass-card rounded-3xl p-6 text-center">
              <img 
                src={character?.avatar} 
                alt={character?.name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
              />
              <div className="text-2xl font-bold text-gray-900 mb-2">{character?.name}</div>
              <div className="text-sm text-gray-500">{aiStatus.mood}</div>
            </div>
          </div>

          {/* 实时状态卡片 */}
          <div className="px-4 mb-6">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">实时状态</h2>
              
              {/* 位置 */}
              <div className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center flex-shrink-0">
                  <LocationIcon size={20} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 mb-1">当前位置</div>
                  <div className="text-base font-semibold text-gray-900">{aiStatus.location}</div>
                  <div className="text-xs text-blue-500 mt-1">{aiStatus.activity}</div>
                </div>
              </div>

              {/* 在线状态 */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${aiStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">手机状态</div>
                    <div className="text-base font-semibold text-gray-900">
                      {aiStatus.screenOn ? '屏幕亮着' : '息屏中'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  正在使用: {aiStatus.currentApp}
                </div>
              </div>

              {/* 电量 */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="7" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="2" className={aiStatus.battery < 20 ? 'text-red-500' : 'text-green-500'} />
                      <rect x="6" y="9" width={`${(aiStatus.battery / 100) * 9}`} height="7" rx="1" fill="currentColor" className={aiStatus.battery < 20 ? 'text-red-500' : 'text-green-500'} />
                      <path d="M17 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-gray-400" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">手机电量</div>
                    <div className="text-base font-semibold text-gray-900">{aiStatus.battery}%</div>
                  </div>
                </div>
                {aiStatus.isCharging && (
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
                    </svg>
                    充电中
                  </div>
                )}
              </div>

              {/* 步数 */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 16c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zM6 16c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-gray-500">今日步数</div>
                  <div className="text-base font-semibold text-gray-900">{aiStatus.steps.toLocaleString()} 步</div>
                </div>
              </div>
            </div>
          </div>

          {/* 今日轨迹 */}
          <div className="px-4 mb-6">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">今日轨迹</h2>
              
              <div className="space-y-4">
                {todayTrack.map((point, index) => (
                  <div key={point.id} className="flex items-start gap-3 relative">
                    {/* 时间线 */}
                    {index < todayTrack.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-blue-300 to-transparent" />
                    )}
                    
                    {/* 时间 */}
                    <div className="w-16 text-sm text-gray-500 pt-2">{point.time}</div>
                    
                    {/* 圆点 */}
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-2 ${
                      index === todayTrack.length - 1 
                        ? 'bg-blue-500 ring-4 ring-blue-100' 
                        : 'bg-gray-300'
                    }`} />
                    
                    {/* 地点信息 */}
                    <div className="flex-1 glass-card rounded-2xl p-4">
                      <div className="font-semibold text-gray-900 mb-1">{point.location}</div>
                      <div className="text-sm text-gray-500">{point.activity}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        停留 {formatDuration(point.duration)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 作息时间 */}
          <div className="px-4 mb-6">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">作息规律</h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">通常起床时间</div>
                  <div className="text-base font-semibold text-gray-900">
                    {lifeConfig?.routineTime?.wakeUp || '07:30'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">通常睡觉时间</div>
                  <div className="text-base font-semibold text-gray-900">
                    {lifeConfig?.routineTime?.sleep || '23:00'}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">午餐时间</div>
                  <div className="text-base font-semibold text-gray-900">
                    {lifeConfig?.routineTime?.lunch || '12:00'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 常去地点 */}
          <div className="px-4">
            <div className="glass-card rounded-3xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">常去地点</h2>
              
              <div className="space-y-3">
                {(lifeConfig?.frequentPlaces || [
                  { name: '家', address: '杨浦区某某路123号', frequency: '每天' },
                  { name: '公司', address: '浦东新区陆家嘴金融中心', frequency: '工作日' },
                  { name: '星巴克', address: '五角场万达广场', frequency: '周2-3次' },
                  { name: '健身房', address: '附近健身中心', frequency: '周2次' },
                ]).map((place: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/50">
                    <LocationIcon size={20} className="text-blue-500 mt-1" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{place.name}</div>
                      <div className="text-xs text-gray-500">{place.address}</div>
                    </div>
                    <div className="text-xs text-gray-400">{place.frequency}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIFootprint

