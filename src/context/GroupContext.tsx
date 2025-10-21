import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setItem as safeSetItem } from '../utils/storage'

export interface GroupMember {
  id: string                    // 成员ID（characterId或userId）
  type: 'user' | 'character'    // 成员类型
  name: string                  // 成员名称
  avatar: string                // 成员头像
  nickname?: string             // 群昵称
  role: 'owner' | 'admin' | 'member'  // 角色
  joinedAt: string              // 加入时间
  muted?: boolean               // 是否被禁言
}

export interface Group {
  id: string                    // 群ID
  name: string                  // 群名称
  avatar: string                // 群头像（九宫格拼接或自定义）
  description?: string          // 群简介
  members: GroupMember[]        // 群成员列表
  owner: string                 // 群主ID（用户ID）
  admins: string[]              // 管理员ID列表
  createdAt: string             // 创建时间
  lastMessage?: string          // 最后一条消息
  lastMessageTime?: string      // 最后消息时间
  unread?: number               // 未读消息数
  settings: {
    allowMemberInvite: boolean  // 是否允许成员邀请
    muteAll: boolean            // 全员禁言
    showMemberName: boolean     // 显示群成员昵称
    aiReplyMode: 'all' | 'mention' | 'random'  // AI回复模式
    aiReplyInterval: number     // AI回复间隔（秒）
    maxAiRepliesPerMessage: number  // 单条消息最多AI回复数
  }
}

interface GroupContextType {
  groups: Group[]
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => string
  updateGroup: (id: string, group: Partial<Group>) => void
  deleteGroup: (id: string) => void
  getGroup: (id: string) => Group | undefined
  addMember: (groupId: string, member: Omit<GroupMember, 'joinedAt' | 'role'>) => void
  removeMember: (groupId: string, memberId: string) => void
  updateMember: (groupId: string, memberId: string, updates: Partial<GroupMember>) => void
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem('groups')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    safeSetItem('groups', groups)
  }, [groups])

  const addGroup = (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    const newGroup: Group = {
      ...groupData,
      id: `group_${Date.now()}`,
      createdAt: new Date().toISOString(),
      settings: {
        ...groupData.settings,
        allowMemberInvite: groupData.settings?.allowMemberInvite ?? true,
        muteAll: groupData.settings?.muteAll ?? false,
        showMemberName: groupData.settings?.showMemberName ?? true,
        aiReplyMode: groupData.settings?.aiReplyMode ?? 'all',  // 全员参与模式
        aiReplyInterval: groupData.settings?.aiReplyInterval ?? 2,  // 2秒间隔
        maxAiRepliesPerMessage: groupData.settings?.maxAiRepliesPerMessage ?? 3,  // 最多3个AI回复
      }
    }
    setGroups(prev => [newGroup, ...prev])
    return newGroup.id
  }

  const updateGroup = (id: string, groupData: Partial<Group>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...groupData } : g))
  }

  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    // 同时删除群聊消息
    localStorage.removeItem(`group_messages_${id}`)
  }

  const getGroup = (id: string) => {
    return groups.find(g => g.id === id)
  }

  const addMember = (groupId: string, memberData: Omit<GroupMember, 'joinedAt' | 'role'>) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const newMember: GroupMember = {
          ...memberData,
          role: 'member',
          joinedAt: new Date().toISOString()
        }
        return {
          ...g,
          members: [...g.members, newMember]
        }
      }
      return g
    }))
  }

  const removeMember = (groupId: string, memberId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: g.members.filter(m => m.id !== memberId)
        }
      }
      return g
    }))
  }

  const updateMember = (groupId: string, memberId: string, updates: Partial<GroupMember>) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: g.members.map(m => m.id === memberId ? { ...m, ...updates } : m)
        }
      }
      return g
    }))
  }

  return (
    <GroupContext.Provider value={{ 
      groups, 
      addGroup, 
      updateGroup, 
      deleteGroup, 
      getGroup,
      addMember,
      removeMember,
      updateMember
    }}>
      {children}
    </GroupContext.Provider>
  )
}

export const useGroup = () => {
  const context = useContext(GroupContext)
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider')
  }
  return context
}
