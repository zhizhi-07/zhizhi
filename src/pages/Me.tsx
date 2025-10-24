import { useNavigate } from 'react-router-dom'
import { ServiceIcon, FavoriteIcon, MomentsIcon, WalletIcon, SettingsIcon, ImageIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getUserAvatar } from '../utils/avatarUtils'

const Me = () => {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()

  // 检查是否是自定义头像（base64图片）
  const isCustomAvatar = currentUser?.avatar && currentUser.avatar.startsWith('data:image')

  const menuGroups = [
    {
      id: 1,
      items: [{ id: 11, name: '服务', Icon: ServiceIcon, path: '/services' }],
    },
    {
      id: 2,
      items: [
        { id: 21, name: '收藏', Icon: FavoriteIcon, path: '' },
      ],
    },
    {
      id: 3,
      items: [{ id: 31, name: '设置', Icon: SettingsIcon, path: '/settings' }],
    },
  ]

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        {/* 全局背景层 */}
        <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
        
        {/* 内容层 */}
        <div className="relative z-10 h-full flex flex-col bg-transparent">
          {/* 顶部：StatusBar + 导航栏一体化 */}
          <div className={`sticky top-0 z-50 ${background ? 'glass-dark' : 'glass-effect'}`}>
            {showStatusBar && <StatusBar />}
            <div className="px-5 py-4">
              <button 
                onClick={() => navigate('/')}
                className="text-xl font-semibold text-gray-900 ios-button"
              >
                我
              </button>
            </div>
          </div>

      {/* 个人信息区域 */}
      <div className="px-3 pt-3 mb-3">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div 
            onClick={() => navigate('/wechat/profile')}
            className="flex items-center px-5 py-5 ios-button cursor-pointer"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-xl overflow-hidden">
              <img src={getUserAvatar(currentUser?.avatar)} alt="头像" className="w-full h-full object-cover" />
            </div>
            <div className="ml-4 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {currentUser?.name || '微信用户'}
              </h2>
              <p className="text-sm text-gray-500">微信号: {currentUser?.username || 'wxid_123456'}</p>
            </div>
            <span className="text-gray-400 text-2xl">›</span>
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3">
        {menuGroups.map((group) => (
          <div key={group.id} className="mb-3">
            <div className="glass-card rounded-2xl overflow-hidden">
              {group.items.map((item, index) => {
                const Icon = item.Icon
                return (
                  <div key={item.id}>
                    <div 
                      onClick={() => item.path && navigate(item.path)}
                      className="flex items-center px-4 py-4 ios-button cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center flex-shrink-0 shadow-lg border border-gray-200/50">
                        <Icon size={22} className="text-gray-600" />
                      </div>
                      <span className="ml-4 flex-1 text-gray-900 font-medium">
                        {item.name}
                      </span>
                      <span className="text-gray-400 text-xl">›</span>
                    </div>
                    {index < group.items.length - 1 && (
                      <div className="ml-16 border-b border-gray-100" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
        </div>
    </div>
  )
}

export default Me
