import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import sparkIcon from '../assets/spark-icon.webp'
import memesIcon from '../assets/memes-icon.webp'
import musicIcon from '../assets/music-icon.webp'
import bubbleIcon from '../assets/bubble-icon.webp'
import fontIcon from '../assets/font-icon.webp'

const MiniPrograms = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()

  const programs = [
    {
      id: 1,
      name: '火花时刻',
      description: '查看与AI的美好瞬间',
      icon: sparkIcon,
      path: '/spark-moments',
      color: 'bg-orange-500'
    },
    {
      id: 2,
      name: '热梗库',
      description: '浏览和管理流行热梗',
      icon: memesIcon,
      path: '/memes-library',
      color: 'bg-red-500'
    },
    {
      id: 3,
      name: '音乐',
      description: '享受美妙的音乐时光',
      icon: musicIcon,
      path: '/music-player',
      color: 'bg-gradient-to-br from-pink-500 to-purple-500'
    },
    {
      id: 4,
      name: '气泡商店',
      description: '选择你喜欢的聊天气泡样式',
      icon: bubbleIcon,
      path: '/bubble-store',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500'
    },
    {
      id: 5,
      name: '字体设置',
      description: '自定义聊天字体样式',
      icon: fontIcon,
      path: '/font-customizer',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500'
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">小程序</h1>
        <div className="w-8" />
      </div>

      {/* 小程序列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <div className="space-y-3">
          {programs.map((program) => (
            <div
              key={program.id}
              onClick={() => navigate(program.path)}
              className="glass-card rounded-2xl p-5 ios-button cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <img src={program.icon} alt={program.name} className="w-16 h-16 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1">
                    {program.name}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {program.description}
                  </p>
                </div>
                <div className="text-gray-300 text-2xl flex-shrink-0">
                  ›
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 占位提示 */}
        <div className="mt-6 glass-card rounded-2xl p-6 text-center">
          <div className="text-gray-400 text-sm mb-1">更多小程序</div>
          <div className="text-gray-500 text-xs">即将上线，敬请期待</div>
        </div>
      </div>
    </div>
  )
}

export default MiniPrograms
