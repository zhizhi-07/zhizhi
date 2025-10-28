/**
 * 美化设置页面
 * 包含字体设置、自定义图标等功能
 */

import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon } from '../components/Icons'
import { useSettings } from '../context/SettingsContext'

const Customize = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()

  // 设置项列表
  const settingItems = [
    {
      id: 'statusbar',
      name: '状态栏美化',
      description: '自定义状态栏样式',
      route: '/statusbar-customize'
    },
    {
      id: 'font',
      name: '字体设置',
      description: '自定义字体样式',
      route: '/font-customizer'
    },
    {
      id: 'icon',
      name: '自定义图标',
      description: '更换应用图标',
      route: '/icon-customizer'
    },
    {
      id: 'background',
      name: '背景',
      description: '桌面背景和音乐背景',
      route: '/background-customizer'
    },
    {
      id: 'bubble',
      name: '气泡样式',
      description: '自定义聊天气泡'
    }
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <BackIcon size={24} />
          </button>
          
          <h1 className="text-base font-semibold text-gray-900">美化设置</h1>
          
          <div className="w-6"></div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {settingItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.route) {
                  navigate(item.route)
                }
              }}
              className="glass-card rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all backdrop-blur-md bg-white/80 border border-white/50"
            >
              <div className="flex items-center gap-4">
                {/* 序号 */}
                <div className="w-10 h-10 rounded-full glass-card flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">{index + 1}</span>
                </div>
                
                {/* 信息 */}
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                </div>
                
                {/* 箭头 */}
                <svg 
                  className="w-5 h-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* 预留：后续添加的功能区域 */}
        <div className="mt-6 p-4 glass-card rounded-2xl backdrop-blur-md bg-white/60 border border-white/50">
          <p className="text-sm text-gray-600 text-center">
            更多美化功能正在开发中...
          </p>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-500 text-center">
          自定义你的专属界面风格
        </p>
      </div>
    </div>
  )
}

export default Customize
