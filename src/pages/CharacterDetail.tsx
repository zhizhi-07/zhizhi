import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon, MoreIcon } from '../components/Icons'
import { useCharacter } from '../context/CharacterContext'
import { useState } from 'react'

const CharacterDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getCharacter, deleteCharacter } = useCharacter()
  const [showMenu, setShowMenu] = useState(false)

  const character = id ? getCharacter(id) : undefined

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">角色不存在</p>
      </div>
    )
  }

  const isCustomAvatar = character.avatar && character.avatar.startsWith('data:image')

  const handleDelete = () => {
    if (confirm(`确定要删除角色"${character.name}"吗？`)) {
      deleteCharacter(character.id)
      navigate('/contacts')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题栏 */}
      <div className="glass-effect px-4 py-3 flex items-center justify-between border-b border-gray-200/50">
        <button
          onClick={() => navigate('/contacts')}
          className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
        >
          <BackIcon size={24} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2">
          角色详情
        </h1>
        <div className="relative z-50">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <MoreIcon size={24} />
          </button>
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-32 glass-card rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    setShowMenu(false)
                    navigate(`/edit-character/${character.id}`)
                  }}
                  className="w-full px-4 py-3 text-left text-gray-900 hover:bg-gray-50 ios-button border-b border-gray-100"
                >
                  编辑角色
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-3 text-left text-red-500 hover:bg-gray-50 ios-button"
                >
                  删除角色
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 角色信息内容 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
        {/* 头像 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-gray-900 font-medium">头像</span>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center shadow-lg overflow-hidden">
                  {isCustomAvatar ? (
                    <img src={character.avatar} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{character.avatar || '🤖'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="mb-3">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="text-xs text-gray-500 mb-2">角色名字</div>
              <div className="text-gray-900">{character.name}</div>
            </div>

            <div className="px-4 py-4 border-b border-gray-100">
              <div className="text-xs text-gray-500 mb-2">角色ID</div>
              <div className="text-gray-600">{character.username}</div>
            </div>

            <div className="px-4 py-4 border-b border-gray-100">
              <div className="text-xs text-gray-500 mb-2">个性签名</div>
              <div className="text-gray-600 min-h-[40px]">
                {character.signature || '这个人很懒，什么都没留下'}
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="text-xs text-gray-500 mb-2">AI角色描述</div>
              <div className="text-gray-600 whitespace-pre-wrap min-h-[60px]">
                {character.description || '暂无角色描述'}
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/chat/${character.id}`)}
            className="w-full glass-card rounded-2xl px-4 py-4 text-primary font-medium ios-button"
          >
            发送消息
          </button>
        </div>
      </div>
    </div>
  )
}

export default CharacterDetail

