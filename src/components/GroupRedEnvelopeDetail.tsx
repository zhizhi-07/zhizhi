import { GroupRedEnvelope } from '../context/GroupRedEnvelopeContext'
import { findLuckiestUser } from '../utils/groupRedEnvelopeAlgorithm'

interface GroupRedEnvelopeDetailProps {
  redEnvelope: GroupRedEnvelope
  onClose: () => void
}

const GroupRedEnvelopeDetail = ({ redEnvelope, onClose }: GroupRedEnvelopeDetailProps) => {
  const receivedList = Object.entries(redEnvelope.received).map(([userId, data]) => ({
    userId,
    ...data
  })).sort((a, b) => b.amount - a.amount) // 按金额降序

  const luckiestUserId = redEnvelope.status === 'finished' ? findLuckiestUser(redEnvelope.received) : null
  const receivedCount = receivedList.length
  const totalReceived = receivedList.reduce((sum, item) => sum + item.amount, 0)

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* 详情面板 */}
      <div className="fixed inset-x-0 bottom-0 z-50 glass-card rounded-t-3xl animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{redEnvelope.senderName}的红包</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 ios-button"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mb-2">{redEnvelope.message}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              已领取 {receivedCount}/{redEnvelope.count} 个
            </span>
            <span className="text-gray-500">
              共 ¥{redEnvelope.amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 领取列表 */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
          {receivedList.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400">还没有人领取</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedList.map((item) => {
                const isLuckiest = luckiestUserId === item.userId
                const isCustomAvatar = item.userAvatar && item.userAvatar.startsWith('data:image')

                return (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between p-4 glass-card rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* 头像 */}
                      <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                        {isCustomAvatar ? (
                          <img src={item.userAvatar} alt={item.userName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{item.userAvatar || '👤'}</span>
                        )}
                      </div>

                      {/* 信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{item.userName}</span>
                          {isLuckiest && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-md whitespace-nowrap flex items-center gap-1">
                              👑 手气最佳
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(item.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* 金额 */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-red-600">¥{item.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部统计 */}
        {receivedList.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">已领取总额</span>
              <span className="text-lg font-bold text-red-600">¥{totalReceived.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* iOS Home Indicator */}
        <div className="flex justify-center py-3">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-30"></div>
        </div>
      </div>
    </>
  )
}

export default GroupRedEnvelopeDetail
