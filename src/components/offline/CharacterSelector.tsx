/**
 * 角色选择组件
 * 用于线下聊天选择角色
 */

import { Character } from '../../context/ContactsContext'

interface CharacterSelectorProps {
  characters: Character[]
  onSelect: (character: Character) => void
  onCancel: () => void
}

const CharacterSelector = ({ characters, onSelect, onCancel }: CharacterSelectorProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl">
        {/* 标题栏 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">选择角色</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <span className="text-gray-500 text-xl">×</span>
          </button>
        </div>

        {/* 角色列表 */}
        <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
          {characters.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">😔</div>
              <p className="text-sm text-gray-500">暂无角色</p>
              <p className="text-xs text-gray-400 mt-1">请先创建角色</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => onSelect(character)}
                  className="w-full p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                >
                  {/* 头像 */}
                  <div className="flex-shrink-0">
                    {character.avatar?.startsWith('data:') || character.avatar?.startsWith('http') ? (
                      <img
                        src={character.avatar}
                        alt={character.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xl">
                        {character.avatar || character.name[0]}
                      </div>
                    )}
                  </div>

                  {/* 角色信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {character.name}
                    </div>
                    {character.description && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {character.description.slice(0, 50)}
                        {character.description.length > 50 ? '...' : ''}
                      </div>
                    )}
                    {character.offlineGreetings && character.offlineGreetings.length > 0 && (
                      <div className="text-xs text-blue-500 mt-1">
                        {character.offlineGreetings.length} 个开场白
                      </div>
                    )}
                  </div>

                  {/* 右箭头 */}
                  <div className="flex-shrink-0 text-gray-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CharacterSelector
