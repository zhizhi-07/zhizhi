import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getCoupleAnniversaries, getDaysUntil, formatAnniversaryDate, type CoupleAnniversary as Anniversary } from '../utils/coupleSpaceContentUtils'

const CoupleAnniversary = () => {
  const navigate = useNavigate()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([])

  useEffect(() => {
    loadAnniversaries()
  }, [])

  const loadAnniversaries = () => {
    const allAnniversaries = getCoupleAnniversaries()
    setAnniversaries(allAnniversaries)
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
      <div className="relative z-10 h-full flex flex-col">
        {/* 顶部栏 */}
        <div className={`sticky top-0 z-50 ${background ? 'glass-dark' : 'glass-effect'}`}>
          {showStatusBar && <StatusBar />}
          <div className="flex items-center justify-between px-5 py-4">
            <button 
              onClick={() => navigate(-1)}
              className="text-blue-500 ios-button"
            >
              返回
            </button>
            <h1 className="text-lg font-semibold text-gray-900">纪念日</h1>
            <button className="text-blue-500 ios-button">
              添加
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-6">
          {anniversaries.length === 0 ? (
            /* 空状态 */
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-md">
                <div className="glass-card rounded-3xl p-8 text-center space-y-6 shadow-xl border border-white/20">
                  <div className="w-24 h-24 mx-auto rounded-full glass-card flex items-center justify-center shadow-lg border border-white/30">
                    <svg className="w-12 h-12 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">暂无纪念日</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      在聊天中让AI用 [纪念日:日期|标题|描述] 添加
                      <br />
                      每一个纪念日都值得珍藏
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 纪念日列表 */
            <div className="space-y-4 pb-6">
              {anniversaries.map(anniversary => {
                const daysUntil = getDaysUntil(anniversary.date)
                const isPast = daysUntil < 0
                const isToday = daysUntil === 0
                
                return (
                  <div key={anniversary.id} className="glass-card rounded-2xl p-5 border border-white/20 shadow-lg">
                    <div className="flex items-start space-x-4">
                      {/* 日期显示 */}
                      <div className="w-16 h-16 rounded-2xl glass-card flex flex-col items-center justify-center flex-shrink-0 border border-white/30">
                        <span className="text-xs text-gray-600">{formatAnniversaryDate(anniversary.date)}</span>
                        {isToday ? (
                          <span className="text-xs text-pink-500 font-bold mt-1">今天</span>
                        ) : isPast ? (
                          <span className="text-xs text-gray-400 mt-1">{Math.abs(daysUntil)}天前</span>
                        ) : (
                          <span className="text-xs text-pink-500 mt-1">{daysUntil}天后</span>
                        )}
                      </div>
                      
                      {/* 内容 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {isToday && <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">今天</span>}
                          <h3 className="font-bold text-gray-900">{anniversary.title}</h3>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-2">{anniversary.characterName} 添加</p>
                        
                        {anniversary.description && (
                          <p className="text-sm text-gray-700 leading-relaxed">{anniversary.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CoupleAnniversary
