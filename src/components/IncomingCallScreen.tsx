interface IncomingCallScreenProps {
  show: boolean
  character: {
    name: string
    avatar?: string
  }
  isVideoCall: boolean
  onAccept: () => void
  onReject: () => void
}

const IncomingCallScreen = ({ show, character, isVideoCall, onAccept, onReject }: IncomingCallScreenProps) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-between py-12">
      {/* 顶部：通话类型 */}
      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm mb-2">
          {isVideoCall ? '视频通话' : '语音通话'}
        </p>
        <h2 className="text-2xl font-semibold text-gray-900">{character.name}</h2>
      </div>

      {/* 中间：头像 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          {/* 呼吸动画圆圈 */}
          <div className="absolute inset-0 rounded-full bg-green-500 opacity-30 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-pulse"></div>
          
          {/* 头像 */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shadow-2xl border-4 border-white">
            {character.avatar ? (
              character.avatar.startsWith('data:image') || character.avatar.startsWith('http') ? (
                <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">{character.avatar}</span>
              )
            ) : (
              <span className="text-gray-700 text-4xl font-semibold">{character.name.charAt(0)}</span>
            )}
          </div>
        </div>
      </div>

      {/* 底部：按钮 */}
      <div className="w-full px-8 pb-8">
        <div className="flex justify-center items-center gap-20">
          {/* 挂断按钮 */}
          <button
            onClick={onReject}
            className="flex flex-col items-center gap-3 ios-button"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl hover:bg-red-600 transition-all">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M12,9C10.4,9,8.85,9.25,7.4,9.72v2.09C7.4,12.46,6.86,13,6.21,13H3.78c-0.65,0-1.18-0.54-1.18-1.18v-1.09 C2.6,5.88,6.88,1.6,11.73,1.6h0.55c4.85,0,9.13,4.28,9.13,9.13v1.09c0,0.65-0.54,1.18-1.18,1.18h-2.43 c-0.65,0-1.18-0.54-1.18-1.18V9.72C15.15,9.25,13.6,9,12,9z"/>
              </svg>
            </div>
            <span className="text-sm text-gray-700 font-medium">挂断</span>
          </button>

          {/* 接听按钮 */}
          <button
            onClick={onAccept}
            className="flex flex-col items-center gap-3 ios-button"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-2xl hover:bg-green-600 transition-all">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
              </svg>
            </div>
            <span className="text-sm text-gray-700 font-medium">接听</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default IncomingCallScreen
