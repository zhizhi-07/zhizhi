// 小红书相关类型定义

export interface XiaohongshuNote {
  id: string
  title: string
  description: string
  coverImage: string
  images: string[]
  author: {
    id: string
    nickname: string
    avatar: string
  }
  stats: {
    likes: number
    comments: number
    collects: number
  }
  tags: string[]
  url: string
  createTime: number
  topComments?: {  // 热门评论（可选）
    author: string
    content: string
    likes: number
  }[]
}

export interface XiaohongshuSearchResult {
  notes: XiaohongshuNote[]
  total: number
  hasMore: boolean
}
