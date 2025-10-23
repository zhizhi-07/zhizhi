import { useNavigate } from 'react-router-dom'
import { ServiceIcon, FavoriteIcon, MomentsIcon, WalletIcon, SettingsIcon, ImageIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'
import { useBackground } from '../context/BackgroundContext'

const Me = () => {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const { background, getBackgroundStyle } = useBackground()

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
        { id: 22, name: '朋友圈', Icon: MomentsIcon, path: '/moments' },
        { id: 23, name: '卡包', Icon: WalletIcon, path: '/card-wallet' },
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
      <div 
        className="absolute inset-0 z-0"
        style={background ? getBackgroundStyle() : {
          background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
        }}
      />
      
      {/* 内容层 */}
      <div className="relative z-10 h-full flex flex-col">
      {/* 顶部标题栏 - 玻璃效果 */}
      <div className="glass-effect px-5 py-4 border-b border-gray-200/50">
        <h1 className="text-xl font-semibold text-gray-900">我</h1>
      </div>

      {/* 个人信息区域 */}
      <div className="px-3 pt-3 mb-3">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center px-5 py-5 ios-button cursor-pointer"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-xl overflow-hidden">
              {isCustomAvatar && currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="头像" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={40} className="text-gray-400" />
              )}
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
