import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import gomokuIcon from '../assets/gomoku-icon.webp'
import undercoverIcon from '../assets/undercover-icon.webp'

// 井字棋图标
const TicTacToeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="4" x2="8" y2="20" />
    <line x1="16" y1="4" x2="16" y2="20" />
    <line x1="4" y1="8" x2="20" y2="8" />
    <line x1="4" y1="16" x2="20" y2="16" />
  </svg>
)

// 21点图标
const BlackjackIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="7" height="10" rx="1" />
    <rect x="14" y="9" width="7" height="10" rx="1" />
    <text x="6.5" y="12" fontSize="6" fill="currentColor" textAnchor="middle">A</text>
    <text x="17.5" y="16" fontSize="6" fill="currentColor" textAnchor="middle">K</text>
  </svg>
)

const GameList = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()

  const games = [
    {
      id: 1,
      name: '五子棋',
      description: '经典五子棋对战，和AI一较高下',
      icon: gomokuIcon,
      path: '/game-select',
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 2,
      name: '谁是卧底',
      description: '和AI一起玩语言推理游戏',
      icon: undercoverIcon,
      path: '/undercover',
      color: 'bg-purple-500',
      available: true
    },
    {
      id: 3,
      name: '井字棋',
      description: '简单有趣的三子棋游戏',
      icon: TicTacToeIcon,
      path: '',
      color: 'bg-green-500',
      available: false
    },
    {
      id: 4,
      name: '21点',
      description: '和AI比拼运气和策略',
      icon: BlackjackIcon,
      path: '',
      color: 'bg-red-500',
      available: false
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
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">小游戏</h1>
        <div className="w-8" />
      </div>

      {/* 游戏列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => game.available && navigate(game.path)}
              className={`glass-card rounded-2xl p-5 ${game.available ? 'ios-button cursor-pointer hover:shadow-lg' : 'opacity-50'} transition-shadow`}
            >
              <div className="flex items-center gap-4">
                {typeof game.icon === 'string' ? (
                  <img src={game.icon} alt={game.name} className="w-16 h-16 object-contain flex-shrink-0" />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl ${game.color} flex items-center justify-center shadow-lg flex-shrink-0 text-white`}>
                    <game.icon />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-base">
                      {game.name}
                    </h3>
                    {!game.available && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-lg font-medium">
                        敬请期待
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {game.description}
                  </p>
                </div>
                {game.available && (
                  <div className="text-gray-300 text-2xl flex-shrink-0">
                    ›
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 提示 */}
        <div className="mt-6 glass-card rounded-2xl p-6 text-center">
          <div className="text-gray-400 text-sm mb-1">更多游戏</div>
          <div className="text-gray-500 text-xs">即将上线，敬请期待</div>
        </div>
      </div>
    </div>
  )
}

export default GameList
