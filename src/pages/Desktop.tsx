import { useNavigate } from 'react-router-dom'
import React, { useState, useRef, useEffect } from 'react'
import StatusBar from '../components/StatusBar'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import CalendarWidget from '../components/CalendarWidget'
import { getImage } from '../utils/imageStorage'
import { fetchWeather, type WeatherData } from '../utils/weather'
import { 
  MusicIcon, HeartIcon, PauseIcon, SkipForwardIcon, PlayIcon,
  ChatIcon, SettingsIcon, FileIcon, ImageIcon,
  FootprintIcon, CalculatorIcon, CalendarIcon, GameIcon, MomentsIcon, BrowserIcon
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
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 加载自定义图标
  const [customIcons, setCustomIcons] = useState<{[key: string]: string}>({})
  
  // 加载背景
  const [desktopBackground, setDesktopBackground] = useState('')
  const [musicBackground, setMusicBackground] = useState('')
  
  // 天气数据
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  
  useEffect(() => {
    const loadCustomIcons = () => {
      const saved = localStorage.getItem('custom_desktop_icons')
      if (saved) {
        try {
          const icons = JSON.parse(saved)
          const iconMap: {[key: string]: string} = {}
          icons.forEach((icon: any) => {
            if (icon.customIcon) {
              iconMap[icon.id] = icon.customIcon
            }
          })
          setCustomIcons(iconMap)
        } catch (e) {
          console.error('加载自定义图标失败:', e)
        }
      } else {
        setCustomIcons({})
      }
    }
    loadCustomIcons()
    
    // 监听localStorage变化（包括同窗口触发的事件）
    window.addEventListener('storage', loadCustomIcons)
    
    // 监听自定义事件（用于同窗口更新）
    const handleCustomIconUpdate = () => {
      loadCustomIcons()
    }
    window.addEventListener('customIconUpdate', handleCustomIconUpdate)
    
    return () => {
      window.removeEventListener('storage', loadCustomIcons)
      window.removeEventListener('customIconUpdate', handleCustomIconUpdate)
    }
  }, [])
  
  // 加载背景
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const desktop = await getImage('desktop_background')
        if (desktop) setDesktopBackground(desktop)
        
        const music = await getImage('music_player_background')
        if (music) setMusicBackground(music)
      } catch (e) {
        console.error('加载背景失败:', e)
      }
    }
    loadBackgrounds()
    
    const handleDesktopBgUpdate = () => loadBackgrounds()
    const handleMusicBgUpdate = () => loadBackgrounds()
    
    window.addEventListener('desktopBackgroundUpdate', handleDesktopBgUpdate)
    window.addEventListener('musicBackgroundUpdate', handleMusicBgUpdate)
    
    return () => {
      window.removeEventListener('desktopBackgroundUpdate', handleDesktopBgUpdate)
      window.removeEventListener('musicBackgroundUpdate', handleMusicBgUpdate)
    }
  }, [])

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  // 加载天气数据
  useEffect(() => {
    const loadWeather = async () => {
      try {
        setWeatherLoading(true)
        
        // 检查是否启用自定义天气
        const customEnabled = localStorage.getItem('custom_weather_enabled') === 'true'
        const customData = localStorage.getItem('custom_weather_data')
        
        if (customEnabled && customData) {
          // 使用自定义天气
          try {
            const data = JSON.parse(customData)
            setWeather({
              temperature: parseInt(data.temp) || 25,
              condition: data.condition || '晴天',
              conditionCN: data.condition || '晴天',
              icon: '☀️',
              location: data.city || '自定义',
              humidity: 60,
              windSpeed: 10,
              airQuality: 'good'
            })
            setWeatherLoading(false)
            return
          } catch (e) {
            console.error('加载自定义天气失败:', e)
          }
        }
        
        // 使用真实天气
        const savedCity = localStorage.getItem('weather_city') || 'Beijing'
        const weatherData = await fetchWeather(savedCity)
        setWeather(weatherData)
      } catch (error) {
        console.error('获取天气失败:', error)
        // 如果失败，设置默认数据
        setWeather({
          temperature: 25,
          condition: 'sunny',
          conditionCN: '晴天',
          icon: '☀️',
          location: '北京',
          humidity: 60,
          windSpeed: 10,
          airQuality: 'good'
        })
      } finally {
        setWeatherLoading(false)
      }
    }
    
    loadWeather()
    
    // 每30分钟更新一次天气
    const weatherTimer = setInterval(loadWeather, 30 * 60 * 1000)
    
    // 监听城市切换事件
    const handleCityChange = () => {
      loadWeather()
    }
    window.addEventListener('weatherCityChange', handleCityChange)
    
    return () => {
      clearInterval(weatherTimer)
      window.removeEventListener('weatherCityChange', handleCityChange)
    }
  }, [])
  
  // 阻止浏览器的滑动手势（后退/前进）
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    let startX = 0
    let startY = 0
    
    const handleTouchStartPassive = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    
    const handleTouchMovePassive = (e: TouchEvent) => {
      const touch = e.touches[0]
      const diffX = Math.abs(touch.clientX - startX)
      const diffY = Math.abs(touch.clientY - startY)
      
      // 如果是水平滑动（X方向移动大于Y方向，且移动超过10px），阻止浏览器的后退手势
      if (diffX > diffY && diffX > 10) {
        e.preventDefault()
      }
      // 如果主要是垂直滑动，允许页面内滚动
    }
    
    // 使用原生事件监听，设置 passive: false 让 preventDefault 生效
    container.addEventListener('touchstart', handleTouchStartPassive)
    container.addEventListener('touchmove', handleTouchMovePassive, { passive: false })
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStartPassive)
      container.removeEventListener('touchmove', handleTouchMovePassive)
    }
  }, [])

  // 获取应用图标（优先使用自定义图标）
  const getAppIcon = (id: string, defaultIcon: React.ComponentType<any>) => {
    return customIcons[id] || defaultIcon
  }

  // 第一页应用
  const page1Apps: AppItem[] = [
    { id: 'wechat-app', name: '微信', icon: getAppIcon('wechat-app', ChatIcon), color: 'glass-card', route: '/wechat' },
    { id: 'preset', name: '预设', icon: getAppIcon('preset', SettingsIcon), color: 'glass-card', route: '/preset' },
    { id: 'worldbook', name: '世界书', icon: getAppIcon('worldbook', FileIcon), color: 'glass-card', route: '/worldbook' },
    { id: 'music-app', name: '音乐', icon: getAppIcon('music-app', MusicIcon), color: 'glass-card', route: '/music-player' },
    { id: 'settings', name: '系统设置', icon: getAppIcon('settings', SettingsIcon), color: 'glass-card', route: '/settings-new' },
  ]

  // 第二页应用
  const page2Apps: AppItem[] = [
    { id: 'footprint', name: '足迹', icon: getAppIcon('footprint', FootprintIcon), color: 'glass-card', route: '/ai-footprint' },
    { id: 'photos', name: '相册', icon: getAppIcon('photos', ImageIcon), color: 'glass-card', route: '/photos' },
    { id: 'calculator', name: '计算器', icon: getAppIcon('calculator', CalculatorIcon), color: 'glass-card', route: '/calculator' },
    { id: 'calendar', name: '日历', icon: getAppIcon('calendar', CalendarIcon), color: 'glass-card', route: '/calendar' },
    { id: 'games', name: '游戏', icon: getAppIcon('games', GameIcon), color: 'glass-card', route: '/games' },
    { id: 'moments', name: '朋友圈', icon: getAppIcon('moments', MomentsIcon), color: 'glass-card', route: '/moments' },
  ]

  // Dock 应用
  const dockApps: AppItem[] = [
    { id: 'offline', name: '线下', icon: getAppIcon('offline', ChatIcon), color: 'glass-card', route: '/offline-chat' },
    { id: 'customize', name: '美化', icon: getAppIcon('customize', SettingsIcon), color: 'glass-card', route: '/customize' },
    { id: 'api-config', name: 'API配置', icon: getAppIcon('api-config', SettingsIcon), color: 'glass-card', route: '/api-list' },
    { id: 'browser', name: '浏览器', icon: getAppIcon('browser', BrowserIcon), color: 'glass-card', route: '/browser' },
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
    <div className="h-screen w-full relative overflow-hidden bg-[#f5f7fa]" style={{ touchAction: 'pan-y pinch-zoom' }}>
      {/* 背景 */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: desktopBackground ? `url(${desktopBackground})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: desktopBackground ? 'transparent' : '#f5f7fa'
        }}
      >
        {!desktopBackground && <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-gray-100/30" />}
      </div>
      
      {/* 内容容器 */}
      <div className="relative h-full flex flex-col">
        <StatusBar />

        {/* 主要内容区域 - 整页滑动 */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden"
          style={{ touchAction: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="h-full flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {/* ========== 第一页 ========== */}
            <div className="min-w-full h-full px-4 py-2 overflow-y-auto flex flex-col hide-scrollbar">
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
                style={{
                  backgroundImage: musicBackground ? `url(${musicBackground})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
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
            <div className="min-w-full h-full px-4 py-2 overflow-y-auto flex flex-col hide-scrollbar">
              {/* 天气小组件 */}
              <div 
                className="glass-card rounded-3xl p-4 shadow-lg border border-white/30 relative bg-gradient-to-br from-white/80 to-white/40 mb-4 cursor-pointer ios-button"
                onClick={() => navigate('/weather-detail')}
                style={{ overflow: 'visible' }}
              >
                {/* 天气图标 - 根据实际天气动态显示 */}
                {weather && (() => {
                  const cond = weather.condition.toLowerCase()
                  
                  // 晴天 - 显示太阳
                  if (cond.includes('clear') || cond.includes('sunny') || cond === '晴天' || cond === '晴') {
                    return (
                      <div className="absolute -top-2 -right-2 w-20 h-20">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-300/20 blur-xl" />
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 shadow-lg" />
                        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/50 blur-md" />
                      </div>
                    )
                  }
                  
                  // 下雨 - 显示云+雨滴
                  if (cond.includes('rain') || cond === '雨' || cond.includes('shower')) {
                    return (
                      <div className="absolute top-4 right-6">
                        {/* 云朵 */}
                        <div className="relative w-16 h-10 mb-2">
                          <div className="absolute inset-0 rounded-full bg-gray-400/40 blur-sm translate-y-1" />
                          <div className="absolute bottom-0 left-2 w-8 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-md" />
                          <div className="absolute bottom-1 left-5 w-10 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-md" />
                          <div className="absolute bottom-0 right-1 w-7 h-5 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 shadow-md" />
                        </div>
                        {/* 雨滴 */}
                        <div className="flex gap-1 ml-4">
                          <div className="w-1 h-3 bg-blue-400/60 rounded-full"></div>
                          <div className="w-1 h-3 bg-blue-400/60 rounded-full"></div>
                          <div className="w-1 h-3 bg-blue-400/60 rounded-full"></div>
                        </div>
                      </div>
                    )
                  }
                  
                  // 多云 - 显示云朵
                  if (cond.includes('cloud') || cond === '多云' || cond === '阴') {
                    return (
                      <div className="absolute top-6 right-8 w-16 h-10">
                        <div className="absolute inset-0 rounded-full bg-gray-300/30 blur-sm translate-y-1" />
                        <div className="absolute bottom-0 left-2 w-8 h-6 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                        <div className="absolute bottom-1 left-5 w-10 h-7 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                        <div className="absolute bottom-0 right-1 w-7 h-5 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                      </div>
                    )
                  }
                  
                  // 雪 - 显示雪花
                  if (cond.includes('snow') || cond === '雪') {
                    return (
                      <div className="absolute top-4 right-6 text-4xl">
                        ❄️
                      </div>
                    )
                  }
                  
                  // 雾 - 显示雾气
                  if (cond.includes('fog') || cond.includes('mist') || cond === '雾') {
                    return (
                      <div className="absolute top-6 right-6 text-4xl opacity-70">
                        🌫️
                      </div>
                    )
                  }
                  
                  // 默认显示太阳（晴天）
                  return (
                    <div className="absolute -top-2 -right-2 w-20 h-20">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-300/20 blur-xl" />
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 shadow-lg" />
                      <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/50 blur-md" />
                    </div>
                  )
                })()}
                
                <div className="relative z-10 flex flex-col h-full">
                  {weatherLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : weather ? (
                    <>
                      <div className="text-5xl font-extralight text-gray-800 leading-none mb-1">
                        {weather.temperature}<span className="text-2xl align-top">°</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-auto capitalize">
                        {weather.conditionCN}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-1 text-[11px] text-gray-500">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor" opacity="0.6"/>
                          </svg>
                          <span>Air {weather.airQuality}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {weather.location}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">加载失败</div>
                  )}
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
