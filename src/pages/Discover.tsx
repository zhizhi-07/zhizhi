import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { MomentsIcon, VideoChannelIcon, LiveIcon, SearchIcon as SearchDiscoverIcon, MiniProgramIcon, AccountBookIcon, ShakeIcon } from '../components/Icons'
import EmojiManagement from '../components/EmojiManagement'

// 表情包图标组件
const EmojiIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>
)

// 小游戏图标组件
const GameIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
    <circle cx="8" cy="14" r="1"/>
    <circle cx="16" cy="14" r="1"/>
  </svg>
)

const Discover = () => {
  const navigate = useNavigate()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()
  const [showEmojiManagement, setShowEmojiManagement] = useState(false)

  const menuGroups = [
    {
      id: 1,
      items: [
        { id: 11, name: '朋友圈', Icon: MomentsIcon, path: '/moments' },
        { id: 12, name: '视频号', Icon: VideoChannelIcon, path: '' },
      ],
    },
    {
      id: 2,
      items: [
        { id: 21, name: '直播', Icon: LiveIcon, path: '/live' },
        { id: 22, name: '摇一摇', Icon: ShakeIcon, path: '/shake' },
      ],
    },
    {
      id: 3,
      items: [
        { id: 31, name: '表情包', Icon: EmojiIcon, path: '', action: 'emoji' },
        { id: 32, name: '搜一搜', Icon: SearchDiscoverIcon, path: '' },
      ],
    },
    {
      id: 4,
      items: [
        { id: 41, name: '记账本', Icon: AccountBookIcon, path: '/accounting' },
        { id: 42, name: '小程序', Icon: MiniProgramIcon, path: '/mini-programs' },
      ],
    },
    {
      id: 5,
      items: [
        { id: 51, name: '小游戏', Icon: GameIcon, path: '/games' },
      ],
    },
  ]

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
        <div className="relative z-10 h-full flex flex-col bg-transparent">
        {/* 顶部：StatusBar + 导航栏一体化 */}
        <div className={`sticky top-0 z-50 ${background ? 'glass-dark' : 'glass-effect'}`}>
          {showStatusBar && <StatusBar />}
          <div className="px-5 py-4">
            <button 
              onClick={() => navigate('/')}
              className="text-xl font-semibold text-gray-900 ios-button"
            >
              发现
            </button>
          </div>
        </div>

        {/* 发现列表 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
          {menuGroups.map((group) => (
            <div key={group.id} className="mb-3">
              <div className="glass-card rounded-2xl overflow-hidden">
                {group.items.map((item, index) => {
                  const Icon = item.Icon
                  return (
                    <div key={item.id}>
                      <div 
                        onClick={() => {
                          if (item.action === 'emoji') {
                            setShowEmojiManagement(true)
                          } else if (item.path) {
                            navigate(item.path)
                          }
                        }}
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

      {/* 表情包管理 */}
      <EmojiManagement
        show={showEmojiManagement}
        onClose={() => setShowEmojiManagement(false)}
      />
        </div>
    </div>
  )
}

export default Discover
