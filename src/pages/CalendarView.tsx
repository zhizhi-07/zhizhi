import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getCoupleAnniversaries, getDaysUntil, getAnniversaryBackground, setAnniversaryBackground, removeAnniversaryBackground, type CoupleAnniversary } from '../utils/coupleSpaceContentUtils'

const CalendarView = () => {
  const navigate = useNavigate()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [anniversaries, setAnniversaries] = useState<CoupleAnniversary[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [bgImage, setBgImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadAnniversaries()
    loadBackground()
  }, [])
  
  const loadBackground = () => {
    const bg = getAnniversaryBackground()
    setBgImage(bg)
  }

  const loadAnniversaries = () => {
    const allAnniversaries = getCoupleAnniversaries()
    setAnniversaries(allAnniversaries)
  }
  
  const handleUploadBackground = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const imageUrl = evt.target?.result as string
        setAnniversaryBackground(imageUrl)
        setBgImage(imageUrl)
        alert('背景上传成功！')
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleRemoveBackground = () => {
    if (confirm('确定要删除纪念日背景吗？')) {
      removeAnniversaryBackground()
      setBgImage(null)
    }
  }

  // 获取当月的天数
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  // 获取当月第一天是星期几
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // 上一月
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  // 下一月
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  // 回到今天
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 检查某一天是否有纪念日
  const getAnniversariesForDate = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return anniversaries.filter(ann => ann.date === dateStr)
  }

  // 渲染日历
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const days = []
    const today = new Date()
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
    
    // 空白格子（上个月的日期）
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }
    
    // 当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayAnniversaries = getAnniversariesForDate(year, month, day)
      const isToday = isCurrentMonth && day === today.getDate()
      const hasAnniversary = dayAnniversaries.length > 0
      
      days.push(
        <div
          key={day}
          className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all ${
            isToday 
              ? 'bg-blue-500 text-white font-bold' 
              : hasAnniversary
                ? 'glass-card border-2 border-pink-400 font-semibold'
                : 'glass-card hover:scale-105'
          }`}
          onClick={() => {
            if (hasAnniversary) {
              setSelectedDate(dateStr)
            }
          }}
        >
          <span className="text-sm">{day}</span>
          {hasAnniversary && (
            <div className="flex gap-0.5 mt-1">
              {dayAnniversaries.slice(0, 3).map((_, idx) => (
                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-pink-500" />
              ))}
            </div>
          )}
        </div>
      )
    }
    
    return days
  }

  const selectedAnniversaries = selectedDate 
    ? anniversaries.filter(ann => ann.date === selectedDate)
    : []

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
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">日历</h1>
              {/* 上传背景按钮 */}
              <button
                onClick={handleUploadBackground}
                className="w-8 h-8 rounded-full glass-card border border-white/20 flex items-center justify-center ios-button"
                title="设置纪念日背景"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              {/* 如果有背景，显示删除按钮 */}
              {bgImage && (
                <button
                  onClick={handleRemoveBackground}
                  className="w-8 h-8 rounded-full glass-card border border-red-200/30 flex items-center justify-center ios-button"
                  title="删除背景"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button 
              onClick={goToToday}
              className="text-blue-500 ios-button text-sm"
            >
              今天
            </button>
          </div>
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pt-4 pb-6">
          {/* 月份选择器 */}
          <div className="glass-card rounded-2xl p-4 mb-4 border border-white/20">
            <div className="flex items-center justify-between">
              <button 
                onClick={prevMonth}
                className="w-10 h-10 flex items-center justify-center ios-button glass-card rounded-full"
              >
                ←
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                </div>
              </div>
              <button 
                onClick={nextMonth}
                className="w-10 h-10 flex items-center justify-center ios-button glass-card rounded-full"
              >
                →
              </button>
            </div>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-sm text-gray-600 font-semibold">
                {day}
              </div>
            ))}
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>

          {/* 纪念日列表 */}
          {anniversaries.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">即将到来的纪念日</h2>
              <div className="space-y-2">
                {anniversaries
                  .filter(ann => getDaysUntil(ann.date) >= 0)
                  .slice(0, 5)
                  .map(ann => {
                    const daysUntil = getDaysUntil(ann.date)
                    return (
                      <div key={ann.id} className="glass-card rounded-xl p-3 border border-white/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{ann.title}</div>
                            <div className="text-xs text-gray-600 mt-1">{ann.date}</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${daysUntil === 0 ? 'text-pink-500' : 'text-gray-700'}`}>
                              {daysUntil === 0 ? '今天' : `${daysUntil}天后`}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* 选中日期的纪念日详情 */}
        {selectedDate && selectedAnniversaries.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedDate(null)}
            />
            <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-white/20">
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
                {selectedDate}
              </h3>
              <div className="space-y-3 mb-4">
                {selectedAnniversaries.map(ann => (
                  <div key={ann.id} className="glass-card rounded-xl p-4 border border-white/20">
                    <div className="font-bold text-gray-900 mb-1">{ann.title}</div>
                    {ann.description && (
                      <div className="text-sm text-gray-600">{ann.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {ann.characterName} 创建
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="w-full px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button"
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

export default CalendarView
