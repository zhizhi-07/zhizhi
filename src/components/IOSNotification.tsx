import { useState, useEffect } from 'react'

interface IOSNotificationProps {
  show: boolean
  title: string
  subtitle?: string
  message: string
  icon?: string
  onClose: () => void
  onClick?: () => void
  duration?: number // 自动关闭时间（毫秒），默认5000ms
}

const IOSNotification = ({
  show,
  title,
  subtitle,
  message,
  icon,
  onClose,
  onClick,
  duration = 5000
}: IOSNotificationProps) => {
  const [visible, setVisible] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      
      // 自动关闭
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [show, duration])

  const handleClose = () => {
    setVisible(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaY = e.touches[0].clientY - startY
    if (deltaY < 0) { // 只允许向上滑动
      setCurrentY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (currentY < -50) { // 滑动超过50px则关闭
      handleClose()
    }
    setCurrentY(0)
    setIsDragging(false)
  }

  const handleClick = () => {
    // 点击通知触发跳转
    if (onClick) {
      onClick()
    }
    handleClose()
  }

  if (!show && !visible) return null

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div 
        className={`absolute top-0 left-0 right-0 flex justify-center px-2 pt-2 transition-all duration-300 pointer-events-auto ${
          visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
        style={{
          transform: `translateY(${visible ? currentY : -100}px)`
        }}
      >
        <div
          className="w-full max-w-[393px] bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl overflow-hidden cursor-pointer"
          onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)'
          }}
        >
          {/* 顶部指示条 */}
          <div className="w-full h-1 flex justify-center pt-1">
            <div className="w-9 h-1 bg-gray-300/60 rounded-full"></div>
          </div>

          {/* 通知内容 */}
          <div className="px-3 pt-2 pb-3">
            <div className="flex items-start gap-3">
              {/* 应用图标 */}
              <div className="flex-shrink-0 mt-0.5">
                {icon ? (
                  <img 
                    src={icon} 
                    alt={title}
                    className="w-8 h-8 rounded-lg"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12" y2="18"></line>
                    </svg>
                  </div>
                )}
              </div>

              {/* 文字内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-gray-900 truncate">
                    {title}
                  </span>
                  <span className="text-[11px] text-gray-500 flex-shrink-0">
                    现在
                  </span>
                </div>
                
                {subtitle && (
                  <div className="text-[13px] text-gray-600 mb-1 truncate">
                    {subtitle}
                  </div>
                )}
                
                <div className="text-[13px] text-gray-900 leading-[18px] line-clamp-3">
                  {message}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IOSNotification
