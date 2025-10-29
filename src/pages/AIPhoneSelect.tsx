import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import AIPhoneModal from '../components/AIPhoneModal'
import { useCharacter } from '../context/CharacterContext'

const AIPhoneSelect = () => {
  const navigate = useNavigate()
  const { characters } = useCharacter()
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; name: string } | null>(null)

  const handleCharacterSelect = (character: { id: string; name: string }) => {
    setSelectedCharacter(character)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <StatusBar />
      
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <BackIcon size={20} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">选择角色</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 角色列表 */}
      <div className="p-4 space-y-3">
        {characters.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-2">暂无角色</div>
            <div className="text-sm text-gray-300">请先在微信中添加AI角色</div>
          </div>
        ) : (
          characters.map((character: any) => (
            <button
              key={character.id}
              onClick={() => handleCharacterSelect(character)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-4 ios-button"
            >
              {/* 头像 */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center flex-shrink-0">
                {character.avatar ? (
                  <img 
                    src={character.avatar} 
                    alt={character.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-400">{character.name[0]}</span>
                )}
              </div>
              
              {/* 信息 */}
              <div className="flex-1 text-left">
                <div className="text-lg font-medium text-gray-800">{character.name}</div>
                <div className="text-sm text-gray-400 mt-1">点击查看手机</div>
              </div>
              
              {/* 箭头 */}
              <div className="text-gray-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 手机弹窗 */}
      {selectedCharacter && (
        <AIPhoneModal
          characterId={selectedCharacter.id}
          characterName={selectedCharacter.name}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  )
}

export default AIPhoneSelect
