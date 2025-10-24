import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { 
  FileIcon, ClockIcon, MapIcon, MailIcon, PhoneIcon, BrowserIcon,
  CameraIcon, CalculatorIcon, WeatherIcon, CalendarIcon, SettingsIcon, GameIcon,
  MomentsIcon, MusicIcon, HeartIcon, PauseIcon, SkipForwardIcon, ContactIcon,
  WalletIcon, ImageIcon, ChatIcon
} from '../components/Icons'

// 应用数据类型
interface AppItem {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  route?: string
  onClick?: () => void
}

const Desktop = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  // 第一页应用
  const page1Apps: AppItem[] = [
    { id: 'files', name: '文件', icon: FileIcon, color: 'bg-blue-500', route: '/files' },
    { id: 'clock', name: '时钟', icon: ClockIcon, color: 'bg-gray-900', route: '/clock' },
    { id: 'maps', name: '地图', icon: MapIcon, color: 'bg-green-500', route: '/maps' },
    { id: 'mail', name: '邮件', icon: MailIcon, color: 'bg-blue-400', route: '/mail' },
    { id: 'alipay', name: '支付宝', icon: WalletIcon, color: 'bg-blue-600', route: '/wallet' },
    { id: 'translate', name: '翻译', icon: SettingsIcon, color: 'bg-gray-900', route: '/translate' },
    { id: 'notes', name: '备忘录', icon: FileIcon, color: 'bg-yellow-400', route: '/notes' },
    { id: 'contacts-app', name: '通讯录', icon: ContactIcon, color: 'bg-gray-400', route: '/wechat/contacts' },
  ]

  // 第二页应用
  const page2Apps: AppItem[] = [
    { id: 'camera', name: '相机', icon: CameraIcon, color: 'bg-gray-600', route: '/camera' },
    { id: 'photos', name: '相册', icon: ImageIcon, color: 'bg-gradient-to-br from-yellow-400 to-pink-500', route: '/photos' },
    { id: 'calculator', name: '计算器', icon: CalculatorIcon, color: 'bg-gray-800', route: '/calculator' },
    { id: 'weather', name: '天气', icon: WeatherIcon, color: 'bg-blue-400', route: '/weather' },
    { id: 'calendar', name: '日历', icon: CalendarIcon, color: 'bg-white border-2 border-red-500', route: '/calendar' },
    { id: 'settings', name: '设置', icon: SettingsIcon, color: 'bg-gray-500', route: '/wechat/settings' },
    { id: 'games', name: '游戏', icon: GameIcon, color: 'bg-purple-500', route: '/games' },
    { id: 'moments', name: '朋友圈', icon: MomentsIcon, color: 'bg-blue-500', route: '/moments' },
  ]

  const appPages = [page1Apps, page2Apps]
  const totalPages = appPages.length

  // Dock 应用
  const dockApps: AppItem[] = [
    { id: 'phone', name: '电话', icon: PhoneIcon, color: 'bg-green-500', route: '/phone' },
    { id: 'wechat', name: '微信', icon: ChatIcon, color: 'bg-green-600', route: '/wechat' },
    { id: 'music', name: '音乐', icon: MusicIcon, color: 'bg-yellow-500', route: '/music-player' },
    { id: 'browser', name: '浏览器', icon: BrowserIcon, color: 'bg-blue-500', route: '/browser' },
  ]

  const handleAppClick = (app: AppItem) => {
    if (app.onClick) {
      app.onClick()
    } else if (app.route) {
      navigate(app.route)
    }
  }

  // 触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  // 触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  // 触摸结束 - 判断滑动方向
  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50 // 最小滑动距离

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0 && currentPage < totalPages - 1) {
        // 向左滑动，下一页
        setCurrentPage(currentPage + 1)
      } else if (diffX < 0 && currentPage > 0) {
        // 向右滑动，上一页
        setCurrentPage(currentPage - 1)
      }
    }
  }

  return (
    <div className="h-screen w-full relative overflow-hidden bg-[#f5f7fa]">
      {/* 背景 - 白色干净风格 */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-gray-100/30" />
      
      {/* 内容容器 */}
      <div className="relative h-full flex flex-col">
        {/* 使用现有状态栏组件 */}
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
            {/* 第一页 */}
            <div className="min-w-full h-full px-4 py-2 overflow-y-auto">
              {/* 小组件区域 */}
              <div className="mb-6 space-y-4">
            {/* Siri 建议卡片 */}
            <div className="glass-card rounded-3xl p-4 shadow-lg border border-white/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="white" opacity="0.9"/>
                    <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
                    <path d="M8 14s1 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">你好，用户</div>
                  <div className="text-xs text-gray-500">今日概要</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>💪</span>
                  <span className="font-semibold text-red-500">健身</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🎵</span>
                  <span>80 BPM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏃</span>
                  <span>无数据</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💧</span>
                  <span>无数据</span>
                </div>
              </div>
            </div>

            {/* 音乐播放器 + 天气卡片 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 音乐播放器 - 黑胶唱片风格 */}
              <div 
                className="glass-card rounded-3xl p-3 shadow-lg border border-white/30 relative overflow-visible cursor-pointer"
                onClick={() => navigate('/music-player')}
              >
                {/* 歌曲名称 */}
                <div className="text-[10px] text-gray-500 mb-2 truncate font-medium">
                  酷狗音乐
                </div>
                
                {/* 黑胶唱片容器 */}
                <div className="relative w-full aspect-square mb-2">
                  {/* 黑胶唱片主体 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-blue-400 to-cyan-300 shadow-xl animate-spin-slow">
                    {/* 唱片纹理 */}
                    <div className="absolute inset-2 rounded-full border-[1.5px] border-white/20" />
                    <div className="absolute inset-4 rounded-full border border-white/10" />
                    <div className="absolute inset-6 rounded-full border border-white/10" />
                    
                    {/* 中心封面 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner flex items-center justify-center overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <MusicIcon size={20} className="text-blue-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 唱臂 */}
                  <div className="absolute -right-1 top-2 w-1 h-12 bg-gradient-to-b from-gray-700 to-gray-900 rounded-full shadow-lg origin-top rotate-12">
                    {/* 唱头 */}
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-gray-800 rounded-full shadow-md" />
                  </div>
                </div>
                
                {/* 控制按钮 */}
                <div className="flex items-center justify-between px-1">
                  <button className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                    <HeartIcon size={14} className="text-red-500" />
                  </button>
                  <button className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                    <PauseIcon size={14} className="text-gray-700" />
                  </button>
                  <button className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                    <SkipForwardIcon size={14} className="text-gray-700" />
                  </button>
                </div>
              </div>

              {/* 天气小组件 - 3D 拟物化 */}
              <div className="glass-card rounded-3xl p-4 shadow-lg border border-white/30 relative bg-gradient-to-br from-white/80 to-white/40" style={{ overflow: 'visible' }}>
                {/* 3D 太阳 */}
                <div className="absolute -top-2 -right-2 w-20 h-20">
                  {/* 太阳光晕 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300/40 to-orange-300/20 blur-xl" />
                  {/* 太阳主体 */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 shadow-lg" />
                  {/* 太阳高光 */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/50 blur-md" />
                </div>
                
                {/* 3D 云朵 */}
                <div className="absolute top-6 right-8 w-16 h-10">
                  {/* 云朵阴影 */}
                  <div className="absolute inset-0 rounded-full bg-gray-300/30 blur-sm translate-y-1" />
                  {/* 云朵主体 - 多个圆形组成 */}
                  <div className="absolute bottom-0 left-2 w-8 h-6 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                  <div className="absolute bottom-1 left-5 w-10 h-7 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                  <div className="absolute bottom-0 right-1 w-7 h-5 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-md" />
                </div>
                
                {/* 内容区 */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* 温度 */}
                  <div className="text-5xl font-extralight text-gray-800 leading-none mb-1">
                    34<span className="text-2xl align-top">°</span>
                  </div>
                  
                  {/* 天气描述 */}
                  <div className="text-sm text-gray-600 mb-auto capitalize">
                    sunny
                  </div>
                  
                  {/* 空气质量 */}
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-4">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" fill="currentColor" opacity="0.6"/>
                    </svg>
                    <span>Air excellent</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 应用图标网格 - 分页滑动 */}
          <div 
            className="relative overflow-hidden mb-6"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {appPages.map((pageApps, pageIndex) => (
                <div key={pageIndex} className="min-w-full grid grid-cols-4 gap-4 px-2">
                  {pageApps.map((app) => {
                    const IconComponent = app.icon
                    return (
                      <div
                        key={app.id}
                        onClick={() => handleAppClick(app)}
                        className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                      >
                        <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <IconComponent size={28} className="text-white" />
                        </div>
                        <span className="text-xs text-gray-700 text-center font-medium">
                          {app.name}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 页面指示器 - 可点击切换 */}
          <div className="flex justify-center gap-2 mb-6">
            {appPages.map((_, index) => (
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

        </div>

        {/* Dock 栏 */}
        <div className="pb-6 px-4">
          <div className="glass-effect rounded-3xl p-3 shadow-xl border border-white/30">
            <div className="grid grid-cols-4 gap-3">
              {dockApps.map((app) => {
                const IconComponent = app.icon
                return (
                  <div
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <IconComponent size={28} className="text-white" />
                    </div>
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
