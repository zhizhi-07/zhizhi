import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ChatIcon, ContactIcon, DiscoverIcon, ProfileIcon } from './Icons'
import { useBackground } from '../context/BackgroundContext'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const { background: globalBackground } = useBackground()

  const tabs = [
    { name: '微信', path: '/wechat', Icon: ChatIcon },
    { name: '通讯录', path: '/wechat/contacts', Icon: ContactIcon },
    { name: '发现', path: '/wechat/discover', Icon: DiscoverIcon },
    { name: '我', path: '/wechat/me', Icon: ProfileIcon }
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
      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      {/* 底部导航栏 - 玻璃效果 */}
      <nav 
        className={`border-t border-gray-200/50 ${globalBackground ? 'glass-dark' : 'glass-effect'}`}
        role="navigation"
        aria-label="主导航"
      >
        <div className="h-16 flex items-center justify-around px-2">
          {tabs.map((tab, index) => {
            const Icon = tab.Icon
            const isActive = activeTab === index
            return (
              <button
                key={index}
                onClick={() => handleTabClick(index, tab.path)}
                className="flex flex-col items-center justify-center flex-1 py-2 ios-button"
                aria-label={`${tab.name}${isActive ? '，当前页面' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
              >
                <Icon
                  size={26}
                  className={`mb-1 smooth-transition ${
                    isActive ? 'text-wechat-primary scale-110' : 'text-gray-600'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`text-xs smooth-transition ${
                    isActive ? 'text-wechat-primary font-medium' : 'text-gray-600'
                  }`}
                >
                  {tab.name}
                </span>
              </button>
            )
          })}
        </div>
        {/* iOS Home Indicator */}
        <div className="flex justify-center pb-2" aria-hidden="true">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-40"></div>
        </div>
      </nav>
    </div>
  )
}

export default Layout

