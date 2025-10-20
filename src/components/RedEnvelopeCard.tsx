import { RedEnvelope, isRedEnvelopeExpired } from '../context/RedEnvelopeContext'

interface RedEnvelopeCardProps {
  redEnvelope: RedEnvelope
  onClick: () => void
}

const RedEnvelopeCard = ({ redEnvelope, onClick }: RedEnvelopeCardProps) => {
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
      className={`red-packet ${cssClass}`}
      onClick={onClick}
      data-red-envelope-id={redEnvelope.id}
    >
      <div className="red-packet-content">
        <div className="red-packet-blessing">{redEnvelope.blessing}</div>
      </div>
      <div className="red-packet-icon">领</div>
      {statusTag}
    </div>
  )
}

export default RedEnvelopeCard
