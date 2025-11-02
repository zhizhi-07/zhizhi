import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon, CameraIcon, LikeIcon, CommentIcon, MoreVerticalIcon, HeartFilledIcon } from '../components/Icons'
import { useUser, useCharacter } from '../context/ContactsContext'
import { useMoments } from '../context/MomentsContext'
import { ImageViewer } from '../components/ImageViewer'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { getUnreadNotificationCount } from '../utils/momentsNotification'

const Moments = () => {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const { moments, likeMoment, unlikeMoment, addComment } = useMoments()
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [replyToUser, setReplyToUser] = useState<string>('')
  const [replyToUserId, setReplyToUserId] = useState<string>('')
  const [coverImage, setCoverImage] = useState<string>(() => {
    // 从localStorage读取封面图片
    return localStorage.getItem('moments_cover_image') || ''
  })
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [showViewer, setShowViewer] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  // 监听未读通知数量
  useEffect(() => {
    const updateUnreadCount = () => {
      setUnreadCount(getUnreadNotificationCount())
    }
    
    updateUnreadCount()
    
    // 每秒检查一次
    const interval = setInterval(updateUnreadCount, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // 获取头像显示
  const getAvatarDisplay = (avatar: string, size: 'small' | 'medium' | 'large' = 'medium') => {
    const sizeClasses = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-2xl'
    }
    
    if (avatar.startsWith('data:image')) {
      return <img src={avatar} alt="头像" className="w-full h-full object-cover" />
    }
    
    // 如果是emoji，直接显示
    if (avatar && avatar.length <= 4) {
      return <div className={`${sizeClasses[size]}`}>{avatar}</div>
    }
    
    // 否则显示首字母
    return <div className="text-white text-base font-semibold bg-gradient-to-br from-blue-400 to-blue-600 w-full h-full flex items-center justify-center">
      {avatar?.[0] || '用'}
    </div>
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 3) return `${days}天前`
    
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 处理点赞
  const handleLike = (momentId: string) => {
    if (!currentUser) return
    
    const moment = moments.find(m => m.id === momentId)
    if (!moment) return
    
    const hasLiked = moment.likes.some(like => like.userId === currentUser.id)
    
    if (hasLiked) {
      unlikeMoment(momentId, currentUser.id)
    } else {
      likeMoment(momentId, currentUser.id, currentUser.name, currentUser.avatar)
    }
  }

  // 处理评论提交
  const handleCommentSubmit = (momentId: string) => {
    if (!currentUser || !commentText.trim()) return
    
    // 如果是回复评论，添加@前缀
    const finalComment = replyToUser ? `@${replyToUser} ${commentText.trim()}` : commentText.trim()
    
    addComment(momentId, currentUser.id, currentUser.name, currentUser.avatar, finalComment)
    
    // 找到这条朋友圈
    const moment = moments.find(m => m.id === momentId)
    
    // 如果是回复AI角色的评论，同步到该角色的聊天记录并触发AI反应
    if (replyToUserId && replyToUserId !== currentUser.id) {
      const character = getCharacter(replyToUserId)
      if (character) {
        // 同步回复到被回复者的聊天记录
        const chatMessages = localStorage.getItem(`chat_messages_${replyToUserId}`)
        const messages = chatMessages ? JSON.parse(chatMessages) : []
        
        const replyNotification = {
          id: Date.now() + Math.random(),
          type: 'system',
          content: `💬 ${currentUser.name} 回复了你的朋友圈评论：${finalComment}`,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system',
          isHidden: true  // 隐藏，用户不可见
        }
        
        messages.push(replyNotification)
        localStorage.setItem(`chat_messages_${replyToUserId}`, JSON.stringify(messages))
        console.log(`💾 回复已同步到 ${character.name} 的聊天记录`)
        
        // AI反应已由社交总监系统统一处理（通过useMomentsSocial监听评论变化）
        // 旧的triggerAIReactToComment系统已禁用，避免冲突
        console.log(`💬 ${character.name} 收到回复通知，社交总监将决定是否安排AI互动`)
      }
    } 
    // 如果不是回复评论，而是直接评论别人的朋友圈，同步到朋友圈作者的聊天记录
    else if (moment && moment.userId !== currentUser.id) {
      const targetCharacter = getCharacter(moment.userId)
      if (targetCharacter) {
        const chatMessages = localStorage.getItem(`chat_messages_${moment.userId}`)
        const messages = chatMessages ? JSON.parse(chatMessages) : []
        
        const commentNotification = {
          id: Date.now() + Math.random(),
          type: 'system',
          content: `💬 ${currentUser.name} 评论了你的朋友圈：${finalComment}`,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system',
          isHidden: true  // 隐藏，用户不可见
        }
        
        messages.push(commentNotification)
        localStorage.setItem(`chat_messages_${moment.userId}`, JSON.stringify(messages))
        console.log(`💾 评论已同步到 ${targetCharacter.name} 的聊天记录`)
      }
    }
    
    setCommentText('')
    setReplyToUser('')
    setReplyToUserId('')
    setShowCommentInput(null)
  }

  // 处理点击评论（回复评论）
  const handleReplyComment = (momentId: string, userName: string, userId: string) => {
    setShowCommentInput(momentId)
    setReplyToUser(userName)
    setReplyToUserId(userId)
    setCommentText('')
  }

  // 检查是否已点赞
  const hasLiked = (momentId: string) => {
    if (!currentUser) return false
    const moment = moments.find(m => m.id === momentId)
    return moment?.likes.some(like => like.userId === currentUser.id) || false
  }

  // 处理封面图片上传
  const handleCoverUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageData = event.target?.result as string
          setCoverImage(imageData)
          localStorage.setItem('moments_cover_image', imageData)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  // 打开图片查看器
  const handleImageClick = (images: string[], index: number) => {
    setViewerImages(images)
    setViewerIndex(index)
    setShowViewer(true)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部：StatusBar + 导航栏一体化（固定不滚动） */}
      <div className="glass-effect z-50 flex-shrink-0">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              navigate('/wechat/discover', { replace: true })
            }}
            className="w-10 h-10 rounded-full glass-effect flex items-center justify-center ios-button"
          >
             <BackIcon size={20} className="text-gray-700" />
           </button>
          <div className="flex items-center gap-2">
            {/* 通知图标 */}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                navigate('/moment-notifications')
              }}
              className="w-10 h-10 rounded-full glass-effect flex items-center justify-center ios-button relative"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                </div>
              )}
            </button>
            
            {/* 相机图标 */}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                navigate('/publish-moment')
              }}
              className="w-10 h-10 rounded-full glass-effect flex items-center justify-center ios-button"
            >
              <CameraIcon size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* 可滚动区域（包含封面 + 动态列表） */}
      <div className="flex-1 overflow-y-auto">
        {/* 顶部封面区域 */}
        <div className="relative h-80 bg-white overflow-hidden">
          {/* 封面背景 */}
          <div 
            className="absolute inset-0 bg-white cursor-pointer group"
            onClick={handleCoverUpload}
          >
            {coverImage ? (
              <img 
                src={coverImage} 
                alt="封面" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-white flex items-center justify-center">
                <div className="text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  点击上传封面图片
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>

          {/* 用户信息 */}
          <div className="absolute bottom-6 left-4 right-4 flex items-end justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-white font-semibold text-lg drop-shadow-lg mb-1">
                {currentUser?.name || '微信用户'}
              </h2>
              {currentUser?.signature && (
                <p className="text-white/90 text-xs drop-shadow-lg line-clamp-2">
                  {currentUser.signature}
                </p>
              )}
            </div>
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-2xl overflow-hidden border-4 border-white/50">
              {currentUser && getAvatarDisplay(currentUser.avatar, 'large')}
            </div>
          </div>
        </div>

        {/* 朋友圈动态列表 */}
        <div className="bg-white pb-20">
        {moments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-sm">暂无动态</p>
            <p className="text-xs mt-2 text-gray-300">点击右上角相机发布第一条朋友圈</p>
          </div>
        ) : (
          <div>
            {moments.map((moment) => (
              <div key={moment.id} className="bg-white border-b border-gray-100 p-4 hover:bg-gray-50/50 transition-colors">
                {/* 动态头部 */}
                <div className="flex items-start gap-3 mb-3">
                  {/* 用户头像 */}
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                    {getAvatarDisplay(moment.userAvatar, 'medium')}
                  </div>
                  
                  <div className="flex-1">
                    {/* 用户名 */}
                    <h3 className="font-semibold text-blue-600 mb-1">
                      {moment.userName}
                    </h3>
                    
                    {/* 动态内容 */}
                    <p className="text-gray-800 leading-relaxed mb-2">
                      {moment.content.replace(/\[图片[：:][^\]]+\]/g, '')}
                    </p>
                    
                    {/* 图片网格 */}
                    {moment.images.length > 0 && (
                      <div className={`grid gap-2 mb-2 ${
                        moment.images.length === 1 ? 'grid-cols-1' :
                        moment.images.length === 2 ? 'grid-cols-2' :
                        moment.images.length === 3 ? 'grid-cols-3' :
                        'grid-cols-3'
                      }`}>
                        {moment.images.map((image, index) => (
                          <div 
                            key={image.id} 
                            className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => handleImageClick(moment.images.map(img => img.url), index)}
                          >
                            <img 
                              src={image.url} 
                              alt="" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 位置和时间 */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span>{formatTime(moment.createdAt)}</span>
                      {moment.location && (
                        <>
                          <span>·</span>
                          <span>{moment.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 更多按钮 */}
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 ios-button">
                    <MoreVerticalIcon size={18} />
                  </button>
                </div>

                {/* 点赞和评论区域 */}
                {(moment.likes.length > 0 || moment.comments.length > 0) && (
                  <div className="ml-[60px] bg-gray-50 rounded-lg p-3 space-y-2">
                    {/* 点赞列表 */}
                    {moment.likes.length > 0 && (
                      <div className="flex items-start gap-2">
                        <HeartFilledIcon size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-sm leading-relaxed">
                          <span className="text-blue-600">
                            {moment.likes.map((like, index) => (
                              <span key={like.id}>
                                {like.userName}
                                {index < moment.likes.length - 1 && ', '}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* 分隔线 */}
                    {moment.likes.length > 0 && moment.comments.length > 0 && (
                      <div className="border-t border-gray-200/60" />
                    )}
                    
                    {/* 评论列表 */}
                    {moment.comments.length > 0 && (
                      <div className="space-y-2">
                        {moment.comments.map((comment) => (
                          <div 
                            key={comment.id} 
                            className="text-sm leading-relaxed cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                            onClick={() => handleReplyComment(moment.id, comment.userName, comment.userId)}
                          >
                            <span className="text-blue-600 font-medium">{comment.userName}：</span>
                            <span className="text-gray-700">{comment.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 操作栏 */}
                <div className="flex items-center justify-end gap-4 mt-3 ml-[60px]">
                  <button 
                    onClick={() => handleLike(moment.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ios-button transition-colors ${
                      hasLiked(moment.id) 
                        ? 'bg-red-50 text-red-500' 
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {hasLiked(moment.id) ? (
                      <HeartFilledIcon size={16} />
                    ) : (
                      <LikeIcon size={16} />
                    )}
                    <span className="text-xs">赞</span>
                  </button>
                  
                  <button 
                    onClick={() => setShowCommentInput(showCommentInput === moment.id ? null : moment.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 ios-button"
                  >
                    <CommentIcon size={16} />
                    <span className="text-xs">评论</span>
                  </button>
                </div>

                {/* 评论输入框 */}
                {showCommentInput === moment.id && (
                  <div className="mt-3 ml-[60px]">
                    <div className="glass-card rounded-xl p-3">
                      {/* 显示正在回复谁 */}
                      {replyToUser && (
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                          <span className="text-xs text-gray-500">
                            回复 <span className="text-blue-600 font-medium">@{replyToUser}</span>
                          </span>
                          <button
                            onClick={() => {
                              setReplyToUser('')
                              setReplyToUserId('')
                            }}
                            className="text-gray-400 hover:text-gray-600 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={replyToUser ? `回复 @${replyToUser}` : "说点什么..."}
                          className="flex-1 bg-transparent outline-none text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleCommentSubmit(moment.id)
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleCommentSubmit(moment.id)}
                          className="px-4 py-1 rounded-lg glass-effect text-blue-600 text-sm font-medium ios-button disabled:opacity-50"
                          disabled={!commentText.trim()}
                        >
                          发送
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* 图片查看器 */}
      {showViewer && (
        <ImageViewer
          images={viewerImages}
          initialIndex={viewerIndex}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  )
}

export default Moments

