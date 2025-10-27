import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  name: string  // 真实名字
  nickname?: string  // 网名
  remark?: string  // AI给用户设置的备注（默认是nickname或name）
  username: string
  avatar: string
  signature: string  // 个性签名，显示在用户界面
  description: string  // AI角色描述：背景、性格等，用于AI角色扮演
  createdAt: string
}

interface UserContextType {
  users: User[]
  currentUser: User | null
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void
  updateUser: (id: string, user: Partial<User>) => void
  deleteUser: (id: string) => void
  switchUser: (id: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const defaultUser: User = {
  id: '1',
  name: '微信用户',
  username: 'wxid_123456',
  avatar: 'default',
  signature: '这个人很懒，什么都没留下',
  description: '',
  createdAt: new Date().toISOString()
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users')
    if (saved) {
      const parsedUsers = JSON.parse(saved)
      // 数据迁移：确保所有用户都有必需的字段
      return parsedUsers.map((user: any) => ({
        ...user,
        avatar: user.avatar || 'default',
        description: user.description || user.signature || '这个人很懒，什么都没留下',
        signature: user.signature || user.description || '这个人很懒，什么都没留下',
        remark: user.remark || user.nickname || user.name  // 初始备注为网名或名字
      }))
    }
    return [defaultUser]
  })

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('currentUserId')
    return saved || '1'
  })

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem('currentUserId', currentUserId)
  }, [currentUserId])

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || null

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setUsers(prev => [...prev, newUser])
    setCurrentUserId(newUser.id)
  }

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u))
  }

  const deleteUser = (id: string) => {
    if (users.length === 1) {
      alert('至少需要保留一个用户')
      return
    }
    setUsers(prev => prev.filter(u => u.id !== id))
    if (currentUserId === id) {
      setCurrentUserId(users.find(u => u.id !== id)?.id || users[0].id)
    }
  }

  const switchUser = (id: string) => {
    setCurrentUserId(id)
  }

  return (
    <UserContext.Provider value={{ users, currentUser, addUser, updateUser, deleteUser, switchUser }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

