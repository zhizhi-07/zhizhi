import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import { useGroup } from '../context/GroupContext'
import { useCharacter } from '../context/CharacterContext'
import { useBackground } from '../context/BackgroundContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const GroupSettings = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getGroup, updateGroup, deleteGroup, removeMember, setAdmin, setTitle, canManage } = useGroup()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  const { background, getBackgroundStyle } = useBackground()
  
  const group = getGroup(id || '')
  const [groupName, setGroupName] = useState(group?.name || '')
  const [announcement, setAnnouncement] = useState(group?.description || '')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // 成员管理弹窗
  const [managingMember, setManagingMember] = useState<{ id: string; name: string } | null>(null)
  const [newTitle, setNewTitle] = useState('')
  
  // AI自由对话设置
  const [aiChatEnabled, setAiChatEnabled] = useState(() => {
    if (!id) return false
    const saved = localStorage.getItem(`group_ai_chat_enabled_${id}`)
    return saved === 'true'
  })
  
  const [aiChatInterval, setAiChatInterval] = useState(() => {
    if (!id) return 30
    const saved = localStorage.getItem(`group_ai_chat_interval_${id}`)
    return saved ? parseInt(saved) : 30
  })
  
  // 保存AI对话设置
  const handleSaveAiChatSettings = () => {
    if (!id) return
    localStorage.setItem(`group_ai_chat_enabled_${id}`, String(aiChatEnabled))
    localStorage.setItem(`group_ai_chat_interval_${id}`, String(aiChatInterval))
    alert(aiChatEnabled ? 'AI自由对话已启用' : 'AI自由对话已关闭')
  }

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
        <div className="flex-1 overflow-y-auto hide-scrollbar p-3">
        {/* 基本信息 */}
        <div className="glass-card rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📝</span>
            <h3 className="text-sm font-medium text-gray-800">群名称</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="请输入群名称"
              maxLength={20}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-wechat-primary bg-white"
            />
            <button
              onClick={handleSaveName}
              className="px-3 py-2 bg-wechat-primary text-white rounded-lg text-xs ios-button whitespace-nowrap"
            >
              保存
            </button>
          </div>
          <span className="text-xs text-gray-400 mt-1 block">{groupName.length}/20</span>
        </div>

        <div className="glass-card rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📢</span>
            <h3 className="text-sm font-medium text-gray-800">群公告</h3>
          </div>
          <textarea
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="请输入群公告"
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-wechat-primary bg-white resize-none mb-2"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{announcement.length}/200</span>
            <button
              onClick={handleSaveAnnouncement}
              className="px-3 py-2 bg-wechat-primary text-white rounded-lg text-xs ios-button"
            >
              保存
            </button>
          </div>
        </div>

        {/* AI自由对话设置 */}
        <div className="glass-card rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🤖</span>
            <h3 className="text-sm font-medium text-gray-800">AI自由对话</h3>
          </div>
          
          {/* 开关 */}
          <div className="flex items-center justify-between p-2.5 bg-white rounded-lg mb-2">
            <div className="flex-1 pr-2">
              <p className="text-sm font-medium text-gray-900">启用自由对话</p>
              <p className="text-xs text-gray-500 mt-0.5">AI会自动聊天互动</p>
            </div>
            <button
              onClick={() => setAiChatEnabled(!aiChatEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                aiChatEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  aiChatEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          {/* 对话间隔设置 */}
          {aiChatEnabled && (
            <div className="p-2.5 bg-white rounded-lg mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-700">对话间隔</label>
                <span className="text-xs font-medium text-green-600">{aiChatInterval}秒</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={aiChatInterval}
                onChange={(e) => setAiChatInterval(parseInt(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>活跃</span>
                <span>正常</span>
                <span>安静</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSaveAiChatSettings}
            className="w-full py-2 bg-green-500 text-white rounded-lg text-xs font-medium ios-button"
          >
            保存设置
          </button>
          
          {aiChatEnabled && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 leading-relaxed">
                💡 AI会定时在群里发起话题和互动
              </p>
            </div>
          )}
        </div>

        {/* 群成员 */}
        <div className="glass-card rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">👥</span>
            <h3 className="text-sm font-medium text-gray-800">
              群成员 <span className="text-gray-400">({group.members.length})</span>
            </h3>
          </div>
          <div className="space-y-1.5">
            {group.members.map(member => {
              const isOwner = member.id === group.owner
              const isUser = member.type === 'user'
              const character = member.type === 'character' ? getCharacter(member.id) : null
              const isCustomAvatar = member.avatar && member.avatar.startsWith('data:image')

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* 头像 */}
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {isCustomAvatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{member.avatar || '🤖'}</span>
                      )}
                    </div>
                    
                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{member.name}</span>
                        {isOwner && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded whitespace-nowrap">
                            👑 群主
                          </span>
                        )}
                        {!isOwner && member.role === 'admin' && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded whitespace-nowrap">
                            🛡️ 管理员
                          </span>
                        )}
                        {member.title && (
                          <span className="text-xs px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded whitespace-nowrap">
                            ✨ {member.title}
                          </span>
                        )}
                        {isUser && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                            我
                          </span>
                        )}
                      </div>
                      {character?.signature && (
                        <p className="text-xs text-gray-400 truncate">{character.signature}</p>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  {!isUser && canManage(group.id, 'user', member.id) && (
                    <button
                      onClick={() => {
                        setManagingMember({ id: member.id, name: member.name })
                        setNewTitle(member.title || '')
                      }}
                      className="px-2.5 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded ios-button flex-shrink-0"
                    >
                      管理
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 危险操作 */}
        <div className="glass-card rounded-xl p-2.5 mb-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 ios-button"
          >
            🗑️ 解散群聊
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

      {/* 成员管理弹窗 */}
      {managingMember && group && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setManagingMember(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="glass-card rounded-2xl p-5 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                管理 {managingMember.name}
              </h3>
              
              {/* 头衔设置 */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  ✨ 设置头衔
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="输入头衔（留空则删除）"
                  maxLength={10}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">{newTitle.length}/10</p>
              </div>

              {/* 管理员设置 */}
              {(() => {
                const member = group.members.find(m => m.id === managingMember.id)
                const isAdmin = member?.role === 'admin'
                const isOwner = member?.role === 'owner'
                const currentUserIsOwner = group.members.find(m => m.type === 'user')?.role === 'owner'

                return !isOwner && currentUserIsOwner && (
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">🛡️ 设为管理员</p>
                        <p className="text-xs text-gray-500 mt-0.5">管理员可以管理普通成员</p>
                      </div>
                      <button
                        onClick={() => {
                          if (id && managingMember && group) {
                            setAdmin(id, managingMember.id, !isAdmin)
                            
                            // 发送系统消息到群聊
                            const messages = localStorage.getItem(`group_messages_${id}`)
                            const messageList = messages ? JSON.parse(messages) : []
                            
                            const notificationContent = !isAdmin
                              ? `群主设置 ${managingMember.name} 为管理员 🛡️`
                              : `群主取消了 ${managingMember.name} 的管理员身份`
                            
                            const systemMessage = {
                              id: Date.now(),
                              groupId: id,
                              senderId: 'system',
                              senderType: 'user',
                              senderName: '系统',
                              senderAvatar: '',
                              content: notificationContent,
                              time: new Date().toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              }),
                              timestamp: Date.now(),
                              messageType: 'system'
                            }
                            messageList.push(systemMessage)
                            localStorage.setItem(`group_messages_${id}`, JSON.stringify(messageList))
                          }
                        }}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          isAdmin ? 'bg-purple-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            isAdmin ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setManagingMember(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm ios-button"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (id && managingMember && group) {
                      const member = group.members.find(m => m.id === managingMember.id)
                      const oldTitle = member?.title || ''
                      
                      // 保存头衔
                      setTitle(id, managingMember.id, newTitle)
                      
                      // 发送系统消息到群聊
                      const messages = localStorage.getItem(`group_messages_${id}`)
                      const messageList = messages ? JSON.parse(messages) : []
                      
                      let notificationContent = ''
                      if (newTitle && !oldTitle) {
                        notificationContent = `群主给 ${managingMember.name} 设置了头衔：✨${newTitle}`
                      } else if (newTitle && oldTitle) {
                        notificationContent = `群主修改了 ${managingMember.name} 的头衔：✨${newTitle}`
                      } else if (!newTitle && oldTitle) {
                        notificationContent = `群主取消了 ${managingMember.name} 的头衔`
                      }
                      
                      if (notificationContent) {
                        const systemMessage = {
                          id: Date.now(),
                          groupId: id,
                          senderId: 'system',
                          senderType: 'user',
                          senderName: '系统',
                          senderAvatar: '',
                          content: notificationContent,
                          time: new Date().toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                          timestamp: Date.now(),
                          messageType: 'system'
                        }
                        messageList.push(systemMessage)
                        localStorage.setItem(`group_messages_${id}`, JSON.stringify(messageList))
                      }
                      
                      alert('设置成功')
                      setManagingMember(null)
                    }
                  }}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm ios-button"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    if (id && managingMember && confirm(`确定要移除 ${managingMember.name} 吗？`)) {
                      removeMember(id, managingMember.id)
                      setManagingMember(null)
                    }
                  }}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm ios-button"
                >
                  移除
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
