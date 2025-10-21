import { useNavigate } from 'react-router-dom'
import { BackIcon, AddIcon, EmptyIcon } from '../components/Icons'
import { useGroup } from '../context/GroupContext'

const GroupList = () => {
  const navigate = useNavigate()
  const { groups } = useGroup()

  // 生成九宫格头像
  const renderGroupAvatar = (members: any[]) => {
    // 最多显示9个成员头像
    const displayMembers = members.slice(0, 9)
    const count = displayMembers.length
    
    // 根据成员数量决定布局
    let gridCols = 'grid-cols-3'
    let fontSize = '12px'
    
    if (count === 1) {
      gridCols = 'grid-cols-1'
      fontSize = '32px'
    } else if (count <= 4) {
      gridCols = 'grid-cols-2'
      fontSize = '16px'
    }
    
    return (
      <div className={`w-14 h-14 rounded-2xl bg-white shadow-lg overflow-hidden grid ${gridCols} gap-[1px] border border-gray-200`}>
        {displayMembers.map((member, index) => {
          const isCustomAvatar = member.avatar && member.avatar.startsWith('data:image')
          return (
            <div 
              key={index} 
              className="bg-gray-100 flex items-center justify-center"
              style={{ fontSize }}
            >
              {isCustomAvatar ? (
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span>{member.avatar || '🤖'}</span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect px-5 py-4 flex items-center justify-between border-b border-gray-200/50 sticky top-0 z-50 bg-white/95 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="ios-button">
            <BackIcon size={24} />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">群聊</h1>
        </div>
        <button 
          onClick={() => navigate('/create-group')}
          className="ios-button text-gray-700 hover:text-gray-900"
        >
          <AddIcon size={22} />
        </button>
      </div>

      {/* 群聊列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-3">
        {groups.length === 0 ? (
          <div className="empty-state">
            <EmptyIcon size={100} className="text-gray-400 mb-4" />
            <p className="text-gray-400 text-base mb-2">暂无群聊</p>
            <p className="text-gray-400 text-sm mb-6">创建群聊，与多个AI角色一起聊天</p>
            <button
              onClick={() => navigate('/create-group')}
              className="px-6 py-2 bg-wechat-primary text-white rounded-full ios-button"
            >
              创建群聊
            </button>
          </div>
        ) : (
          groups.map(group => (
            <div
              key={group.id}
              onClick={() => navigate(`/group/${group.id}`)}
              className="flex items-center px-4 py-4 ios-button glass-card mb-2 rounded-2xl cursor-pointer hover:bg-white/90"
            >
              {/* 群头像 - 九宫格 */}
              {renderGroupAvatar(group.members)}

              {/* 群信息 */}
              <div className="flex-1 ml-4 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{group.name}</span>
                    <span className="text-xs text-gray-400">({group.members.length})</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {group.lastMessageTime || ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate flex-1">
                    {group.lastMessage || '开始群聊吧'}
                  </p>
                  {group.unread && group.unread > 0 && (
                    <span className="ml-2 px-2 min-w-[20px] h-5 rounded-full text-xs text-white flex items-center justify-center bg-red-500 shadow-md">
                      {group.unread > 99 ? '99+' : group.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default GroupList
