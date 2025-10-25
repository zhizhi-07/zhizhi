import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getCoupleAnniversaries, addCoupleAnniversary, getDaysUntil, getAnniversaryBackground, type CoupleAnniversary as Anniversary } from '../utils/coupleSpaceContentUtils'
import { getCoupleSpaceRelation } from '../utils/coupleSpaceUtils'

const CoupleAnniversary = () => {
  const navigate = useNavigate()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [anniversaryDate, setAnniversaryDate] = useState('')
  const [anniversaryTitle, setAnniversaryTitle] = useState('')
  const [anniversaryDescription, setAnniversaryDescription] = useState('')
  const [selectedAnniversary, setSelectedAnniversary] = useState<Anniversary | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [bgImage, setBgImage] = useState<string | null>(null)

  useEffect(() => {
    loadAnniversaries()
    loadBackground()
    
    // 监听页面可见性变化，刷新背景
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadBackground()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  const loadBackground = () => {
    const bg = getAnniversaryBackground()
    setBgImage(bg)
  }

  const loadAnniversaries = () => {
    const allAnniversaries = getCoupleAnniversaries()
    setAnniversaries(allAnniversaries)
  }

  const handleAddAnniversary = () => {
    if (!anniversaryDate || !anniversaryTitle.trim()) {
      alert('请填写日期和标题')
      return
    }

    const relation = getCoupleSpaceRelation()
    if (!relation || relation.status !== 'active') {
      alert('请先开通情侣空间')
      return
    }

    addCoupleAnniversary(
      relation.characterId,
      '我',
      anniversaryDate,
      anniversaryTitle.trim(),
      anniversaryDescription.trim()
    )

    setAnniversaryDate('')
    setAnniversaryTitle('')
    setAnniversaryDescription('')
    setShowAddModal(false)
    loadAnniversaries()
    alert('纪念日已添加！')
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
            <button 
              onClick={() => setShowAddModal(true)}
              className="text-blue-500 ios-button"
            >
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
            /* 纪念日列表 - 网格布局 */
            <div className="grid grid-cols-2 gap-4 pb-6">
              {anniversaries.map(anniversary => {
                const daysUntil = getDaysUntil(anniversary.date)
                const isPast = daysUntil < 0
                const isToday = daysUntil === 0
                const daysCount = Math.abs(daysUntil)
                
                // 获取星期几
                const dateObj = new Date(anniversary.date)
                const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
                const weekday = weekdays[dateObj.getDay()]
                
                return (
                  <div 
                    key={anniversary.id} 
                    className="relative rounded-2xl overflow-hidden shadow-lg border border-white/20 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      setSelectedAnniversary(anniversary)
                      setShowDetailModal(true)
                    }}
                  >
                    {/* 背景图片 */}
                    {bgImage && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${bgImage})` }}
                      />
                    )}
                    {/* 半透明遮罩层 */}
                    <div className="absolute inset-0 bg-white/60" />
                    
                    {/* 内容层 */}
                    <div className="relative z-10">
                      {/* 顶部标题条 */}
                      <div className="px-4 py-3 text-center border-b border-white/20">
                        <h3 className="text-gray-900 text-base font-bold truncate">
                          {anniversary.title}
                        </h3>
                      </div>
                      
                      {/* 中间天数显示 */}
                      <div className="px-4 py-8">
                      <div className="text-center">
                        {isPast ? (
                          <div className="space-y-1">
                            <p className="text-gray-500 text-xs">已经过去</p>
                            <p className="text-5xl font-bold text-gray-800 tracking-tight leading-none">
                              {daysCount}
                            </p>
                            <p className="text-gray-500 text-sm">天</p>
                          </div>
                        ) : isToday ? (
                          <div className="space-y-1">
                            <p className="text-pink-500 text-sm font-bold">就是今天</p>
                            <p className="text-5xl font-bold text-pink-500 tracking-tight leading-none">
                              0
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-gray-500 text-xs">还有</p>
                            <p className="text-5xl font-bold text-gray-800 tracking-tight leading-none">
                              {daysCount}
                            </p>
                            <p className="text-gray-500 text-sm">天</p>
                          </div>
                        )}
                      </div>
                      </div>
                      
                      {/* 底部日期信息 */}
                      <div className="px-4 py-3 text-center border-t border-white/20">
                        <p className="text-gray-600 text-xs truncate">
                          {anniversary.date} {weekday}
                        </p>
                        {anniversary.description && (
                          <p className="text-gray-500 text-xs mt-1 truncate">
                            {anniversary.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 添加纪念日弹窗 */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">添加纪念日</h3>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">日期</label>
                  <input
                    type="date"
                    value={anniversaryDate}
                    onChange={(e) => setAnniversaryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">标题</label>
                  <input
                    type="text"
                    value={anniversaryTitle}
                    onChange={(e) => setAnniversaryTitle(e.target.value)}
                    placeholder="例如：第一次见面"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-700 mb-2">描述（可选）</label>
                  <textarea
                    value={anniversaryDescription}
                    onChange={(e) => setAnniversaryDescription(e.target.value)}
                    placeholder="记录这个特殊的日子..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button"
                >
                  取消
                </button>
                <button
                  onClick={handleAddAnniversary}
                  className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 纪念日详情弹窗 */}
        {showDetailModal && selectedAnniversary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowDetailModal(false)}
            />
            <div className="relative w-full max-w-md glass-card rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{selectedAnniversary.title}</h3>
              
              <div className="space-y-3">
                <div className="glass-card rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-gray-600 mb-1">目标日期</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedAnniversary.date}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {(() => {
                      const dateObj = new Date(selectedAnniversary.date)
                      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
                      return weekdays[dateObj.getDay()]
                    })()}
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-gray-600 mb-1">倒计时</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(() => {
                      const daysUntil = getDaysUntil(selectedAnniversary.date)
                      const isPast = daysUntil < 0
                      const isToday = daysUntil === 0
                      const daysCount = Math.abs(daysUntil)
                      
                      if (isToday) return '就是今天！'
                      if (isPast) return `已过 ${daysCount} 天`
                      return `还有 ${daysCount} 天`
                    })()}
                  </div>
                </div>
                
                {selectedAnniversary.description && (
                  <div className="glass-card rounded-xl p-4 border border-white/20">
                    <div className="text-sm text-gray-600 mb-1">描述</div>
                    <div className="text-sm text-gray-900 leading-relaxed">
                      {selectedAnniversary.description}
                    </div>
                  </div>
                )}
                
                <div className="glass-card rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-gray-600 mb-1">创建者</div>
                  <div className="text-sm text-gray-900">{selectedAnniversary.characterName}</div>
                </div>
                
                <div className="glass-card rounded-xl p-4 border border-white/20">
                  <div className="text-sm text-gray-600 mb-1">创建时间</div>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedAnniversary.createdAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button mt-4"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoupleAnniversary
