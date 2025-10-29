/**
 * ForumPublish.tsx - 发帖页面
 * 
 * 微博风格的发帖界面
 * 支持文字、图片、话题标签、地点
 * 
 * @module pages/ForumPublish
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useForum } from '../context/ForumContext'
import { BackIcon, ImageIcon, CameraIcon, LocationIcon, AddIcon } from '../components/Icons'
import { PostType } from '../types/forum'
import { getForumCharacters } from '../utils/forumAI'
import { parseMentions, handleMentions, insertMention } from '../utils/forumAIReply'
import { handlePostInteractions } from '../utils/forumAutoReply'

const ForumPublish = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const { addPost, saveDraft } = useForum()
  
  // ==================== 状态管理 ====================
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const [currentTag, setCurrentTag] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [showMentionSelector, setShowMentionSelector] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ==================== 图片处理 ====================
  
  /**
   * 处理图片选择
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  /**
   * 删除图片
   */
  const handleImageRemove = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // ==================== 话题处理 ====================
  
  /**
   * 添加话题
   */
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()])
      setCurrentTag('')
      setShowTagInput(false)
    }
  }

  /**
   * 删除话题
   */
  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
  }

  // ==================== 发布处理 ====================
  
  /**
   * 发布帖子
   */
  const handlePublish = async () => {
    if (!content.trim() && images.length === 0) {
      alert('请输入内容或添加图片')
      return
    }

    try {
      setPublishing(true)
      
      // 获取当前用户信息
      const currentUser = {
        id: 'currentUser',
        name: '我',
        avatar: '😊',
      }

      const newPost = addPost({
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content: content.trim(),
        type: images.length > 0 ? PostType.IMAGE : PostType.TEXT,
        images: images.length > 0 ? images : undefined,
        tags: tags.length > 0 ? tags : undefined,
        location: location || undefined,
        isVerified: false,
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        isLiked: false,
        isFavorited: false,
      })

      console.log('✅ 帖子发布成功:', newPost.id)

      // 检查是否@了角色，触发AI回复
      const mentions = parseMentions(content)
      if (mentions.length > 0) {
        console.log('🎯 帖子中检测到@角色:', mentions)
        // 异步处理AI评论
        handleMentions(
          newPost.id,
          content.trim(),
          currentUser.id,
          currentUser.name
        )
      } else {
        // 没有@角色时，触发随机角色互动（评论、楼中楼、私信）
        console.log('🎲 触发随机角色互动')
        handlePostInteractions(newPost)
      }

      // 发布成功，返回论坛页面
      navigate('/forum', { replace: true })
    } catch (error) {
      console.error('发布失败:', error)
      alert('发布失败，请重试')
    } finally {
      setPublishing(false)
    }
  }

  /**
   * 保存草稿
   */
  const handleSaveDraft = () => {
    if (!content.trim() && images.length === 0) return

    try {
      saveDraft({
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        tags: tags.length > 0 ? tags : undefined,
        location: location || undefined,
      })
      
      alert('草稿已保存')
      navigate('/forum', { replace: true })
    } catch (error) {
      console.error('保存草稿失败:', error)
      alert('保存失败，请重试')
    }
  }

  /**
   * 返回确认
   */
  const handleBack = () => {
    if (content.trim() || images.length > 0) {
      if (window.confirm('内容尚未发布，是否保存为草稿？')) {
        handleSaveDraft()
      } else {
        navigate(-1)
      }
    } else {
      navigate(-1)
    }
  }

  // ==================== 渲染 ====================

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 顶部玻璃白色区域 */}
      <div className="glass-effect border-b border-white/30 shadow-sm flex-shrink-0">
        {/* 状态栏 */}
        {showStatusBar && <StatusBar />}

        {/* 顶部导航栏 */}
        <div className="px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="text-[15px] text-gray-700 active:opacity-60"
        >
          取消
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900">发微博</h1>
        <button
          onClick={handlePublish}
          disabled={publishing || (!content.trim() && images.length === 0)}
          className={`px-4 py-1.5 rounded-full text-[14px] font-medium ${
            publishing || (!content.trim() && images.length === 0)
              ? 'bg-gray-200 text-gray-400'
              : 'bg-[#ff6c00] text-white active:opacity-80'
          }`}
        >
          {publishing ? '发布中...' : '发布'}
        </button>
      </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {/* 文字输入 */}
        <div className="p-4 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setCursorPosition(e.target.selectionStart || 0)
            }}
            onClick={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0)}
            placeholder="分享新鲜事..."
            className="w-full min-h-[150px] text-[16px] text-gray-900 placeholder-gray-400 outline-none resize-none"
            autoFocus
          />
          
          {/* @角色按钮 */}
          <button
            onClick={() => setShowMentionSelector(!showMentionSelector)}
            className="absolute bottom-2 right-2 w-9 h-9 flex items-center justify-center text-[#ff6c00] active:opacity-60 bg-white rounded-full shadow-sm"
            title="@角色"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M16 8h-6a4 4 0 1 0 0 8h0V14"/>
            </svg>
          </button>

          {/* 角色选择器 */}
          {showMentionSelector && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl max-h-[300px] overflow-y-auto z-50">
              <div className="p-2">
                <div className="text-[13px] text-gray-500 px-3 py-2">选择要@的角色</div>
                {getForumCharacters().map((character) => (
                  <button
                    key={character.characterId}
                    onClick={() => {
                      const result = insertMention(content, cursorPosition, character.originalName)
                      setContent(result.newValue)
                      setCursorPosition(result.newCursorPos)
                      setShowMentionSelector(false)
                      textareaRef.current?.focus()
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                      {character.forumAvatar || character.originalAvatar || '😊'}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-[14px] font-medium text-gray-900 truncate">
                        {character.forumNickname || character.originalName}
                      </div>
                      <div className="text-[12px] text-gray-500 truncate">
                        @{character.originalName}
                      </div>
                    </div>
                  </button>
                ))}
                {getForumCharacters().length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-[14px]">暂无可@的角色</p>
                    <p className="text-[12px] mt-1">请先在论坛初始化时添加角色</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={image} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center active:opacity-70"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < 9 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center active:bg-gray-50"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 话题标签 */}
        {tags.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="px-3 py-1.5 bg-[#fff6ed] rounded-full flex items-center gap-2"
                >
                  <span className="text-[14px] text-[#ff6c00]">#{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="w-4 h-4 flex items-center justify-center active:opacity-60"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff6c00" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 地点显示 */}
        {location && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 text-[14px] text-gray-600">
              <LocationIcon size={16} />
              <span>{location}</span>
              <button
                onClick={() => setLocation('')}
                className="ml-auto text-gray-400 active:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 话题输入对话框 */}
        {showTagInput && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-4">
              <h3 className="text-[17px] font-semibold text-gray-900 mb-3">添加话题</h3>
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="输入话题名称"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[15px] outline-none focus:border-[#ff6c00]"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowTagInput(false)
                    setCurrentTag('')
                  }}
                  className="flex-1 py-2 text-[15px] text-gray-700 border border-gray-200 rounded-full active:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleAddTag}
                  disabled={!currentTag.trim()}
                  className={`flex-1 py-2 text-[15px] rounded-full ${
                    currentTag.trim()
                      ? 'bg-[#ff6c00] text-white active:opacity-80'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部工具栏 */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0">
        {/* 编辑工具 */}
        <div className="px-4 py-2 flex items-center gap-4 border-b border-gray-50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 active:bg-gray-100"
          >
            <ImageIcon size={18} className="text-gray-700" />
            <span className="text-[13px] text-gray-700">图片</span>
          </button>

          <button
            onClick={() => setShowTagInput(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 active:bg-gray-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
              <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round"/>
            </svg>
            <span className="text-[13px] text-gray-700">话题</span>
          </button>

          <button
            onClick={() => setLocation('北京·朝阳区')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 active:bg-gray-100"
          >
            <LocationIcon size={18} className="text-gray-700" />
            <span className="text-[13px] text-gray-700">位置</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={!content.trim() && images.length === 0}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 active:bg-gray-100 disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21v-8H7v8M7 3v5h8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[13px] text-gray-700">草稿</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-around py-2">
          <button 
            onClick={() => navigate('/forum')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-[11px] text-gray-600">首页</span>
          </button>
          
          <button 
            onClick={() => navigate('/forum/topics')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] text-gray-600">话题</span>
          </button>
          
          <button className="flex flex-col items-center -mt-3">
            <div className="w-12 h-12 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] rounded-full flex items-center justify-center shadow-lg opacity-50">
              <AddIcon size={24} className="text-white" />
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/forum/notifications')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] text-gray-600">消息</span>
          </button>
          
          <button 
            onClick={() => navigate('/forum/profile')}
            className="flex flex-col items-center gap-1 py-1 active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[11px] text-gray-600">我</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForumPublish
