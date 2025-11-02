/**
 * AI生活设置页面
 * 配置AI的日程、常去地点、作息习惯
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/ContactsContext'

interface Schedule {
  time: string
  activity: string
  location: string
}

interface FrequentPlace {
  name: string
  address: string
  frequency: string
}

interface RoutineTime {
  wakeUp: string
  sleep: string
  lunch: string
}

interface LifeConfig {
  schedule: Schedule[]
  frequentPlaces: FrequentPlace[]
  routineTime: RoutineTime
}

const LifeSettings = () => {
  const navigate = useNavigate()
  const { characterId } = useParams()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  
  const character = characters.find(c => c.id === characterId)
  
  // 加载配置
  const [config, setConfig] = useState<LifeConfig>(() => {
    const saved = localStorage.getItem(`life_config_${characterId}`)
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      schedule: [
        { time: '07:30', activity: '起床', location: '家' },
        { time: '08:00', activity: '洗漱吃早餐', location: '家' },
        { time: '09:00', activity: '到达公司', location: '公司' },
        { time: '12:00', activity: '午餐', location: '附近餐厅' },
        { time: '18:00', activity: '下班', location: '公司' },
        { time: '19:00', activity: '到家', location: '家' },
        { time: '23:00', activity: '睡觉', location: '家' },
      ],
      frequentPlaces: [
        { name: '家', address: '杨浦区某某路123号', frequency: '每天' },
        { name: '公司', address: '浦东新区陆家嘴金融中心', frequency: '工作日' },
        { name: '星巴克', address: '五角场万达广场', frequency: '周2-3次' },
        { name: '健身房', address: '附近健身中心', frequency: '周2次' },
      ],
      routineTime: {
        wakeUp: '07:30',
        sleep: '23:00',
        lunch: '12:00'
      }
    }
  })
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'places' | 'routine'>('schedule')
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null)
  const [editingPlace, setEditingPlace] = useState<number | null>(null)

  // 保存配置
  const saveConfig = (newConfig: LifeConfig) => {
    setConfig(newConfig)
    localStorage.setItem(`life_config_${characterId}`, JSON.stringify(newConfig))
    // 触发更新事件
    window.dispatchEvent(new Event('lifeConfigUpdate'))
  }

  // 添加日程
  const addSchedule = () => {
    const newSchedule = [...config.schedule, { time: '12:00', activity: '新活动', location: '地点' }]
    saveConfig({ ...config, schedule: newSchedule.sort((a, b) => a.time.localeCompare(b.time)) })
  }

  // 删除日程
  const deleteSchedule = (index: number) => {
    const newSchedule = config.schedule.filter((_, i) => i !== index)
    saveConfig({ ...config, schedule: newSchedule })
  }

  // 更新日程
  const updateSchedule = (index: number, field: keyof Schedule, value: string) => {
    const newSchedule = [...config.schedule]
    newSchedule[index] = { ...newSchedule[index], [field]: value }
    saveConfig({ ...config, schedule: newSchedule.sort((a, b) => a.time.localeCompare(b.time)) })
  }

  // 添加地点
  const addPlace = () => {
    const newPlaces = [...config.frequentPlaces, { name: '新地点', address: '地址', frequency: '偶尔' }]
    saveConfig({ ...config, frequentPlaces: newPlaces })
  }

  // 删除地点
  const deletePlace = (index: number) => {
    const newPlaces = config.frequentPlaces.filter((_, i) => i !== index)
    saveConfig({ ...config, frequentPlaces: newPlaces })
  }

  // 更新地点
  const updatePlace = (index: number, field: keyof FrequentPlace, value: string) => {
    const newPlaces = [...config.frequentPlaces]
    newPlaces[index] = { ...newPlaces[index], [field]: value }
    saveConfig({ ...config, frequentPlaces: newPlaces })
  }

  // 更新作息时间
  const updateRoutineTime = (field: keyof RoutineTime, value: string) => {
    saveConfig({ ...config, routineTime: { ...config.routineTime, [field]: value } })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <BackIcon size={24} />
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">{character?.name}的生活设置</h1>
          
          <div className="w-6"></div>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-t border-gray-100">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'schedule' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            日程安排
          </button>
          <button
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'places' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            常去地点
          </button>
          <button
            onClick={() => setActiveTab('routine')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'routine' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'
            }`}
          >
            作息时间
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 日程安排 */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            {config.schedule.map((item, index) => (
              <div key={index} className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
                {editingSchedule === index ? (
                  <div className="space-y-2">
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => updateSchedule(index, 'time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={item.activity}
                      onChange={(e) => updateSchedule(index, 'activity', e.target.value)}
                      placeholder="活动"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={item.location}
                      onChange={(e) => updateSchedule(index, 'location', e.target.value)}
                      placeholder="地点"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => setEditingSchedule(null)}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                    >
                      完成
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-sm font-mono text-blue-500">{item.time}</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{item.activity}</div>
                        <div className="text-xs text-gray-500">{item.location}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingSchedule(index)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteSchedule(index)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button
              onClick={addSchedule}
              className="w-full py-3 glass-card rounded-2xl text-blue-500 font-medium text-sm"
            >
              + 添加日程
            </button>
          </div>
        )}

        {/* 常去地点 */}
        {activeTab === 'places' && (
          <div className="space-y-3">
            {config.frequentPlaces.map((place, index) => (
              <div key={index} className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
                {editingPlace === index ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={place.name}
                      onChange={(e) => updatePlace(index, 'name', e.target.value)}
                      placeholder="地点名称"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={place.address}
                      onChange={(e) => updatePlace(index, 'address', e.target.value)}
                      placeholder="详细地址"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      value={place.frequency}
                      onChange={(e) => updatePlace(index, 'frequency', e.target.value)}
                      placeholder="频率（如：每天、周2次）"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => setEditingPlace(null)}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
                    >
                      完成
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">{place.name}</div>
                      <div className="text-xs text-gray-500 mb-1">{place.address}</div>
                      <div className="text-xs text-blue-500">{place.frequency}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPlace(index)}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deletePlace(index)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button
              onClick={addPlace}
              className="w-full py-3 glass-card rounded-2xl text-blue-500 font-medium text-sm"
            >
              + 添加地点
            </button>
          </div>
        )}

        {/* 作息时间 */}
        {activeTab === 'routine' && (
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-700">起床时间</div>
                <input
                  type="time"
                  value={config.routineTime.wakeUp}
                  onChange={(e) => updateRoutineTime('wakeUp', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-700">睡觉时间</div>
                <input
                  type="time"
                  value={config.routineTime.sleep}
                  onChange={(e) => updateRoutineTime('sleep', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            
            <div className="glass-card rounded-2xl p-4 backdrop-blur-md bg-white/80 border border-white/50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-700">午餐时间</div>
                <input
                  type="time"
                  value={config.routineTime.lunch}
                  onChange={(e) => updateRoutineTime('lunch', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LifeSettings
