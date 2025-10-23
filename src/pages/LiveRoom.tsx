import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

interface Comment {
  user: string
  text: string
  id: number
}

const LiveRoom = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showStatusBar } = useSettings()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(88000)
  const [commentCount] = useState(23000)
  const [inputText, setInputText] = useState('')
  const [comments, setComments] = useState<Comment[]>([
    { user: '用户A', text: '主播好厉害', id: 1 },
    { user: '用户B', text: '666666', id: 2 },
    { user: '用户C', text: '刚来，发生什么了', id: 3 },
  ])
  const [showGiftPanel, setShowGiftPanel] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }

  const handleSendComment = () => {
    if (inputText.trim()) {
      const newComment: Comment = {
        user: '我',
        text: inputText,
        id: Date.now()
      }
      setComments(prev => [...prev, newComment])
      setInputText('')
    }
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {showStatusBar && <StatusBar />}
      {/* 直播画面区域 */}
      <div className="relative flex-1 bg-gray-900">
        {/* 模拟直播画面 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-lg">直播画面</div>
        </div>

        {/* 顶部信息栏 */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <BackIcon size={20} />
            </button>

            {/* 主播信息 */}
            <div className="flex-1 mx-3 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-700"></div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">主播名称</div>
                <div className="text-white/70 text-xs">1.2万人观看</div>
              </div>
              <button
                onClick={handleFollow}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isFollowing
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {isFollowing ? '已关注' : '关注'}
              </button>
            </div>

            {/* 更多按钮 */}
            <button 
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
          </div>
        </div>

        {/* 更多菜单 */}
        {showMoreMenu && (
          <div className="absolute top-16 right-4 bg-white rounded-xl shadow-xl overflow-hidden z-10">
            {['举报', '屏蔽', '清晰度', '音量'].map((item) => (
              <button
                key={item}
                onClick={() => setShowMoreMenu(false)}
                className="w-full px-6 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* 右侧功能栏 */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-4">
          {/* 点赞 */}
          <div className="flex flex-col items-center">
            <button 
              onClick={handleLike}
              className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-all ${
                isLiked ? 'text-red-500' : 'text-white'
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <span className="text-white text-xs mt-1">{(likeCount / 10000).toFixed(1)}万</span>
          </div>

          {/* 评论 */}
          <div className="flex flex-col items-center">
            <button 
              onClick={() => inputRef.current?.focus()}
              className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <span className="text-white text-xs mt-1">{(commentCount / 10000).toFixed(1)}万</span>
          </div>

          {/* 分享 */}
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
            <span className="text-white text-xs mt-1">分享</span>
          </div>
        </div>

        {/* 弹幕区域 */}
        <div className="absolute left-4 right-20 bottom-32 max-h-48 overflow-hidden">
          <div className="flex flex-col gap-2">
            {comments.slice(-5).map((comment) => (
              <div key={comment.id} className="px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white text-sm max-w-xs w-fit">
                <span className="text-blue-400 font-medium">{comment.user}：</span>
                <span>{comment.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 礼物面板 */}
      {showGiftPanel && (
        <>
          {/* 遮罩层 */}
          <div 
            className="absolute inset-0 bg-black/50 z-20"
            onClick={() => setShowGiftPanel(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 pb-20 z-30 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">选择礼物</h3>
              <button onClick={() => setShowGiftPanel(false)} className="text-gray-500 hover:text-gray-700">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
              {['玫瑰', '爱心', '火箭', '跑车', '城堡', '皇冠', '钻石', '星星'].map((gift, index) => (
                <button
                  key={gift}
                  onClick={() => {
                    setShowGiftPanel(false)
                    const newComment: Comment = {
                      user: '我',
                      text: `送出了${gift}`,
                      id: Date.now()
                    }
                    setComments(prev => [...prev, newComment])
                  }}
                  className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center text-3xl">
                    {['🌹', '❤️', '🚀', '🚗', '🏰', '👑', '💎', '⭐'][index]}
                  </div>
                  <span className="text-xs text-gray-900 font-medium">{gift}</span>
                  <span className="text-xs text-red-500 font-semibold">{(index + 1) * 10}币</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 底部互动区域 */}
      <div className="bg-white border-t border-gray-200 z-40 relative">
        <div className="flex items-center gap-2 p-3">
          {/* 表情按钮 */}
          <button className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>

          {/* 输入框 */}
          <div className="flex-1 h-10 px-4 bg-gray-100 rounded-full flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
              placeholder="说点什么..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* 发送按钮 */}
          {inputText ? (
            <button 
              onClick={handleSendComment}
              className="px-5 h-10 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 active:bg-gray-700 transition-colors flex-shrink-0"
            >
              发送
            </button>
          ) : (
            /* 礼物按钮 */
            <button 
              onClick={() => setShowGiftPanel(!showGiftPanel)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white hover:from-pink-600 hover:to-red-600 active:scale-95 transition-all flex-shrink-0 shadow-lg"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LiveRoom
