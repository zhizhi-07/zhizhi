import { useNavigate } from 'react-router-dom'
import { useCharacter } from '../context/CharacterContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const GameCharacterSelect = () => {
  const navigate = useNavigate()
  const { characters } = useCharacter()
  const { showStatusBar } = useSettings()

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50">
      {showStatusBar && <StatusBar />}
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 border-b border-gray-200/50 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center ios-button"
        >
          <span className="text-blue-500 text-xl">‹</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-900">选择对手</h1>
        <div className="w-8" />
      </div>

      {/* 角色列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <div className="space-y-3">
          {characters.map((character) => (
            <div
              key={character.id}
              onClick={() => navigate(`/gomoku/${character.id}`)}
              className="glass-card rounded-2xl p-4 ios-button cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-4">
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="w-14 h-14 rounded-full object-cover shadow-sm"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base mb-1">
                    {character.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {character.description}
                  </p>
                </div>
                <div className="text-gray-300 text-2xl">›</div>
              </div>
            </div>
          ))}
        </div>

        {characters.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <div className="text-gray-500 text-sm mb-2">还没有AI角色</div>
            <button
              onClick={() => navigate('/create-character')}
              className="text-blue-500 text-sm font-medium"
            >
              创建角色
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GameCharacterSelect
