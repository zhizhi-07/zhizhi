import { useEffect, useState } from 'react'

const StatusBar = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div className="bg-transparent h-11 flex items-center justify-between px-6 text-sm font-semibold text-gray-900">
      {/* 左侧：时间 */}
      <div className="flex items-center gap-1">
        <span className="tracking-tight">{formatTime(currentTime)}</span>
      </div>

      {/* 中间：摄像头凹槽区域（仅用于美观，可选） */}
      <div className="flex-1" />

      {/* 右侧：信号、WiFi、电池 */}
      <div className="flex items-center gap-1.5">
        {/* 信号强度 */}
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="text-gray-900">
          <circle cx="2" cy="10" r="1.5" fill="currentColor" />
          <circle cx="6" cy="8" r="1.5" fill="currentColor" />
          <circle cx="10" cy="6" r="1.5" fill="currentColor" />
          <circle cx="14" cy="4" r="1.5" fill="currentColor" />
        </svg>

        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="text-gray-900">
          <path
            d="M8 11.5c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM8 7c1.38 0 2.63.56 3.54 1.46l-.71.71A3.965 3.965 0 008 8c-1.11 0-2.11.45-2.83 1.17l-.71-.71C5.37 7.56 6.62 7 8 7zM8 3c2.76 0 5.26 1.12 7.07 2.93l-.71.71A8.94 8.94 0 008 4a8.94 8.94 0 00-6.36 2.64l-.71-.71C2.74 4.12 5.24 3 8 3z"
            fill="currentColor"
          />
        </svg>

        {/* 电池 */}
        <div className="flex items-center gap-0.5">
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none" className="text-gray-900">
            <rect x="0.5" y="1.5" width="20" height="9" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
            <rect x="2" y="3" width="17" height="6" rx="1" fill="currentColor" />
            <path d="M22 4v4a1 1 0 001 1V3a1 1 0 00-1 1z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default StatusBar



