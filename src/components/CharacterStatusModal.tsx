import { useEffect, useState } from 'react'
import ElectricBorderCard from './ElectricBorderCard'

interface StatusData {
  affection: number
  outfit: string      // 着装
  action: string      // 动作
  mood: string        // 心情
  thought: string     // 心声
  location: string    // 位置
  weather: string     // 天气
  timestamp?: number
  characterId?: string
}

interface CharacterStatusModalProps {
  isOpen: boolean
  onClose: () => void
  characterName: string
  characterId: string
}

const CharacterStatusModal = ({ isOpen, onClose, characterName, characterId }: CharacterStatusModalProps) => {
  const [mounted, setMounted] = useState(false)
  const [statusData, setStatusData] = useState<StatusData>({
    affection: 75,
    outfit: '白色棉质T恤，浅蓝色牛仔裤，白色运动鞋',
    action: '坐在沙发上，双腿自然交叠，手里拿着手机在回复消息',
    mood: '( ´ ▽ ` ) 轻松愉快',
    thought: '今天过得很充实呢',
    location: '家里的客厅',
    weather: '晴 25°C'
  })

  // 加载状态数据
  useEffect(() => {
    if (isOpen && characterId) {
      setMounted(true)
      
      // 从 localStorage 读取角色数据
      const loadStatus = () => {
        const savedData = localStorage.getItem(`character_status_${characterId}`)
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData)
            setStatusData(parsed)
            console.log('📊 加载角色状态:', parsed)
          } catch (e) {
            console.error('解析状态数据失败:', e)
          }
        }
      }
      
      // 初始加载
      loadStatus()
      
      // 设置定时器，每秒检查一次状态更新
      const interval = setInterval(loadStatus, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen, characterId])

  // 保存状态数据
  useEffect(() => {
    if (characterId && statusData) {
      const dataToSave = {
        ...statusData,
        characterId,
        timestamp: Date.now()
      }
      localStorage.setItem(`character_status_${characterId}`, JSON.stringify(dataToSave))
      console.log('💾 保存角色状态:', dataToSave)
    }
  }, [statusData, characterId])

  if (!isOpen && !mounted) return null

  return (
    <>
      {/* 遮罩层 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black z-50 transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'
        }`}
      />

      {/* 弹窗内容 */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* 电动边框容器 */}
        <ElectricBorderCard>
          <div className="w-96 bg-white/95 backdrop-blur-xl p-6 rounded-2xl max-h-[85vh] overflow-y-auto">
            {/* 标题 */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">状态栏</h2>
              <p className="text-gray-600 text-sm">{characterName}</p>
            </div>

            {/* 状态内容 */}
            <div className="space-y-3">
              {/* 时间日期卡片 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-3xl font-light text-gray-900 mb-1">
                    {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </div>
                </div>
              </div>

              {/* 环境信息卡片 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">☀️</span>
                  <span className="text-sm text-gray-600">天气</span>
                  <span className="text-sm text-gray-900 font-medium">{statusData.weather}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xl">📍</span>
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">坐标</span>
                    <div className="text-sm text-gray-900 mt-1">{statusData.location}</div>
                  </div>
                </div>
              </div>

              {/* 好感度卡片 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💕</span>
                    <span className="text-sm text-gray-600">好感度</span>
                  </div>
                  <span className="text-sm text-gray-900 font-bold">{statusData.affection}/100</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-400 to-pink-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${statusData.affection}%` }}
                  />
                </div>
              </div>

              {/* 当前状态卡片 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
                {/* 着装 */}
                <div className="flex items-start gap-2">
                  <span className="text-xl">👔</span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">着装</div>
                    <div className="text-sm text-gray-900 leading-relaxed">{statusData.outfit}</div>
                  </div>
                </div>
                
                {/* 动作 */}
                <div className="flex items-start gap-2">
                  <span className="text-xl">🎬</span>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">动作</div>
                    <div className="text-sm text-gray-900 leading-relaxed">{statusData.action}</div>
                  </div>
                </div>
              </div>

              {/* 心声卡片 */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💭</span>
                  <span className="text-sm text-gray-600">心声</span>
                </div>
                <div className="text-sm text-gray-900 leading-relaxed italic">
                  {statusData.thought}
                </div>
              </div>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 text-sm font-medium"
            >
              ▼ 收起
            </button>
          </div>
        </ElectricBorderCard>
      </div>
    </>
  )
}

export default CharacterStatusModal
