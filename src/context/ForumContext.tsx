/**
 * 论坛功能 - Context 状态管理
 * 
 * 统一管理论坛相关的状态和操作
 * 使用 React Context API 实现全局状态管理
 * 
 * @module context/ForumContext
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { 
  ForumPost, 
  ForumComment, 
  ForumDraft,
  PostQueryOptions,
  PaginatedResult,
  ForumTab
} from '../types/forum'
import * as forumStorage from '../utils/forumStorage'

// ==================== Context类型定义 ====================

interface ForumContextType {
  // 状态
  posts: ForumPost[]
  currentTab: ForumTab
  loading: boolean
  error: string | null
  
  // 帖子操作
  loadPosts: (options?: PostQueryOptions) => Promise<void>
  addPost: (post: Omit<ForumPost, 'id' | 'timestamp'>) => ForumPost
  updatePost: (id: string, updates: Partial<ForumPost>) => boolean
  deletePost: (id: string) => boolean
  getPost: (id: string) => ForumPost | null
  
  // 互动操作
  toggleLike: (postId: string) => boolean
  toggleFavorite: (postId: string) => boolean
  
  // 评论操作
  getComments: (postId: string) => ForumComment[]
  addComment: (comment: Omit<ForumComment, 'id' | 'timestamp'>) => ForumComment
  deleteComment: (id: string) => boolean
  
  // 草稿操作
  getDrafts: () => ForumDraft[]
  saveDraft: (draft: Omit<ForumDraft, 'id' | 'timestamp'>) => ForumDraft
  deleteDraft: (id: string) => boolean
  
  // Tab切换
  setTab: (tab: ForumTab) => void
  
  // 工具方法
  refreshPosts: () => Promise<void>
  clearError: () => void
}

// ==================== 创建Context ====================

const ForumContext = createContext<ForumContextType | undefined>(undefined)

// ==================== Provider组件 ====================

interface ForumProviderProps {
  children: React.ReactNode
}

export const ForumProvider: React.FC<ForumProviderProps> = ({ children }) => {
  // ==================== 状态定义 ====================
  
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [currentTab, setCurrentTab] = useState<ForumTab>('recommend' as ForumTab)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ==================== 初始化加载 ====================
  
  useEffect(() => {
    // 初始化模拟数据（仅首次）
    forumStorage.initializeMockData()
    // 加载帖子
    loadPosts()
  }, [])

  // ==================== 帖子操作 ====================

  /**
   * 加载帖子列表
   */
  const loadPosts = useCallback(async (options?: PostQueryOptions) => {
    try {
      setLoading(true)
      setError(null)
      
      // 模拟异步加载
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const result = forumStorage.queryPosts({
        ...options,
        tab: options?.tab || currentTab
      })
      
      setPosts(result.items)
    } catch (err) {
      console.error('加载帖子失败:', err)
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [currentTab])

  /**
   * 添加帖子
   */
  const addPost = useCallback((postData: Omit<ForumPost, 'id' | 'timestamp'>): ForumPost => {
    try {
      const newPost = forumStorage.addPost(postData)
      setPosts(prev => [newPost, ...prev])
      return newPost
    } catch (err) {
      console.error('添加帖子失败:', err)
      throw err
    }
  }, [])

  /**
   * 更新帖子
   */
  const updatePost = useCallback((id: string, updates: Partial<ForumPost>): boolean => {
    try {
      const success = forumStorage.updatePost(id, updates)
      if (success) {
        setPosts(prev => prev.map(post => 
          post.id === id ? { ...post, ...updates } : post
        ))
      }
      return success
    } catch (err) {
      console.error('更新帖子失败:', err)
      return false
    }
  }, [])

  /**
   * 删除帖子
   */
  const deletePost = useCallback((id: string): boolean => {
    try {
      const success = forumStorage.deletePost(id)
      if (success) {
        setPosts(prev => prev.filter(post => post.id !== id))
      }
      return success
    } catch (err) {
      console.error('删除帖子失败:', err)
      return false
    }
  }, [])

  /**
   * 获取单个帖子
   */
  const getPost = useCallback((id: string): ForumPost | null => {
    return forumStorage.getPostById(id)
  }, [])

  // ==================== 互动操作 ====================

  /**
   * 切换点赞状态
   */
  const toggleLike = useCallback((postId: string): boolean => {
    try {
      const success = forumStorage.togglePostLike(postId)
      if (success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
            }
          }
          return post
        }))
      }
      return success
    } catch (err) {
      console.error('切换点赞失败:', err)
      return false
    }
  }, [])

  /**
   * 切换收藏状态
   */
  const toggleFavorite = useCallback((postId: string): boolean => {
    try {
      const success = forumStorage.togglePostFavorite(postId)
      if (success) {
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isFavorited: !post.isFavorited
            }
          }
          return post
        }))
      }
      return success
    } catch (err) {
      console.error('切换收藏失败:', err)
      return false
    }
  }, [])

  // ==================== 评论操作 ====================

  /**
   * 获取帖子评论
   */
  const getComments = useCallback((postId: string): ForumComment[] => {
    return forumStorage.getPostComments(postId)
  }, [])

  /**
   * 添加评论
   */
  const addComment = useCallback((commentData: Omit<ForumComment, 'id' | 'timestamp'>): ForumComment => {
    try {
      const newComment = forumStorage.addComment(commentData)
      
      // 更新对应帖子的评论数
      setPosts(prev => prev.map(post => {
        if (post.id === commentData.postId) {
          return {
            ...post,
            commentCount: post.commentCount + 1
          }
        }
        return post
      }))
      
      return newComment
    } catch (err) {
      console.error('添加评论失败:', err)
      throw err
    }
  }, [])

  /**
   * 删除评论
   */
  const deleteComment = useCallback((id: string): boolean => {
    try {
      return forumStorage.deleteComment(id)
    } catch (err) {
      console.error('删除评论失败:', err)
      return false
    }
  }, [])

  // ==================== 草稿操作 ====================

  /**
   * 获取草稿列表
   */
  const getDrafts = useCallback((): ForumDraft[] => {
    return forumStorage.getDrafts()
  }, [])

  /**
   * 保存草稿
   */
  const saveDraft = useCallback((draftData: Omit<ForumDraft, 'id' | 'timestamp'>): ForumDraft => {
    try {
      return forumStorage.saveDraft(draftData)
    } catch (err) {
      console.error('保存草稿失败:', err)
      throw err
    }
  }, [])

  /**
   * 删除草稿
   */
  const deleteDraft = useCallback((id: string): boolean => {
    try {
      return forumStorage.deleteDraft(id)
    } catch (err) {
      console.error('删除草稿失败:', err)
      return false
    }
  }, [])

  // ==================== Tab切换 ====================

  /**
   * 切换Tab
   */
  const setTab = useCallback((tab: ForumTab) => {
    setCurrentTab(tab)
    loadPosts({ tab })
  }, [loadPosts])

  // ==================== 工具方法 ====================

  /**
   * 刷新帖子列表
   */
  const refreshPosts = useCallback(async () => {
    await loadPosts()
  }, [loadPosts])

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ==================== Context值 ====================

  const value: ForumContextType = {
    // 状态
    posts,
    currentTab,
    loading,
    error,
    
    // 帖子操作
    loadPosts,
    addPost,
    updatePost,
    deletePost,
    getPost,
    
    // 互动操作
    toggleLike,
    toggleFavorite,
    
    // 评论操作
    getComments,
    addComment,
    deleteComment,
    
    // 草稿操作
    getDrafts,
    saveDraft,
    deleteDraft,
    
    // Tab切换
    setTab,
    
    // 工具方法
    refreshPosts,
    clearError,
  }

  return (
    <ForumContext.Provider value={value}>
      {children}
    </ForumContext.Provider>
  )
}

// ==================== Hook ====================

/**
 * 使用论坛Context的Hook
 * 
 * @example
 * ```tsx
 * const { posts, loading, addPost } = useForum()
 * ```
 */
export function useForum(): ForumContextType {
  const context = useContext(ForumContext)
  if (context === undefined) {
    throw new Error('useForum must be used within a ForumProvider')
  }
  return context
}

// ==================== 导出 ====================

export default ForumContext

