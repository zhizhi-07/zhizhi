import { useNavigate } from 'react-router-dom'

interface GroupInviteCardProps {
  groupId: string
  groupName: string
  memberNames: string[]
  inviterName?: string
}

/**
 * 群聊邀请卡片 - 微信风格
 */
const GroupInviteCard = ({ groupId, groupName, memberNames, inviterName = '用户' }: GroupInviteCardProps) => {
  const navigate = useNavigate()
  
  return (
    <div className="flex justify-center my-4">
      <div 
        className="glass-card rounded-xl p-4 max-w-sm cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => navigate(`/group/${groupId}`)}
      >
        {/* 头部标题 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <span className="text-white text-xl">👥</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">群聊邀请</div>
            <div className="text-xs text-gray-500">{inviterName}邀请你加入群聊</div>
          </div>
        </div>
        
        {/* 群信息 */}
        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📝</span>
            <span className="text-sm font-medium text-gray-900">{groupName}</span>
          </div>
          
          {/* 成员列表 */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>成员：</span>
            <span className="flex-1 truncate">{memberNames.join('、')}</span>
            <span className="text-gray-400">({memberNames.length}人)</span>
          </div>
        </div>
        
        {/* 底部提示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span>💬</span>
            <span>点击查看群聊</span>
          </div>
          <div className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded">
            已加入
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupInviteCard
