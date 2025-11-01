import { useNavigate } from 'react-router-dom'
import { useState, useRef } from 'react'
import StatusBar from '../components/StatusBar'
import { useUser } from '../context/UserContext'
import { 
  BackIcon, SearchIcon,
  SignalIcon, BellIcon, VolumeIcon, MoonIcon, SettingsIcon,
  SunIcon, LockIcon, ShieldIcon, ImageIcon, KeyIcon
} from '../components/Icons'

// 设置项接口
interface SettingItem {
  id: string
  title: string
  icon: React.ComponentType<any>
  iconColor: string
  value?: string
  route?: string
  badge?: string | number
}

// 设置分组接口
interface SettingGroup {
  id: string
  items: SettingItem[]
}

const SettingsNew = () => {
  const navigate = useNavigate()
  const { currentUser, updateUser } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 用户信息状态
  const [userAvatar, setUserAvatar] = useState(currentUser?.avatar || 'https://i.pravatar.cc/150?img=68')
  const [userSignature, setUserSignature] = useState(currentUser?.signature || '个性签名')
  
  // 处理头像上传
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    fileInputRef.current?.click()
  }
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      setUserAvatar(base64)
      
      // 更新用户信息
      if (currentUser) {
        updateUser(currentUser.id, { avatar: base64 })
        
        // 💾 保存头像指纹（用于检测头像变化）
        // 注意：GitHub Pages不支持vision识别，暂时跳过描述生成
        console.log('💾 保存用户头像指纹...')
        localStorage.setItem(`user_avatar_fingerprint_${currentUser.id}`, base64.substring(0, 200))
        localStorage.setItem(`user_avatar_recognized_at_${currentUser.id}`, Date.now().toString())
        console.log('✅ 头像已保存')
      }
    }
    reader.readAsDataURL(file)
  }

  // 设置分组数据
  const settingGroups: SettingGroup[] = [
    {
      id: 'group1',
      items: [
        { id: 'api', title: 'API 设置', icon: KeyIcon, iconColor: 'bg-orange-500', route: '/wechat/api-list' },
        { id: 'sound-upload', title: '声音上传', icon: VolumeIcon, iconColor: 'bg-gradient-to-br from-blue-400 to-purple-400', route: '/settings/sound-upload' },
        { id: 'cellular', title: '蜂窝网络', icon: SignalIcon, iconColor: 'bg-green-500', route: '/settings/cellular' },
        { id: 'hotspot', title: '个人热点', icon: SignalIcon, iconColor: 'bg-green-500', value: '关', route: '/settings/hotspot' },
      ]
    },
    {
      id: 'group2',
      items: [
        { id: 'notifications', title: '通知', icon: BellIcon, iconColor: 'bg-red-500', route: '/settings/notifications' },
        { id: 'sounds', title: '声音与触感', icon: VolumeIcon, iconColor: 'bg-pink-500', route: '/settings/sounds' },
        { id: 'focus', title: '专注模式', icon: MoonIcon, iconColor: 'bg-purple-500', route: '/settings/focus' },
        { id: 'screentime', title: '屏幕使用时间', icon: SettingsIcon, iconColor: 'bg-purple-500', route: '/settings/screentime' },
      ]
    },
    {
      id: 'group3',
      items: [
        { id: 'general', title: '通用', icon: SettingsIcon, iconColor: 'bg-gray-500', route: '/settings/general' },
        { id: 'control', title: '控制中心', icon: SettingsIcon, iconColor: 'bg-gray-500', route: '/settings/control' },
        { id: 'display', title: '显示与亮度', icon: SunIcon, iconColor: 'bg-blue-500', route: '/settings/display' },
        { id: 'wallpaper', title: '壁纸', icon: ImageIcon, iconColor: 'bg-blue-400', route: '/settings/wallpaper' },
        { id: 'siri', title: 'Siri 与搜索', icon: SearchIcon, iconColor: 'bg-gradient-to-br from-purple-500 to-pink-500', route: '/settings/siri' },
      ]
    },
    {
      id: 'group4',
      items: [
        { id: 'faceid', title: '面容 ID 与密码', icon: LockIcon, iconColor: 'bg-green-500', route: '/settings/faceid' },
        { id: 'emergency', title: '紧急联络', icon: BellIcon, iconColor: 'bg-red-500', route: '/settings/emergency' },
        { id: 'privacy', title: '隐私与安全性', icon: ShieldIcon, iconColor: 'bg-blue-500', route: '/settings/privacy' },
      ]
    },
  ]

  return (
    <div className="h-screen w-full bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 flex flex-col">
      {/* 状态栏 + 导航栏一体 */}
      <div className="backdrop-blur-xl bg-white/80 border-b border-white/50 shadow-sm">
        {/* 状态栏 */}
        <StatusBar />
        
        {/* 导航栏 */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <BackIcon size={24} className="text-blue-500" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">设置</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto">
        {/* 用户信息卡片 */}
        <div className="px-4 py-4">
          <div 
            className="backdrop-blur-xl bg-white/70 rounded-2xl p-4 shadow-lg border border-white/50 active:scale-95 transition-transform cursor-pointer"
            onClick={() => navigate(`/profile/${currentUser?.id || 'default'}`)}
          >
            <div className="flex items-center gap-3">
              {/* 头像 - 可点击上传 */}
              <div 
                className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAvatarClick}
              >
                <img src={userAvatar} alt={currentUser?.name || '用户'} className="w-full h-full object-cover" />
              </div>
              
              {/* 隐藏的文件上传input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              
              {/* 信息 */}
              <div className="flex-1">
                <div className="text-lg font-semibold text-gray-900">{currentUser?.name || '用户'}</div>
                <div className="text-sm text-gray-500">{userSignature}</div>
              </div>

              {/* 箭头 */}
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* 设置分组列表 */}
        {settingGroups.map((group) => (
          <div key={group.id} className="px-4 mb-4">
            <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              {group.items.map((item, index) => (
                <div key={item.id}>
                  <div
                    onClick={() => item.route && navigate(item.route)}
                    className="flex items-center gap-3 px-4 py-3 active:bg-gray-100/50 transition-colors cursor-pointer"
                  >
                    {/* 图标 */}
                    <div className={`w-8 h-8 ${item.iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <item.icon size={18} className="text-white" />
                    </div>

                    {/* 标题 */}
                    <div className="flex-1 text-base text-gray-900">{item.title}</div>

                    {/* 右侧值 */}
                    {item.value && (
                      <div className="text-sm text-gray-500">{item.value}</div>
                    )}

                    {/* 徽章 */}
                    {item.badge && (
                      <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </div>
                    )}

                    {/* 箭头 */}
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  {/* 分隔线 */}
                  {index < group.items.length - 1 && (
                    <div className="ml-14 border-b border-gray-200/50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* 底部空白 */}
        <div className="h-20" />
      </div>
    </div>
  )
}

export default SettingsNew
