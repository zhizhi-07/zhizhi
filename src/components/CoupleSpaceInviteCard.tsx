import { useState } from 'react'

interface CoupleSpaceInviteCardProps {
  senderName: string
  senderAvatar?: string
  status: 'pending' | 'accepted' | 'rejected'
  onAccept?: () => void
  onReject?: () => void
  isReceived: boolean  // true: 收到的邀请, false: 发出的邀请
}

const CoupleSpaceInviteCard = ({
  senderName,
  senderAvatar,
  status,
  onAccept,
  onReject,
  isReceived
}: CoupleSpaceInviteCardProps) => {
  const [processing, setProcessing] = useState(false)

  const handleAccept = async () => {
    if (processing || !onAccept) return
    setProcessing(true)
    try {
      await onAccept()
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (processing || !onReject) return
    setProcessing(true)
    try {
      await onReject()
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-xs">
      <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-white/30">
        {/* 头部 */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-5">
          <div className="flex items-center space-x-3">
            {/* 头像 */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-400 flex-shrink-0">
              {senderAvatar ? (
                <img src={senderAvatar} alt={senderName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                  {senderName[0]}
                </div>
              )}
            </div>
            
            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate">{senderName}</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {isReceived ? '邀请你加入情侣空间' : '已发送情侣空间邀请'}
              </p>
            </div>
          </div>
        </div>

        {/* 图标区域 */}
        <div className="flex items-center justify-center py-8 bg-white/50">
          <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center shadow-lg border border-white/40">
            <svg className="w-10 h-10 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </div>
        </div>

        {/* 描述 */}
        <div className="px-4 pb-4">
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            {isReceived 
              ? '建立专属情侣空间，共同记录美好时光'
              : '等待对方回应中...'}
          </p>
        </div>

        {/* 按钮区域 */}
        {isReceived && status === 'pending' && (
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <button
              onClick={handleReject}
              disabled={processing}
              className="py-3 rounded-xl glass-card text-gray-700 font-medium shadow-md border border-white/30 hover:scale-[0.98] active:scale-[0.95] transition-all disabled:opacity-50"
            >
              拒绝
            </button>
            <button
              onClick={handleAccept}
              disabled={processing}
              className="py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold shadow-md hover:scale-[0.98] active:scale-[0.95] transition-all disabled:opacity-50"
            >
              {processing ? '处理中...' : '接受'}
            </button>
          </div>
        )}

        {/* 状态显示 */}
        {status !== 'pending' && (
          <div className={`px-4 pb-4 text-center text-sm font-medium ${
            status === 'accepted' ? 'text-green-600' : 'text-gray-500'
          }`}>
            {status === 'accepted' 
              ? isReceived ? '已接受邀请' : '对方已接受'
              : isReceived ? '已拒绝邀请' : '对方已拒绝'}
          </div>
        )}
      </div>
    </div>
  )
}

export default CoupleSpaceInviteCard
