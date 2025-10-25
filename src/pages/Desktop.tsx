import { useNavigate } from 'react-router-dom'
import React, { useState, useRef, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import CalendarWidget from '../components/CalendarWidget'
import { 
  MusicIcon, HeartIcon, PauseIcon, SkipForwardIcon, PlayIcon,
  ChatIcon, SettingsIcon, FileIcon, ImageIcon,
  CameraIcon, CalculatorIcon, CalendarIcon, GameIcon, MomentsIcon, BrowserIcon, BookIcon
} from '../components/Icons'

// 应用数据类型
interface AppItem {
  id: string
  name: string
  icon: React.ComponentType<any> | string  // 支持SVG组件或图片路径
  color: string
  route?: string
  onClick?: () => void
}

const Desktop = () => {
  const navigate = useNavigate()
  const musicPlayer = useMusicPlayer()
  const [currentPage, setCurrentPage] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 第一页应用
  const page1Apps: AppItem[] = [
    { id: 'wechat-app', name: '微信', icon: ChatIcon, color: 'glass-card', route: '/wechat' },
    { id: 'preset', name: '预设', icon: SettingsIcon, color: 'glass-card', route: '/preset' },
    { id: 'worldbook', name: '世界书', icon: FileIcon, color: 'glass-card', route: '/worldbook' },
    { id: 'music-app', name: '音乐', icon: MusicIcon, color: 'glass-card', route: '/music-player' },
    { id: 'settings', name: '应用设置', icon: SettingsIcon, color: 'glass-card', route: '/settings' },
  ]

  // 第二页应用
  const page2Apps: AppItem[] = [
    { id: 'camera', name: '相机', icon: CameraIcon, color: 'glass-card', route: '/camera' },
    { id: 'photos', name: '相册', icon: ImageIcon, color: 'glass-card', route: '/photos' },
    { id: 'calculator', name: '计算器', icon: CalculatorIcon, color: 'glass-card', route: '/calculator' },
    { id: 'calendar', name: '日历', icon: CalendarIcon, color: 'glass-card', route: '/calendar' },
    { id: 'games', name: '游戏', icon: GameIcon, color: 'glass-card', route: '/games' },
    { id: 'moments', name: '朋友圈', icon: MomentsIcon, color: 'glass-card', route: '/moments' },
  ]

  // Dock 应用
  const dockApps: AppItem[] = [
    { id: 'story', name: '故事', icon: BookIcon, color: 'glass-card', route: '/story' },
    { id: 'wechat', name: '微信', icon: ChatIcon, color: 'glass-card', route: '/wechat' },
    { id: 'music', name: '音乐', icon: MusicIcon, color: 'glass-card', route: '/music-player' },
    { id: 'browser', name: '浏览器', icon: BrowserIcon, color: 'glass-card', route: '/browser' },
  ]

  const handleAppClick = (e: React.MouseEvent, app: AppItem) => {
    e.preventDefault()
    e.stopPropagation()
    if (app.onClick) {
      app.onClick()
    } else if (app.route) {
      navigate(app.route)
    }
  }

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
    touchEndY.current = e.touches[0].clientY
    
    // 计算滑动距离
    const diffX = Math.abs(touchEndX.current - touchStartX.current)
    const diffY = Math.abs(touchEndY.current - touchStartY.current)
    
    // 如果是水平滑动（X方向移动大于Y方向），阻止默认行为（防止浏览器返回）
    if (diffX > diffY && diffX > 10) {
      e.preventDefault()
    }
  }

  // 触摸结束 - 判断滑动方向
  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current
    const diffY = Math.abs(touchEndY.current - touchStartY.current)
    const minSwipeDistance = 50

    // 只在水平滑动时切换页面（X方向移动大于Y方向）
    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > diffY) {
      if (diffX > 0 && currentPage < 1) {
        setCurrentPage(1)
      } else if (diffX < 0 && currentPage > 0) {
        setCurrentPage(0)
      }
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#f5f7fa]">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-gray-100/30" />
      
      {/* 内容容器 */}
      <div className="relative h-full flex flex-col">
        <StatusBar />

        {/* 主要内容区域 - 整页滑动 */}
        <div 
          className="flex-1 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {/* ========== 第一页 ========== */}
            <div className="min-w-full h-full px-4 py-2 overflow-y-auto flex flex-col">
              {/* 大时间 */}
              <div className="p-6 mb-4 text-center">
                <div className="text-8xl font-bold text-gray-900 mb-2">
                  {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-lg font-semibold text-gray-600">
                  {currentTime.toLocaleDateString('zh-CN', { 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>

              {/* 音乐播放器 - 2x4 大小 */}
              <div 
                className="glass-card rounded-3xl p-4 shadow-lg border border-white/30 relative overflow-visible cursor-pointer mb-4"
                onClick={() => navigate('/music-player')}
              >
                {musicPlayer.currentSong ? (
                  <div className="flex items-center gap-4">
                    {/* 左侧：黑胶唱片 - 使用音乐软件样式 */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      {/* 唱片外圈 - 玻璃效果 */}
                      <div 
                        className={`w-32 h-32 rounded-full backdrop-blur-md bg-white/20 shadow-2xl flex items-center justify-center border-2 border-white/30 ${musicPlayer.isPlaying ? 'animate-spin-slow' : ''}`}
                      >
                        {/* 唱片封面 */}
                        <div className="w-[115px] h-[115px] rounded-full overflow-hidden shadow-inner bg-white flex items-center justify-center">
                          {musicPlayer.currentSong.cover ? (
                            <img
                              src={musicPlayer.currentSong.cover}
                              alt={musicPlayer.currentSong.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <MusicIcon size={32} className="text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：歌曲信息和控制 */}
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div className="text-lg font-bold text-gray-900 truncate">{musicPlayer.currentSong.title}</div>
                      <div className="text-sm text-gray-500 truncate">{musicPlayer.currentSong.artist}</div>
                      
                      {/* 控制按钮 */}
                      <div className="flex items-center gap-3 mt-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                        >
                          <HeartIcon size={18} className="text-red-500" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            musicPlayer.togglePlay()
                          }}
                          className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                        >
                          {musicPlayer.isPlaying ? (
                            <PauseIcon size={18} className="text-gray-700" />
                          ) : (
                            <PlayIcon size={18} className="text-gray-700" />
                          )}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            musicPlayer.next()
                          }}
                          className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                        >
                          <SkipForwardIcon size={18} className="text-gray-700" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <div className="text-center">
                      <MusicIcon size={32} className="mx-auto mb-2" />
                      <div className="text-sm">暂无播放音乐</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 第一页应用 */}
              <div className="grid grid-cols-4 gap-4 auto-rows-min">
                {page1Apps.map((app) => {
                  const isImageIcon = typeof app.icon === 'string'
                  const isWechat = app.id === 'wechat-app'
                  
                  return (
                    <div
                      key={app.id}
                      onClick={(e) => handleAppClick(e, app)}
                      className={`flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform ${isWechat ? 'col-span-2 row-span-2' : ''}`}
                    >
                      {isImageIcon ? (
                        <div className={`${isWechat ? 'w-36 h-36' : 'w-14 h-14'} flex items-center justify-center`}>
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className={`${isWechat ? 'w-36 h-36' : 'w-14 h-14'} ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                          {React.createElement(app.icon as React.ComponentType<any>, { size: isWechat ? 64 : 28, className: "text-gray-300" })}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 text-center font-medium">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ========== 第二页 ========== */}
            <div className="min-w-full h-full px-4 py-2 overflow-y-auto flex flex-col">
              {/* 天气小组件 */}
              <div className="glass-card rounded-3xl p-4 shadow-lg border border-white/30 relative bg-gradient-to-br from-white/80 to-white/40 mb-4" style={{ overflow: 'visible' }}>
                <div className="absolute -top-2 -right-2 w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-300/20 blur-xl" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 shadow-lg" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/50 blur-md" />
                </div>
                
                <div className="absolute top-6 right-8 w-16 h-10">
                  <div className="absolute inset-0 rounded-full bg-gray-300/30 blur-sm translate-y-1" />
                  <div className="absolute bottom-0 left-2 w-8 h-6 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                  <div className="absolute bottom-1 left-5 w-10 h-7 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                  <div className="absolute bottom-0 right-1 w-7 h-5 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-5xl font-extralight text-gray-800 leading-none mb-1">
                    34<span className="text-2xl align-top">°</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-auto capitalize">sunny</div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-4">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor" opacity="0.6"/>
                    </svg>
                    <span>Air excellent</span>
                  </div>
                </div>
              </div>

              {/* 第二页应用和小组件 */}
              <div className="grid grid-cols-4 gap-4" style={{ gridAutoRows: '90px' }}>
                {/* 日历小组件 - 2x2 */}
                <div 
                  className="col-span-2 row-span-2 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => navigate('/calendar')}
                >
                  <CalendarWidget />
                </div>
                {page2Apps.map((app) => {
                  const isImageIcon = typeof app.icon === 'string'
                  return (
                    <div
                      key={app.id}
                      onClick={(e) => handleAppClick(e, app)}
                      className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      {isImageIcon ? (
                        <div className="w-14 h-14">
                          <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                          {React.createElement(app.icon as React.ComponentType<any>, { size: 28, className: "text-gray-300" })}
                        </div>
                      )}
                      <span className="text-xs text-gray-700 text-center font-medium">
                        {app.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 页面指示器 */}
        <div className="flex justify-center gap-2 py-4">
          {[0, 1].map((index) => (
            <div
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentPage 
                  ? 'bg-gray-800 w-6' 
                  : 'bg-gray-400 w-2 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Dock 栏 */}
        <div className="pb-6 px-4">
          <div className="glass-effect rounded-3xl p-3 shadow-xl border border-white/30">
            <div className="grid grid-cols-4 gap-3">
              {dockApps.map((app) => {
                const isImageIcon = typeof app.icon === 'string'
                return (
                  <div
                    key={app.id}
                    onClick={(e) => handleAppClick(e, app)}
                    className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                  >
                    {isImageIcon ? (
                      <div className="w-14 h-14">
                        <img src={app.icon as string} alt={app.name} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/30`}>
                        {React.createElement(app.icon as React.ComponentType<any>, { size: 28, className: "text-gray-300" })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Desktop
