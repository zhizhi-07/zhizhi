import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon, ImageIcon } from '../components/Icons'
import { useGroup } from '../context/GroupContext'
import { useCharacter } from '../context/CharacterContext'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const GroupSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getGroup, updateGroup, deleteGroup, removeMember } = useGroup()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  const { background, getBackgroundStyle } = useBackground()
  
  const group = getGroup(id || '')
  const [groupName, setGroupName] = useState(group?.name || '')
  const [announcement, setAnnouncement] = useState(group?.description || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!group) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">群聊不存在</p>
      </div>
    )
  }

  // 保存群名称
  const handleSaveName = () => {
    if (!groupName.trim()) {
      alert('群名称不能为空')
      return
    }
    updateGroup(group.id, { name: groupName.trim() })
    alert('群名称已更新')
  }

  // 保存群公告
  const handleSaveAnnouncement = () => {
    updateGroup(group.id, { description: announcement })
    alert('群公告已更新')
  }

  // 移除成员
  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (confirm(`确定要移除 ${memberName} 吗？`)) {
      removeMember(group.id, memberId)
      alert(`已移除 ${memberName}`)
    }
  }


  // 解散群聊
  const handleDeleteGroup = () => {
    setShowDeleteConfirm(false)
    // 删除群聊消息
    localStorage.removeItem(`group_messages_${group.id}`)
    // 删除群聊
    deleteGroup(group.id)
    // 返回首页
    navigate('/', { replace: true })
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      <div className="h-full flex flex-col relative overflow-hidden">
        {/* 壁纸背景层 */}
        <div 
          className="absolute inset-0 z-0"
          style={getBackgroundStyle()}
        />
        
        {/* 内容层 */}
        <div className="relative z-10 h-full flex flex-col">
          {/* 顶部导航栏 */}
          <div className={`px-5 py-4 flex items-center justify-between border-b border-white/20 sticky top-0 z-50 shadow-sm ${background ? 'glass-dark' : 'glass-effect'}`}>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="ios-button">
                <BackIcon size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">群设置</h1>
            </div>
          </div>

        {/* 设置内容 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        {/* 群名称 */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">群名称</h3>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="请输入群名称"
            maxLength={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wechat-primary bg-white mb-3"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{groupName.length}/20</span>
            <button
              onClick={handleSaveName}
              className="px-4 py-2 bg-wechat-primary text-white rounded-full text-sm ios-button"
            >
              保存
            </button>
          </div>
        </div>

        {/* 群公告 */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">群公告</h3>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="请输入群公告"
            maxLength={200}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-wechat-primary bg-white mb-3 resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{announcement.length}/200</span>
            <button
              onClick={handleSaveAnnouncement}
              className="px-4 py-2 bg-wechat-primary text-white rounded-full text-sm ios-button"
            >
              保存
            </button>
          </div>
        </div>

        {/* 群成员 */}
        <div className="glass-card rounded-2xl p-5 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            群成员 ({group.members.length})
          </h3>
          <div className="space-y-2">
            {group.members.map(member => {
              const isOwner = member.id === group.owner
              const isUser = member.type === 'user'
              const character = member.type === 'character' ? getCharacter(member.id) : null
              const isCustomAvatar = member.avatar && member.avatar.startsWith('data:image')

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 头像 */}
                    <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                      {isCustomAvatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{member.avatar || '🤖'}</span>
                      )}
                    </div>
                    
                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{member.name}</span>
                        {isOwner && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-md whitespace-nowrap">
                            群主
                          </span>
                        )}
                        {isUser && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md whitespace-nowrap">
                            我
                          </span>
                        )}
                      </div>
                      {character?.signature && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{character.signature}</p>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {!isUser && !isOwner && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg ios-button flex-shrink-0 whitespace-nowrap"
                    >
                      移除
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 危险操作 */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 ios-button"
          >
            解散群聊
          </button>
        </div>
        </div>
        </div>
      </div>

      {/* 解散确认弹窗 */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">解散群聊</h3>
              <p className="text-gray-600 mb-6">
                解散后，所有群成员将被移除，群聊记录将被清空，此操作不可恢复。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 ios-button"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl ios-button"
                >
                  确认解散
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GroupSettings
