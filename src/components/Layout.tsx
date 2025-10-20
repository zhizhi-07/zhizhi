import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ChatIcon, ContactIcon, DiscoverIcon, ProfileIcon } from './Icons'
import StatusBar from './StatusBar'
import { useSettings } from '../context/SettingsContext'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const { showStatusBar } = useSettings()
  
  // 全局背景
  const [globalBackground, setGlobalBackground] = useState(() => {
    const saved = localStorage.getItem('global_background')
    return saved || ''
  })

  // 监听全局背景变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('global_background')
      setGlobalBackground(saved || '')
    }
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(() => {
      const saved = localStorage.getItem('global_background')
      if (saved !== globalBackground) {
        setGlobalBackground(saved || '')
      }
    }, 500)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [globalBackground])

  const tabs = [
    { name: '微信', path: '/', Icon: ChatIcon },
    { name: '通讯录', path: '/contacts', Icon: ContactIcon },
    { name: '发现', path: '/discover', Icon: DiscoverIcon },
    { name: '我', path: '/me', Icon: ProfileIcon }
  ]

  useEffect(() => {
    const currentIndex = tabs.findIndex(tab => tab.path === location.pathname)
    if (currentIndex !== -1) {
      setActiveTab(currentIndex)
    }
  }, [location.pathname])

  const handleTabClick = (index: number, path: string) => {
    setActiveTab(index)
    navigate(path)
  }

  // 背景样式
  const backgroundStyle = globalBackground ? {
    backgroundImage: `url(${globalBackground})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  } : {}

  return (
    <div className={`h-screen flex flex-col ${globalBackground ? '' : 'gradient-bg'}`} style={backgroundStyle}>
      {/* iOS状态栏 - 根据设置显示 */}
      {showStatusBar && <StatusBar />}
      
      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* 底部导航栏 - 玻璃效果 */}
      <div className={`border-t border-gray-200/50 ${globalBackground ? 'glass-dark' : 'glass-effect'}`}>
        <div className="h-16 flex items-center justify-around px-2">
          {tabs.map((tab, index) => {
            const Icon = tab.Icon
            return (
              <button
                key={index}
                onClick={() => handleTabClick(index, tab.path)}
                className="flex flex-col items-center justify-center flex-1 py-2 ios-button"
              >
                <Icon
                  size={26}
                  className={`mb-1 smooth-transition ${
                    activeTab === index ? 'text-wechat-primary scale-110' : 'text-gray-600'
                  }`}
                />
                <span
                  className={`text-xs smooth-transition ${
                    activeTab === index ? 'text-wechat-primary font-medium' : 'text-gray-600'
                  }`}
                >
                  {tab.name}
                </span>
              </button>
            )
          })}
        </div>
        {/* iOS Home Indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-40"></div>
        </div>
      </div>
    </div>
  )
}

export default Layout

