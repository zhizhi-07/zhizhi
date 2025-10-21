import { GroupMember } from '../context/GroupContext'

interface MentionMemberModalProps {
  members: GroupMember[]
  onSelect: (member: GroupMember) => void
  onClose: () => void
  position: { x: number; y: number }
}

const MentionMemberModal = ({ members, onSelect, onClose, position }: MentionMemberModalProps) => {
  // 过滤掉用户自己
  const selectableMembers = members.filter(m => m.type === 'character')

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* @成员列表 */}
      <div
        className="fixed z-50 glass-card rounded-2xl shadow-xl max-h-64 overflow-y-auto hide-scrollbar"
        style={{
          left: `${position.x}px`,
          bottom: `${window.innerHeight - position.y + 10}px`,
          minWidth: '200px',
          maxWidth: '300px'
        }}
      >
        {selectableMembers.length === 0 ? (
          <div className="px-4 py-3 text-gray-400 text-sm text-center">
            暂无可@的成员
          </div>
        ) : (
          selectableMembers.map(member => {
            const isCustomAvatar = member.avatar && member.avatar.startsWith('data:image')
            return (
              <div
                key={member.id}
                onClick={() => onSelect(member)}
                className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer ios-button border-b border-gray-100 last:border-b-0"
              >
                {/* 头像 */}
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                  {isCustomAvatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{member.avatar || '🤖'}</span>
                  )}
                </div>
                
                {/* 名称 */}
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="font-medium text-gray-900 truncate">
                    {member.nickname || member.name}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

export default MentionMemberModal
