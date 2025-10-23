import { useEffect, useState } from 'react'
import statusIcons from '../assets/status-icons.png'

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

      {/* 右侧：状态图标（信号、WiFi、电池） */}
      <div className="flex items-center">
        <img src={statusIcons} alt="状态栏图标" className="h-4" />
      </div>
    </div>
  )
}

export default StatusBar



