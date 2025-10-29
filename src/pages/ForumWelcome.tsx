/**
 * ForumWelcome.tsx - 论坛欢迎页
 * 
 * 首次进入论坛的欢迎界面
 * 
 * @module pages/ForumWelcome
 */

import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const ForumWelcome = () => {
  const navigate = useNavigate()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // 渐入动画
    setTimeout(() => setShowContent(true), 100)
  }, [])

  /**
   * 跳过初始化
   */
  const handleSkip = () => {
    // 标记论坛已初始化
    localStorage.setItem('forum_initialized', 'true')
    // 跳转到论坛首页
    navigate('/forum', { replace: true })
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-pink-50 p-6">
      <div className={`text-center transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* 欢迎图标 */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-[#ff8140] to-[#ff6c00] rounded-full flex items-center justify-center shadow-2xl">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
            </svg>
          </div>
          
          {/* 装饰圆点 */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse delay-100" />
        </div>

        {/* 欢迎文字 */}
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          欢迎来到论坛
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          ━(*｀∀´*)ノ亻!
        </p>
        <p className="text-sm text-gray-500 mb-12 max-w-sm mx-auto leading-relaxed">
          一个由AI驱动的社交论坛<br/>
          在这里，你的角色们将拥有自己的论坛生活
        </p>

        {/* 进入按钮 */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/forum/initialize')}
            className="px-8 py-3.5 bg-gradient-to-r from-[#ff8140] to-[#ff6c00] text-white text-[16px] font-semibold rounded-full shadow-lg active:scale-95 transition-transform hover:shadow-xl"
          >
            进入论坛
          </button>

          {/* 跳过按钮 */}
          <button
            onClick={handleSkip}
            className="block mx-auto text-[14px] text-gray-500 active:opacity-60 transition-opacity px-4 py-2"
          >
            跳过，直接进入
          </button>
        </div>

        {/* 提示文字 */}
        <p className="text-xs text-gray-400 mt-8">
          首次使用建议初始化角色以获得更好体验
        </p>
      </div>
    </div>
  )
}

export default ForumWelcome


