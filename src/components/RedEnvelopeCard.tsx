import { RedEnvelope, isRedEnvelopeExpired } from '../context/RedEnvelopeContext'

interface RedEnvelopeCardProps {
  redEnvelope: RedEnvelope
  onClick: () => void
  coverImage?: string  // 自定义封面图片
  iconImage?: string   // 自定义"领"字图标
}

const RedEnvelopeCard = ({ redEnvelope, onClick, coverImage, iconImage }: RedEnvelopeCardProps) => {
  const expired = isRedEnvelopeExpired(redEnvelope)
  const claimed = redEnvelope.status === 'claimed'
  
  let cssClass = 'red-packet-pending'
  let statusTag = null
  
  if (expired && !claimed) {
    cssClass = 'red-packet-expired'
    statusTag = <div className="red-packet-status">已过期</div>
  } else if (claimed) {
    cssClass = 'red-packet-claimed'
    statusTag = <div className="red-packet-status">已领取</div>
  }
  
  return (
    <div 
      className={`message-bubble red-packet ${cssClass}`}
      onClick={onClick}
      data-red-envelope-id={redEnvelope.id}
      style={{
        backgroundImage: coverImage ? `url(${coverImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'visible'  // 让伪元素可以显示在外面
      }}
    >
      <div className="red-packet-content">
        <div className="red-packet-blessing">{redEnvelope.blessing}</div>
      </div>
      <div 
        className="red-packet-icon"
        style={{
          backgroundImage: iconImage ? `url(${iconImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: iconImage ? 'transparent' : undefined
        }}
      >
        领
      </div>
      {statusTag}
    </div>
  )
}

export default RedEnvelopeCard
