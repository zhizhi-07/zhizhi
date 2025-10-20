import { useState, useEffect } from 'react'
import { getIntimatePayRelation, getBalance } from '../utils/walletUtils'

interface TransferSenderProps {
  show: boolean
  onClose: () => void
  onSend: (amount: number, message: string, useIntimatePay?: boolean) => void
  characterId?: string
  characterName?: string
}

const TransferSender = ({ show, onClose, onSend, characterId, characterName }: TransferSenderProps) => {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [useIntimatePay, setUseIntimatePay] = useState(false)
  const [intimatePayAvailable, setIntimatePayAvailable] = useState(false)
  const [intimatePayRemaining, setIntimatePayRemaining] = useState(0)
  
  // 检查是否有可用的亲密付
  useEffect(() => {
    if (show && characterId) {
      console.log('🔍 [转账] 检查亲密付，characterId:', characterId)
      const relation = getIntimatePayRelation(characterId)
      console.log('📋 [转账] 亲密付关系:', relation)
      if (relation && relation.type === 'character_to_user') {
        const remaining = relation.monthlyLimit - relation.usedAmount
        console.log('💰 [转账] 剩余额度:', remaining)
        setIntimatePayAvailable(remaining > 0)
        setIntimatePayRemaining(remaining)
        setUseIntimatePay(remaining > 0)
      } else {
        console.log('❌ [转账] 没有可用的亲密付')
        setIntimatePayAvailable(false)
        setUseIntimatePay(false)
      }
    }
  }, [show, characterId])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^\d.]/g, '')
    const parts = value.split('.')
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('')
    }
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2)
    }
    setAmount(value)
  }

  const handleSend = () => {
    const amountNum = parseFloat(amount)
    
    if (!amountNum || amountNum <= 0) {
      alert('请输入有效金额')
      return
    }
    
    // 检查余额或亲密付额度
    if (useIntimatePay) {
      if (amountNum > intimatePayRemaining) {
        alert(`亲密付剩余额度不足，剩余￥${intimatePayRemaining.toFixed(2)}`)
        return
      }
    } else {
      const balance = getBalance()
      if (amountNum > balance) {
        alert('余额不足，请先充值')
        return
      }
    }
    
    const finalMessage = message.trim() || '转账'
    onSend(amountNum, finalMessage, useIntimatePay)
    
    // 重置表单
    setAmount('')
    setMessage('')
    setUseIntimatePay(false)
  }

  const handleClose = () => {
    setAmount('')
    setMessage('')
    onClose()
  }

  if (!show) return null

  return (
    <div 
      className={`red-packet-modal ${show ? 'show' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="red-packet-panel">
        <div className="red-packet-header" style={{ background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%)' }}>
          <div className="red-packet-title">转账</div>
        </div>
        
        <div className="red-packet-form">
          <div className="red-packet-field">
            <label className="red-packet-label">金额</label>
            <input
              type="text"
              className="red-packet-input"
              placeholder="请输入金额"
              value={amount}
              onChange={handleAmountChange}
              autoFocus
            />
          </div>
          
          <div className="red-packet-field">
            <label className="red-packet-label">转账说明</label>
            <input
              type="text"
              className="red-packet-input"
              placeholder="转账"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={20}
            />
          </div>
          
          {/* 亲密付支付选项 */}
          {intimatePayAvailable && (
            <div className="red-packet-field">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useIntimatePay}
                  onChange={(e) => setUseIntimatePay(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  使用{characterName || '对方'}的亲密付（剩余￥{intimatePayRemaining.toFixed(2)}）
                </span>
              </label>
            </div>
          )}
          
          <div className="red-packet-buttons">
            <button 
              className="red-packet-btn red-packet-btn-cancel"
              onClick={handleClose}
            >
              取消
            </button>
            <button 
              className="red-packet-btn"
              onClick={handleSend}
              style={{ 
                background: 'linear-gradient(135deg, #FF9500 0%, #FF8000 100%)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(255, 149, 0, 0.35)'
              }}
            >
              转账
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransferSender
