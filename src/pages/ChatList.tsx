import { useNavigate } from 'react-router-dom'
import { SearchIcon, AddIcon, EmptyIcon } from '../components/Icons'
import { useState, useEffect } from 'react'
import { useCharacter } from '../context/CharacterContext'
import { useBackground } from '../context/BackgroundContext'
import { useGroup } from '../context/GroupContext'
import { getStreakData } from '../utils/streakSystem'

interface Chat {
  id: string
  characterId?: string  // 单聊才有
  groupId?: string      // 群聊才有
  type: 'single' | 'group'  // 聊天类型
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread?: number
  muted?: boolean
  memberCount?: number  // 群聊成员数
}

const ChatList = () => {
  const navigate = useNavigate()
  const { characters } = useCharacter()
  const { groups } = useGroup()
  const { background, getBackgroundStyle } = useBackground()
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chatList')
    return saved ? JSON.parse(saved) : []
  })
  const [showMenu, setShowMenu] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // 调试：打印背景信息
  useEffect(() => {
    console.log('📱 ChatList 背景状态:')
    console.log('  background:', background)
    console.log('  style:', getBackgroundStyle())
  }, [background, getBackgroundStyle])

  // 保存聊天列表到localStorage
  useEffect(() => {
    localStorage.setItem('chatList', JSON.stringify(chats))
  }, [chats])

  // 同步群聊到聊天列表（新增和更新）
  useEffect(() => {
    if (groups.length === 0) return

    setChats(prev => {
      let updated = [...prev]
      let hasChanges = false

      groups.forEach(group => {
        const existingIndex = updated.findIndex(c => c.type === 'group' && c.groupId === group.id)
        
        const groupChat: Chat = {
          id: group.id,
          groupId: group.id,
          type: 'group' as const,
          name: group.name,
          avatar: group.avatar,
          lastMessage: group.lastMessage || '开始群聊吧',
          time: group.lastMessageTime || new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          memberCount: group.members.length,
          unread: group.unread
        }

        if (existingIndex >= 0) {
          // 更新现有群聊
          const existing = updated[existingIndex]
          if (existing.lastMessage !== groupChat.lastMessage || 
              existing.time !== groupChat.time ||
              existing.memberCount !== groupChat.memberCount) {
            updated[existingIndex] = groupChat
            // 将更新的群聊移到顶部
            updated = [groupChat, ...updated.filter((_, i) => i !== existingIndex)]
            hasChanges = true
          }
        } else {
          // 新增群聊，添加到顶部
          updated = [groupChat, ...updated]
          hasChanges = true
        }
      })

      return hasChanges ? updated : prev
    })
  }, [groups])

  // 获取未添加到聊天列表的角色
  const availableCharacters = characters.filter(
    character => !chats.some(chat => chat.characterId === character.id)
  )

  // 生成九宫格头像
  const renderGroupAvatar = (groupId: string) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return null

    const displayMembers = group.members.slice(0, 9)
    const count = displayMembers.length
    
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

  // 添加角色到聊天列表
  const handleAddCharacter = (characterId: string) => {
    const character = characters.find(c => c.id === characterId)
    if (!character) return

    const newChat: Chat = {
      id: characterId,
      characterId: characterId,
      type: 'single',
      name: character.name,
      avatar: character.avatar,
      lastMessage: '开始聊天吧',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setChats(prev => [newChat, ...prev])
    setShowAddModal(false)
    // 添加成功，关闭弹窗，角色已添加到列表
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 壁纸背景层 - 固定在底层 */}
      <div 
        className="absolute inset-0 z-0"
        style={getBackgroundStyle()}
      />
      
      {/* 内容层 - 在背景上方 */}
      <div className="relative z-10 h-full flex flex-col bg-transparent">
        {/* 顶部标题栏 - 玻璃效果 */}
        <div className={`px-5 py-4 flex items-center justify-between border-b border-white/20 sticky top-0 z-50 shadow-sm ${background ? 'glass-dark' : 'glass-effect'}`}>
        <h1 className="text-xl font-semibold text-gray-900">微信</h1>
        <div className="flex items-center gap-4">
          <button className="ios-button text-gray-700 hover:text-gray-900">
            <SearchIcon size={22} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="ios-button text-gray-700 hover:text-gray-900"
            >
              <AddIcon size={22} />
            </button>
            
            {/* 下拉菜单 */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-44 glass-card rounded-2xl shadow-xl z-40 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowAddModal(true)
                    }}
                    className="w-full px-4 py-3.5 text-left text-gray-900 hover:bg-gray-50 ios-button border-b border-gray-100 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <span className="font-medium">添加联系人</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      navigate('/create-group')
                    }}
                    className="w-full px-4 py-3.5 text-left text-gray-900 hover:bg-gray-50 ios-button flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                      </svg>
                    </div>
                    <span className="font-medium">创建群聊</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar relative z-0">
        {chats.length === 0 ? (
          <div className="empty-state">
            <EmptyIcon size={100} className="text-gray-400 mb-4" />
            <p className="text-gray-400 text-base mb-2">暂无聊天</p>
            <p className="text-gray-400 text-sm">点击右上角 + 添加角色开始聊天</p>
          </div>
        ) : (
          chats.map((chat) => {
            const isCustomAvatar = chat.avatar && chat.avatar.startsWith('data:image')
            const isGroup = chat.type === 'group'
            
            return (
              <div
                key={chat.id}
                onClick={() => navigate(isGroup ? `/group/${chat.id}` : `/chat/${chat.id}`)}
                className="flex items-center px-5 py-4 ios-button glass-card mb-2 mx-3 rounded-2xl cursor-pointer"
              >
                {/* 头像 */}
                {isGroup && chat.groupId ? (
                  renderGroupAvatar(chat.groupId)
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                    {isCustomAvatar ? (
                      <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{chat.avatar || '🤖'}</span>
                    )}
                  </div>
                )}

              {/* 消息内容 */}
              <div className="flex-1 ml-4 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{chat.name}</span>
                    {isGroup && chat.memberCount && (
                      <span className="text-xs text-gray-400">({chat.memberCount})</span>
                    )}
                    {!isGroup && chat.characterId && (() => {
                      const streakData = getStreakData(chat.characterId)
                      return streakData.currentStreak > 0 ? (
                        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-md font-medium flex items-center gap-0.5">
                          🔥 {streakData.currentStreak}
                        </span>
                      ) : null
                    })()}
                  </div>
                  <span className="text-xs text-gray-400">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate flex-1">
                    {chat.lastMessage}
                  </p>
                  {chat.unread && (
                    <span
                      className={`ml-2 px-2 min-w-[20px] h-5 rounded-full text-xs text-white flex items-center justify-center ${
                        chat.muted ? 'bg-gray-400' : 'bg-red-500'
                      } shadow-md`}
                    >
                      {chat.unread > 99 ? '99+' : chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
            )
          })
        )}
      </div>

      {/* 添加角色弹窗 */}
      {showAddModal && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowAddModal(false)}
          />
          
          {/* 弹窗内容 */}
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="glass-card rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto hide-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">选择角色</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 ios-button"
                >
                  ✕
                </button>
              </div>

              {availableCharacters.length === 0 ? (
                <div className="py-10 text-center">
                  <EmptyIcon size={80} className="text-gray-400 mb-3 mx-auto" />
                  <p className="text-gray-500 mb-4">暂无可添加的角色</p>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      navigate('/create-character')
                    }}
                    className="px-6 py-2 bg-wechat-primary text-white rounded-full ios-button"
                  >
                    创建新角色
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCharacters.map(character => {
                    const isCustomAvatar = character.avatar && character.avatar.startsWith('data:image')
                    return (
                      <div
                        key={character.id}
                        onClick={() => handleAddCharacter(character.id)}
                        className="flex items-center p-4 glass-card rounded-2xl ios-button cursor-pointer hover:bg-gray-50"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                          {isCustomAvatar ? (
                            <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{character.avatar || '🤖'}</span>
                          )}
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                          <h3 className="font-medium text-gray-900">{character.name}</h3>
                          {character.signature && (
                            <p className="text-sm text-gray-500 truncate">{character.signature}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 底部提示 */}
              {availableCharacters.length > 0 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      navigate('/contacts')
                    }}
                    className="text-sm text-primary ios-button"
                  >
                    前往通讯录管理角色
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}

export default ChatList
