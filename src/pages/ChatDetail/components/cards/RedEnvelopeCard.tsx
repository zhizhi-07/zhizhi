/**
 * 红包卡片组件
 */

interface RedEnvelopeCardProps {
  redEnvelopeCover: string
  redEnvelopeIcon: string
  onClick?: () => void
}

const RedEnvelopeCard = ({
  redEnvelopeCover,
  redEnvelopeIcon,
  onClick
}: RedEnvelopeCardProps) => {
  return (
    <div
      className="relative w-64 h-32 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform"
      style={{
        backgroundImage: `url(${redEnvelopeCover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
      onClick={onClick}
    >
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-red-800/40" />

      {/* 内容 */}
      <div className="relative h-full flex flex-col justify-between p-4">
        {/* 顶部：红包图标 */}
        <div className="flex items-center gap-2">
          <img src={redEnvelopeIcon} alt="红包" className="w-10 h-10" />
          <span className="text-white text-base font-medium">恭喜发财，大吉大利</span>
        </div>

        {/* 底部：提示文字 */}
        <div className="text-white/90 text-sm">
          点击领取红包
        </div>
      </div>

      {/* 金币装饰 */}
      <div className="absolute top-2 right-2 text-yellow-300 text-2xl animate-bounce">
        💰
      </div>
    </div>
  )
}

export default RedEnvelopeCard

