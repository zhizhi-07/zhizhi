import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface MomentImage {
  id: string
  url: string
}

export interface MomentComment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: string
}

export interface MomentLike {
  id: string
  userId: string
  userName: string
  userAvatar: string
}

export interface Moment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images: MomentImage[]
  likes: MomentLike[]
  comments: MomentComment[]
  location?: string
  createdAt: string
}

interface MomentsContextType {
  moments: Moment[]
  addMoment: (moment: Omit<Moment, 'id' | 'createdAt' | 'likes' | 'comments'>) => void
  deleteMoment: (id: string) => void
  likeMoment: (momentId: string, userId: string, userName: string, userAvatar: string) => void
  unlikeMoment: (momentId: string, userId: string) => void
  addComment: (momentId: string, userId: string, userName: string, userAvatar: string, content: string) => void
  deleteComment: (momentId: string, commentId: string) => void
}

const MomentsContext = createContext<MomentsContextType | undefined>(undefined)

// 默认示例数据
const defaultMoments: Moment[] = [
  {
    id: '1',
    userId: '1',
    userName: '微信用户',
    userAvatar: 'default',
    content: '今天天气不错，出来走走',
    images: [],
    likes: [],
    comments: [],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
]

export const MomentsProvider = ({ children }: { children: ReactNode }) => {
  const [moments, setMoments] = useState<Moment[]>(() => {
    const saved = localStorage.getItem('moments')
    return saved ? JSON.parse(saved) : defaultMoments
  })

  useEffect(() => {
    // 保存最近200条朋友圈（扩大容量）
    const momentsToSave = moments.slice(0, 200)
    
    // 压缩数据：移除不必要的字段，减少存储空间
    const compressedMoments = momentsToSave.map(moment => ({
      ...moment,
      // 压缩图片数据（如果图片是base64，只保留前100个字符作为缩略图）
      images: moment.images.map(img => ({
        id: img.id,
        url: img.url.startsWith('data:') && img.url.length > 1000 
          ? img.url.substring(0, 100) + '...[compressed]'
          : img.url
      })),
      // 限制评论数量，每条朋友圈最多保留最近50条评论
      comments: moment.comments.slice(-50),
      // 限制点赞数量，每条朋友圈最多保留最近100个点赞
      likes: moment.likes.slice(-100)
    }))
    
    try {
      localStorage.setItem('moments', JSON.stringify(compressedMoments))
    } catch (error) {
      console.error('保存朋友圈失败，可能是存储空间不足:', error)
      // 如果保存失败，尝试只保存最近100条
      try {
        const reducedMoments = compressedMoments.slice(0, 100)
        localStorage.setItem('moments', JSON.stringify(reducedMoments))
        console.log('✅ 已压缩保存100条朋友圈')
      } catch (e) {
        console.error('保存失败，尝试保存50条')
        try {
          const minimalMoments = compressedMoments.slice(0, 50)
          localStorage.setItem('moments', JSON.stringify(minimalMoments))
          console.log('✅ 已压缩保存50条朋友圈')
        } catch (err) {
          console.error('存储空间严重不足，请清理数据')
          alert('存储空间不足！\n\n请前往【我】->【设置】->【存储管理】清理数据')
        }
      }
    }
  }, [moments])

  const addMoment = (momentData: Omit<Moment, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    const newMoment: Moment = {
      ...momentData,
      id: Date.now().toString(),
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    }
    setMoments(prev => [newMoment, ...prev])
  }

  const deleteMoment = (id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id))
  }

  const likeMoment = (momentId: string, userId: string, userName: string, userAvatar: string) => {
    setMoments(prev => prev.map(moment => {
      if (moment.id === momentId) {
        // 检查是否已经点赞
        if (moment.likes.some(like => like.userId === userId)) {
          return moment
        }
        return {
          ...moment,
          likes: [...moment.likes, {
            id: `${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            userName,
            userAvatar
          }]
        }
      }
      return moment
    }))
  }

  const unlikeMoment = (momentId: string, userId: string) => {
    setMoments(prev => prev.map(moment => {
      if (moment.id === momentId) {
        return {
          ...moment,
          likes: moment.likes.filter(like => like.userId !== userId)
        }
      }
      return moment
    }))
  }

  const addComment = (momentId: string, userId: string, userName: string, userAvatar: string, content: string) => {
    setMoments(prev => prev.map(moment => {
      if (moment.id === momentId) {
        return {
          ...moment,
          comments: [...moment.comments, {
            id: `${Date.now()}-${userId}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            userName,
            userAvatar,
            content,
            createdAt: new Date().toISOString()
          }]
        }
      }
      return moment
    }))
  }

  const deleteComment = (momentId: string, commentId: string) => {
    setMoments(prev => prev.map(moment => {
      if (moment.id === momentId) {
        return {
          ...moment,
          comments: moment.comments.filter(comment => comment.id !== commentId)
        }
      }
      return moment
    }))
  }

  return (
    <MomentsContext.Provider value={{
      moments,
      addMoment,
      deleteMoment,
      likeMoment,
      unlikeMoment,
      addComment,
      deleteComment
    }}>
      {children}
    </MomentsContext.Provider>
  )
}

export const useMoments = () => {
  const context = useContext(MomentsContext)
  if (context === undefined) {
    throw new Error('useMoments must be used within a MomentsProvider')
  }
  return context
}




