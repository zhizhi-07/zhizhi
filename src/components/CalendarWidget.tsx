import { useState, useEffect } from 'react'
import { getCoupleAnniversaries, getDaysUntil, getAnniversaryBackground } from '../utils/coupleSpaceContentUtils'

const CalendarWidget = () => {
  const [currentDate] = useState(new Date())
  const [upcomingAnniversary, setUpcomingAnniversary] = useState<any>(null)
  const [bgImage, setBgImage] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    
    // 监听页面可见性变化，刷新背景
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData()
      }
    }
    
    // 监听窗口焦点，刷新背景
    const handleFocus = () => {
      loadData()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    // 定期刷新（每30秒检查一次）
    const interval = setInterval(loadData, 30000)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [])
  
  const loadData = () => {
    // 获取最近的纪念日
    const anniversaries = getCoupleAnniversaries()
    const upcoming = anniversaries
      .filter(ann => getDaysUntil(ann.date) >= 0)
      .sort((a, b) => getDaysUntil(a.date) - getDaysUntil(b.date))[0]
    
    setUpcomingAnniversary(upcoming)
    
    // 获取背景图片
    const bg = getAnniversaryBackground()
    setBgImage(bg)
  }

  const day = currentDate.getDate()
  const month = currentDate.getMonth() + 1
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][currentDate.getDay()]

  return (
    <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-lg border border-white/20 flex flex-col">
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
      <div className="relative z-10 flex-1 flex flex-col">
        {/* 顶部日期 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-gray-800 leading-none">{day}</div>
          <div className="text-xs text-gray-600 mt-2">{month}月 星期{weekday}</div>
        </div>
      
      {/* 底部纪念日提示 */}
      {upcomingAnniversary ? (
        <div className="px-3 py-3 bg-white/90 border-t border-white/30">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-700 truncate flex-1">
              {upcomingAnniversary.title}
            </span>
            <span className="text-xs font-bold text-pink-500 whitespace-nowrap">
              {(() => {
                const days = getDaysUntil(upcomingAnniversary.date)
                return days === 0 ? '今天' : `${days}天`
              })()}
            </span>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 bg-white/90 border-t border-white/30">
          <div className="text-xs text-gray-400 text-center">暂无纪念日</div>
        </div>
      )}
      </div>
    </div>
  )
}

export default CalendarWidget
