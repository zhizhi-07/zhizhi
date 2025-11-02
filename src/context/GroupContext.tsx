import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setIndexedDBItem, getIndexedDBItem, STORES } from '../utils/indexedDBStorage'

export interface GroupMember {
  id: string                    // 成员ID（characterId或userId）
  type: 'user' | 'character'    // 成员类型
  name: string                  // 成员名称
  avatar: string                // 成员头像
  nickname?: string             // 群昵称
  role: 'owner' | 'admin' | 'member'  // 角色
  title?: string                // 头衔（自定义称号）
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
  disbanded?: boolean           // 是否已解散
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
  setAdmin: (groupId: string, memberId: string, isAdmin: boolean) => void
  setTitle: (groupId: string, memberId: string, title: string) => void
  canManage: (groupId: string, operatorId: string, targetId: string) => boolean
}

const GroupContext = createContext<GroupContextType | undefined>(undefined)

export const GroupProvider = ({ children }: { children: ReactNode }) => {
  const [groups, setGroups] = useState<Group[]>([])
  const [groupsLoaded, setGroupsLoaded] = useState(false)

  // 初始化：从 IndexedDB 加载群聊数据
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await getIndexedDBItem<any>(STORES.SETTINGS, 'groups')
        if (data && data.groups) {
          console.log(`💾 [IndexedDB] 加载了 ${data.groups.length} 个群聊`)
          setGroups(data.groups)
        } else {
          // 如果 IndexedDB 没有，尝试从 localStorage 迁移
          const saved = localStorage.getItem('groups')
          if (saved) {
            const localGroups = JSON.parse(saved)
            console.log(`💾 [localStorage] 加载了 ${localGroups.length} 个群聊，将迁移到 IndexedDB`)
            setGroups(localGroups)
            // 迁移到 IndexedDB
            await setIndexedDBItem(STORES.SETTINGS, {
              key: 'groups',
              groups: localGroups
            })
            // 迁移后清理 localStorage
            localStorage.removeItem('groups')
            console.log('✅ groups 已迁移到 IndexedDB')
          }
        }
      } catch (error) {
        console.error('加载群聊数据失败:', error)
      } finally {
        setGroupsLoaded(true)
      }
    }
    loadGroups()
  }, [])

  // 保存群聊数据到 IndexedDB
  useEffect(() => {
    if (!groupsLoaded) return
    
    const saveGroups = async () => {
      try {
        await setIndexedDBItem(STORES.SETTINGS, {
          key: 'groups',
          groups: groups
        })
        console.log(`💾 [IndexedDB] 已保存 ${groups.length} 个群聊`)
      } catch (error) {
        console.error('保存群聊数据失败:', error)
      }
    }
    saveGroups()
  }, [groups, groupsLoaded])

  const addGroup = (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    const newGroup: Group = {
      ...groupData,
      id: `group_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastMessage: '开始群聊吧',  // 添加默认最后消息
      lastMessageTime: new Date().toLocaleTimeString('zh-CN', {  // 添加默认时间
        hour: '2-digit',
        minute: '2-digit',
      }),
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
    console.log('✅ 群聊已创建并添加到列表:', newGroup.name, newGroup.id)
    return newGroup.id
  }

  const updateGroup = (id: string, groupData: Partial<Group>) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...groupData } : g))
  }

  const deleteGroup = (id: string) => {
    const group = groups.find(g => g.id === id)
    if (!group) return

    // 询问用户是否同时删除数据
    const shouldDeleteData = confirm(
      `确定要解散群聊"${group.name}"吗？\n\n是否同时删除群聊记录和红包数据？\n\n• 点击"确定"：解散群聊并删除所有数据\n• 点击"取消"：仅解散群聊，保留数据`
    )

    if (shouldDeleteData) {
      // 删除群消息
      localStorage.removeItem(`group_messages_${id}`)
      console.log(`✅ 已删除群 ${id} 的消息记录`)

      // 清理群红包
      try {
        const allRedEnvelopes = JSON.parse(localStorage.getItem('group_red_envelopes') || '[]')
        const filtered = allRedEnvelopes.filter((e: any) => e.groupId !== id)
        localStorage.setItem('group_red_envelopes', JSON.stringify(filtered))
        console.log(`✅ 已删除群 ${id} 的红包记录`)
      } catch (e) {
        console.error('清理群红包失败:', e)
      }
    }

    // 标记为已解散
    setGroups(prev => prev.map(g =>
      g.id === id ? { ...g, disbanded: true } : g
    ))

    console.log(`✅ 群聊"${group.name}"已解散${shouldDeleteData ? '，数据已清理' : ''}`)
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
        // 清理该成员的红包领取记录
        try {
          const redEnvelopes = JSON.parse(localStorage.getItem('group_red_envelopes') || '[]')
          const updatedEnvelopes = redEnvelopes.map((envelope: any) => {
            if (envelope.groupId === groupId && envelope.received[memberId]) {
              const { [memberId]: removed, ...remainingReceived } = envelope.received
              return { ...envelope, received: remainingReceived }
            }
            return envelope
          })
          localStorage.setItem('group_red_envelopes', JSON.stringify(updatedEnvelopes))
          console.log(`✅ 已清理成员 ${memberId} 在群 ${groupId} 的红包记录`)
        } catch (e) {
          console.error('清理群成员红包记录失败:', e)
        }

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

  // 设置管理员
  const setAdmin = (groupId: string, memberId: string, isAdmin: boolean) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const updatedMembers = g.members.map(m => 
          m.id === memberId ? { ...m, role: isAdmin ? 'admin' as const : 'member' as const } : m
        )
        const updatedAdmins = isAdmin 
          ? [...g.admins, memberId].filter((id, index, self) => self.indexOf(id) === index)
          : g.admins.filter(id => id !== memberId)
        
        return {
          ...g,
          members: updatedMembers,
          admins: updatedAdmins
        }
      }
      return g
    }))
  }

  // 设置头衔
  const setTitle = (groupId: string, memberId: string, title: string) => {
    updateMember(groupId, memberId, { title: title || undefined })
  }

  // 权限检查：能否管理某个成员
  const canManage = (groupId: string, operatorId: string, targetId: string): boolean => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return false
    
    // 不能管理自己
    if (operatorId === targetId) return false
    
    const operator = group.members.find(m => m.id === operatorId)
    const target = group.members.find(m => m.id === targetId)
    
    if (!operator || !target) return false
    
    // 群主可以管理所有人（除了自己）
    if (operator.role === 'owner') return true
    
    // 管理员可以管理普通成员，但不能管理群主和其他管理员
    if (operator.role === 'admin' && target.role === 'member') return true
    
    return false
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
      updateMember,
      setAdmin,
      setTitle,
      canManage
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
