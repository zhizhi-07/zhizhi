// 情侣空间内容管理工具

export interface CoupleAlbumPhoto {
  id: string
  characterId: string
  characterName: string
  description: string
  timestamp: number
  createdAt: number
}

export interface CoupleMessage {
  id: string
  characterId: string
  characterName: string
  content: string
  timestamp: number
  createdAt: number
}

export interface CoupleAnniversary {
  id: string
  characterId: string
  characterName: string
  date: string // 格式：YYYY-MM-DD
  title: string
  description?: string
  timestamp: number
  createdAt: number
}

const STORAGE_KEYS = {
  ALBUM: 'couple_space_album',
  MESSAGES: 'couple_space_messages',
  ANNIVERSARIES: 'couple_space_anniversaries'
}

// ==================== 相册功能 ====================

export const addCouplePhoto = (
  characterId: string,
  characterName: string,
  description: string
): CoupleAlbumPhoto => {
  const photos = getCouplePhotos()
  
  const newPhoto: CoupleAlbumPhoto = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    characterId,
    characterName,
    description,
    timestamp: Date.now(),
    createdAt: Date.now()
  }
  
  photos.unshift(newPhoto)
  localStorage.setItem(STORAGE_KEYS.ALBUM, JSON.stringify(photos))
  
  return newPhoto
}

export const getCouplePhotos = (characterId?: string): CoupleAlbumPhoto[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ALBUM)
    if (!data) return []
    
    const photos: CoupleAlbumPhoto[] = JSON.parse(data)
    
    if (characterId) {
      return photos.filter(p => p.characterId === characterId)
    }
    
    return photos
  } catch (error) {
    console.error('获取相册失败:', error)
    return []
  }
}

export const deleteCouplePhoto = (photoId: string): boolean => {
  try {
    const photos = getCouplePhotos()
    const filtered = photos.filter(p => p.id !== photoId)
    localStorage.setItem(STORAGE_KEYS.ALBUM, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('删除照片失败:', error)
    return false
  }
}

// ==================== 留言板功能 ====================

export const addCoupleMessage = (
  characterId: string,
  characterName: string,
  content: string
): CoupleMessage => {
  const messages = getCoupleMessages()
  
  const newMessage: CoupleMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    characterId,
    characterName,
    content,
    timestamp: Date.now(),
    createdAt: Date.now()
  }
  
  messages.unshift(newMessage)
  localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  
  return newMessage
}

export const getCoupleMessages = (characterId?: string): CoupleMessage[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    if (!data) return []
    
    const messages: CoupleMessage[] = JSON.parse(data)
    
    if (characterId) {
      return messages.filter(m => m.characterId === characterId)
    }
    
    return messages
  } catch (error) {
    console.error('获取留言失败:', error)
    return []
  }
}

export const deleteCoupleMessage = (messageId: string): boolean => {
  try {
    const messages = getCoupleMessages()
    const filtered = messages.filter(m => m.id !== messageId)
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('删除留言失败:', error)
    return false
  }
}

// ==================== 纪念日功能 ====================

export const addCoupleAnniversary = (
  characterId: string,
  characterName: string,
  date: string,
  title: string,
  description?: string
): CoupleAnniversary => {
  const anniversaries = getCoupleAnniversaries()
  
  const newAnniversary: CoupleAnniversary = {
    id: `anniv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    characterId,
    characterName,
    date,
    title,
    description,
    timestamp: Date.now(),
    createdAt: Date.now()
  }
  
  anniversaries.push(newAnniversary)
  // 按日期排序
  anniversaries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  localStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(anniversaries))
  
  return newAnniversary
}

export const getCoupleAnniversaries = (characterId?: string): CoupleAnniversary[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ANNIVERSARIES)
    if (!data) return []
    
    const anniversaries: CoupleAnniversary[] = JSON.parse(data)
    
    if (characterId) {
      return anniversaries.filter(a => a.characterId === characterId)
    }
    
    return anniversaries
  } catch (error) {
    console.error('获取纪念日失败:', error)
    return []
  }
}

export const deleteCoupleAnniversary = (anniversaryId: string): boolean => {
  try {
    const anniversaries = getCoupleAnniversaries()
    const filtered = anniversaries.filter(a => a.id !== anniversaryId)
    localStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('删除纪念日失败:', error)
    return false
  }
}

// ==================== 工具函数 ====================

// 计算距离某个日期还有多少天
export const getDaysUntil = (dateStr: string): number => {
  const targetDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  
  const diff = targetDate.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// 格式化日期显示
export const formatAnniversaryDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}月${day}日`
}
