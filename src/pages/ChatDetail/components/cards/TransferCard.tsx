/**
 * 转账卡片组件
 */

import { Message } from '../../types'

interface TransferCardProps {
  message: Message
  transferCover: string
  transferIcon: string
  onReceive?: () => void
}

const TransferCard = ({
  message,
  transferCover,
  transferIcon,
  onReceive
}: TransferCardProps) => {
  const transfer = message.transfer
  if (!transfer) return null

  const isReceived = message.type === 'received'
  const isPending = transfer.status === 'pending'
  const isExpired = transfer.status === 'expired'

  return (
    <div
      className="relative w-64 h-32 rounded-xl overflow-hidden shadow-lg cursor-pointer"
      style={{
        backgroundImage: `url(${transferCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      onClick={isReceived && isPending ? onReceive : undefined}
    >
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />

      {/* 内容 */}
      <div className="relative h-full flex flex-col justify-between p-4">
        {/* 顶部：转账图标和金额 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <img src={transferIcon} alt="转账" className="w-8 h-8" />
            <span className="text-white text-sm font-medium">转账</span>
          </div>
          <div className="text-white text-2xl font-bold">
            ¥{transfer.amount}
          </div>
        </div>

        {/* 底部：留言和状态 */}
        <div>
          {transfer.message && (
            <div className="text-white/90 text-sm mb-2 line-clamp-1">
              {transfer.message}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-white/80 text-xs">
              {isReceived ? '对方发起的转账' : '你发起的转账'}
            </span>
            {isReceived && (
              <span className={`text-xs px-2 py-1 rounded ${
                isPending
                  ? 'bg-white/20 text-white'
                  : isExpired
                  ? 'bg-gray-500/50 text-white/70'
                  : 'bg-green-500/50 text-white'
              }`}>
                {isPending ? '待收款' : isExpired ? '已过期' : '已收款'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 点击提示（仅待收款时显示） */}
      {isReceived && isPending && (
        <div className="absolute top-2 right-2">
          <div className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
            点击收款
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferCard

