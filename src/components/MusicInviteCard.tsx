import { useState } from 'react'

interface MusicInviteCardProps {
  inviterName: string
  songTitle: string
  songArtist: string
  songCover?: string
  onAccept?: () => void
  onReject?: () => void
  status?: 'pending' | 'accepted' | 'rejected'
}

const MusicInviteCard = ({
  inviterName,
  songTitle,
  songArtist,
  songCover,
  onAccept,
  onReject,
  status = 'pending'
}: MusicInviteCardProps) => {
  const [currentStatus, setCurrentStatus] = useState(status)

  const handleAccept = () => {
    setCurrentStatus('accepted')
    onAccept?.()
  }

  const handleReject = () => {
    setCurrentStatus('rejected')
    onReject?.()
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-lg overflow-hidden max-w-[280px] border border-white/20">
      {/* 卡片头部 - 液态玻璃效果 */}
      <div className="bg-white/60 backdrop-blur-md px-4 py-3 flex items-center gap-2 border-b border-gray-100/50">
        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
        <span className="text-gray-800 font-medium text-sm">一起听邀请</span>
      </div>

      {/* 卡片内容 */}
      <div className="p-4">
        {/* 邀请信息 */}
        <div className="text-sm text-gray-700 mb-3">
          <span className="font-medium text-gray-900">{inviterName}</span> 邀请你一起听歌
        </div>

        {/* 歌曲信息 */}
        <div className="flex items-center gap-3 mb-4 bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-100/50">
          {/* 封面 */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {songCover ? (
              <img src={songCover} alt={songTitle} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            )}
          </div>

          {/* 歌曲详情 */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{songTitle}</div>
            <div className="text-xs text-gray-500 truncate">{songArtist}</div>
          </div>

          {/* 音乐波纹动画 */}
          <div className="flex items-center gap-0.5">
            <span className="w-0.5 h-3 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 h-4 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            <span className="w-0.5 h-5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
          </div>
        </div>

        {/* 按钮区域 */}
        {currentStatus === 'pending' && (
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              className="flex-1 px-4 py-2 bg-white/50 backdrop-blur-sm text-gray-700 rounded-full text-sm font-medium ios-button hover:bg-white/70 transition-all border border-gray-200/50"
            >
              拒绝
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 px-4 py-2 bg-white backdrop-blur-xl text-gray-900 rounded-full text-sm font-medium ios-button shadow-md hover:shadow-lg transition-all border border-gray-300/50"
            >
              接受
            </button>
          </div>
        )}

        {currentStatus === 'accepted' && (
          <div className="text-center py-2 text-sm text-green-600 font-medium flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            已接受邀请
          </div>
        )}

        {currentStatus === 'rejected' && (
          <div className="text-center py-2 text-sm text-gray-500 font-medium">
            已拒绝
          </div>
        )}
      </div>
    </div>
  )
}

export default MusicInviteCard
