import { RedEnvelope, isRedEnvelopeExpired } from '../context/RedEnvelopeContext'

interface RedEnvelopeDetailProps {
  show: boolean
  redEnvelope: RedEnvelope | null
  canClaim: boolean
  onClose: () => void
  onClaim: () => void
}

const RED_ENVELOPE_EXPIRY = 24 * 60 * 60 * 1000

const RedEnvelopeDetail = ({ show, redEnvelope, canClaim, onClose, onClaim }: RedEnvelopeDetailProps) => {
  if (!show || !redEnvelope) return null

  const expired = isRedEnvelopeExpired(redEnvelope)
  const claimed = redEnvelope.status === 'claimed'

  const formatClaimTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatExpireTime = (createdAt: number) => {
    const expireTime = new Date(createdAt + RED_ENVELOPE_EXPIRY)
    return expireTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div 
      className={`red-packet-detail-modal ${show ? 'show' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="red-packet-detail-panel">
        <div className="red-packet-detail-header">
          <button 
            className="red-packet-detail-close"
            onClick={onClose}
          >
            ×
          </button>
          <div className="red-packet-detail-icon">🧧</div>
          <div className="red-packet-detail-blessing">{redEnvelope.blessing}</div>
          <div className="red-packet-detail-status">
            {claimed ? '已领取' : expired ? '已过期' : '等待领取'}
          </div>
        </div>
        
        <div className="red-packet-detail-body">
          <div className="red-packet-detail-amount">
            {claimed ? (
              <span className="amount-value">¥{redEnvelope.amount.toFixed(2)}</span>
            ) : expired ? (
              <span className="amount-value expired">已过期</span>
            ) : (
              <span className="amount-hidden">未领取</span>
            )}
          </div>
          
          {claimed && redEnvelope.claimedBy && redEnvelope.claimedAt && (
            <div className="red-packet-detail-claimer">
              <div className="claimer-info">
                <div className="claimer-name">{redEnvelope.claimedBy}</div>
                <div className="claim-time">{formatClaimTime(redEnvelope.claimedAt)}</div>
              </div>
            </div>
          )}
          
          <div className="red-packet-detail-time">
            有效期至 {formatExpireTime(redEnvelope.createdAt)}
          </div>
          
          {canClaim && (
            <button 
              className="red-packet-claim-btn"
              onClick={onClaim}
            >
              开红包
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RedEnvelopeDetail
