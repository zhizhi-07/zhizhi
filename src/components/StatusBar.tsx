import { useEffect, useState } from 'react'
import statusIcons from '../assets/status-icons.png'

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // 专注模式设置（可以在 localStorage 中自定义）
  const [focusMode, setFocusMode] = useState(() => {
    const saved = localStorage.getItem('focus_mode')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])
  
  // 监听专注模式变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('focus_mode')
      setFocusMode(saved ? JSON.parse(saved) : null)
    }
    
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div className="bg-transparent h-11 flex items-center justify-between pl-6 pr-2 text-sm font-semibold text-gray-900">
      {/* 左侧：时间（带绿色圆角背景） */}
      <div className="flex items-center gap-2">
        <span className="tracking-tight bg-green-500 text-white px-3 py-1 rounded-full text-base font-bold">
          {formatTime(currentTime)}
        </span>
        
        {/* 专注模式图标和文字 */}
        {focusMode && (focusMode.icon || focusMode.name) && (
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{
              backgroundColor: focusMode.showBg !== false ? (focusMode.color || '#9333ea') : 'transparent',
              color: focusMode.showBg !== false ? 'white' : '#111827'
            }}
          >
            {focusMode.icon && (
              <img src={focusMode.icon} alt="专注模式" className="w-4 h-4 object-cover rounded" />
            )}
            {focusMode.name && <span>{focusMode.name}</span>}
          </div>
        )}
      </div>

      {/* 中间：摄像头凹槽区域（仅用于美观，可选） */}
      <div className="flex-1" />

      {/* 右侧：状态图标（信号、WiFi、电池）- 放大 */}
      <div className="flex items-center">
        <img src={statusIcons} alt="状态栏图标" className="h-9" />
      </div>
    </div>
  )
}

export default StatusBar



