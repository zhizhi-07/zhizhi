import { useNavigate } from 'react-router-dom'
import { SearchIcon, AddIcon, EmptyIcon, NewFriendIcon, GroupIcon, TagIcon } from '../components/Icons'
import { useCharacter } from '../context/ContactsContext'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getAiAvatar } from '../utils/avatarUtils'

const Contacts = () => {
  const navigate = useNavigate()
  const { characters } = useCharacter()
  const { background, getBackgroundStyle } = useBackground()
  const { showStatusBar } = useSettings()

  const specialContacts = [
    { id: 1, name: '创建角色', Icon: NewFriendIcon, path: '/create-character' },
    { id: 2, name: '群聊', Icon: GroupIcon, path: '/group-list' },
    { id: 3, name: '标签', Icon: TagIcon, path: '' },
  ]

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 z-0" style={getBackgroundStyle()} />
        <div className="relative z-10 h-full flex flex-col bg-transparent">
          {/* 顶部：StatusBar + 导航栏一体化 */}
          <div className={`sticky top-0 z-50 ${background ? 'glass-dark' : 'glass-effect'}`}>
            {showStatusBar && <StatusBar />}
            <div className="px-5 py-4 flex items-center justify-between">
              <button 
                onClick={() => navigate('/')}
                className="text-xl font-semibold text-gray-900 ios-button"
              >
                通讯录
              </button>
              <div className="flex items-center gap-4">
          <button 
            onClick={() => console.log('搜索联系人')}
            className="ios-button text-gray-700 hover:text-gray-900 cursor-pointer"
          >
            <SearchIcon size={22} />
          </button>
          <button 
            onClick={() => navigate('/create-character')}
            className="ios-button text-gray-700 hover:text-gray-900 cursor-pointer"
          >
            <AddIcon size={22} />
          </button>
              </div>
            </div>
          </div>

      {/* 通讯录列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar relative z-0">
        {/* 特殊联系人 */}
        <div className="px-3 pt-3 pb-2">
          {specialContacts.map((contact) => {
            const Icon = contact.Icon
            return (
              <div
                key={contact.id}
                onClick={() => {
                  if (contact.path) {
                    navigate(contact.path)
                  } else {
                    console.log(`点击了 ${contact.name}`)
                  }
                }}
                className="flex items-center px-4 py-3 ios-button glass-card mb-2 rounded-2xl cursor-pointer hover:bg-white/90"
              >
                <div className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg border border-gray-200/50">
                  <Icon size={24} className="text-gray-600" />
                </div>
                <span className="ml-4 text-gray-900 font-medium">{contact.name}</span>
              </div>
            )
          })}
        </div>

        {/* 联系人列表或空状态 */}
        {characters.length === 0 ? (
          <div className="empty-state mt-10">
            <EmptyIcon size={100} className="text-gray-400 mb-4" />
            <p className="text-gray-400 text-base">暂无联系人</p>
            <p className="text-gray-400 text-sm mt-2">点击上方"创建角色"添加AI角色</p>
          </div>
        ) : (
          <div className="px-3">
            {characters.map((character) => {
              return (
                <div
                  key={character.id}
                  onClick={() => navigate(`/character/${character.id}`)}
                  className="flex items-center px-4 py-3 ios-button glass-card mb-2 rounded-2xl cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden bg-gray-200">
                    <img src={getAiAvatar(character.avatar)} alt={character.nickname || character.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <h3 className="text-gray-900 font-medium">{character.nickname || character.name}</h3>
                    {character.signature && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{character.signature}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
        </div>
    </div>
  )
}

export default Contacts
