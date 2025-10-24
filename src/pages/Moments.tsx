import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon, CameraIcon, LikeIcon, CommentIcon, MoreVerticalIcon, HeartFilledIcon } from '../components/Icons'
import { useUser } from '../context/UserContext'
import { useMoments } from '../context/MomentsContext'
import { ImageViewer } from '../components/ImageViewer'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const Moments = () => {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const { moments, likeMoment, unlikeMoment, addComment } = useMoments()
  const { showStatusBar } = useSettings()
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [replyToUser, setReplyToUser] = useState<string>('')
  const [coverImage, setCoverImage] = useState<string>(() => {
    // 从localStorage读取封面图片
    return localStorage.getItem('moments_cover_image') || ''
  })
  const [viewerImages, setViewerImages] = useState<string[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)
  const [showViewer, setShowViewer] = useState(false)

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
    setCommentText('')
    setReplyToUser('')
    setShowCommentInput(null)
  }

  // 处理点击评论（回复评论）
  const handleReplyComment = (momentId: string, userName: string) => {
    setShowCommentInput(momentId)
    setReplyToUser(userName)
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部：StatusBar + 导航栏一体化 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              navigate('/discover', { replace: true })
            }}
            className="w-10 h-10 rounded-full glass-effect flex items-center justify-center ios-button"
          >
             <BackIcon size={20} className="text-gray-700" />
           </button>
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

      {/* 顶部封面区域 */}
      <div className="relative h-80 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
        {/* 封面背景 */}
        <div 
          className="absolute inset-0 bg-gray-300 cursor-pointer group"
          onClick={handleCoverUpload}
        >
          {coverImage ? (
            <img 
              src={coverImage} 
              alt="朋友圈封面" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <div className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                点击上传封面图片
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* 用户信息 */}
         <div className="absolute bottom-6 right-4 flex items-center gap-3 z-10">
           <div className="text-right max-w-[200px]">
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
                      {moment.content}
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
                            onClick={() => handleReplyComment(moment.id, comment.userName)}
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
                            onClick={() => setReplyToUser('')}
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

