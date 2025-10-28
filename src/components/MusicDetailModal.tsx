import { useState, useEffect } from 'react'

interface MusicDetailModalProps {
  songTitle: string
  songArtist: string
  songCover?: string
  isOpen: boolean
  onClose: () => void
}

const MusicDetailModal = ({
  songTitle,
  songArtist,
  songCover,
  isOpen,
  onClose
}: MusicDetailModalProps) => {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  if (!isOpen && !isClosing) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      {/* 弹窗内容 */}
      <div 
        className={`relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 歌曲封面 */}
        <div className="relative h-64 bg-gradient-to-br from-purple-400 via-pink-400 to-red-400">
          {songCover ? (
            <img 
              src={songCover} 
              alt={songTitle} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-24 h-24 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>

        {/* 歌曲信息 */}
        <div className="p-6">
          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {songTitle}
          </h2>
          
          {/* 歌手 */}
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="text-lg">{songArtist}</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                // TODO: 搜索并播放歌曲
                console.log('播放音乐:', songTitle, songArtist)
                alert('即将支持在线播放功能')
              }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full py-3 px-6 font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              播放
            </button>
            
            <button
              onClick={() => {
                // 复制歌曲信息
                const text = `${songTitle} - ${songArtist}`
                navigator.clipboard.writeText(text)
                alert('已复制歌曲信息')
              }}
              className="bg-gray-100 text-gray-700 rounded-full py-3 px-6 font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制
            </button>
          </div>

          {/* 提示文字 */}
          <p className="text-xs text-gray-400 text-center mt-4">
            点击播放按钮在音乐播放器中搜索
          </p>
        </div>
      </div>
    </div>
  )
}

export default MusicDetailModal
