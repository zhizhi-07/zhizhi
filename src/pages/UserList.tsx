import { useNavigate } from 'react-router-dom'
import { BackIcon, AddIcon, ImageIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'

const UserList = () => {
  const navigate = useNavigate()
  const { users, currentUser, switchUser, deleteUser } = useUser()


  const handleSwitchUser = (userId: string) => {
    switchUser(userId)
    navigate('/wechat/me')
  }

  const handleDeleteUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除这个账号吗？')) {
      deleteUser(userId)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部标题栏 */}
      <div className="glass-effect px-4 py-3 flex items-center justify-between border-b border-gray-200/50">
        <button
          onClick={() => navigate(-1)}
          className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
        >
          <BackIcon size={24} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 transform -translate-x-1/2 pointer-events-none">
          账号管理
        </h1>
        <button
          onClick={() => navigate('/create-user')}
          className="ios-button text-gray-700 hover:text-gray-900"
        >
          <AddIcon size={24} />
        </button>
      </div>

      {/* 用户列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pt-3">
        <div className="space-y-3 mb-6">
          {users.map(user => {
            const isCustomAvatar = user.avatar && user.avatar.startsWith('data:image')
            const isCurrentUser = currentUser?.id === user.id

            return (
              <div
                key={user.id}
                onClick={() => handleSwitchUser(user.id)}
                className={`glass-card rounded-2xl p-4 ios-button cursor-pointer ${
                  isCurrentUser ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden">
                    {isCustomAvatar && user.avatar ? (
                      <img src={user.avatar} alt="头像" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-400" />
                    )}
                  </div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 bg-primary text-white rounded-full">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{user.username}</p>
                    <p className="text-xs text-gray-400 truncate">{user.signature}</p>
                  </div>
                  {!isCurrentUser && users.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteUser(user.id, e)}
                      className="ml-2 px-3 py-1 text-sm text-red-500 ios-button"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default UserList

