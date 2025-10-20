import { useState, useEffect } from 'react'
import { getIntimatePayRelation, getBalance } from '../utils/walletUtils'

interface RedEnvelopeSenderProps {
  show: boolean
  onClose: () => void
  onSend: (amount: number, blessing: string, useIntimatePay?: boolean) => void
  characterId?: string
  characterName?: string
}

const RedEnvelopeSender = ({ show, onClose, onSend, characterId, characterName }: RedEnvelopeSenderProps) => {
  const [amount, setAmount] = useState('')
  const [blessing, setBlessing] = useState('恭喜发财，大吉大利')
  const [useIntimatePay, setUseIntimatePay] = useState(false)
  const [intimatePayAvailable, setIntimatePayAvailable] = useState(false)
  const [intimatePayRemaining, setIntimatePayRemaining] = useState(0)
  const MAX_AMOUNT = 200
  
  // 检查是否有可用的亲密付
  useEffect(() => {
    if (show && characterId) {
      console.log('🔍 [红包] 检查亲密付，characterId:', characterId)
      const relation = getIntimatePayRelation(characterId)
      console.log('📋 [红包] 亲密付关系:', relation)
      
      if (!relation) {
        console.log('❌ [红包] 未找到亲密付关系')
        setIntimatePayAvailable(false)
        setUseIntimatePay(false)
        return
      }
      
      if (relation.type !== 'character_to_user') {
        console.log('❌ [红包] 亲密付类型不对，type:', relation.type, '(需要character_to_user)')
        setIntimatePayAvailable(false)
        setUseIntimatePay(false)
        return
      }
      
      const remaining = relation.monthlyLimit - relation.usedAmount
      console.log('💰 [红包] 剩余额度:', remaining, '(月额度:', relation.monthlyLimit, ', 已用:', relation.usedAmount, ')')
      
      if (remaining > 0) {
        console.log('✅ [红包] 亲密付可用！')
        setIntimatePayAvailable(true)
        setIntimatePayRemaining(remaining)
        setUseIntimatePay(true)
      } else {
        console.log('❌ [红包] 亲密付额度已用完')
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
    
    if (amountNum > MAX_AMOUNT) {
      alert(`最多¥${MAX_AMOUNT}元`)
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
    
    const finalBlessing = blessing.trim() || '恭喜发财，大吉大利'
    onSend(amountNum, finalBlessing, useIntimatePay)
    
    // 重置表单
    setAmount('')
    setBlessing('恭喜发财，大吉大利')
    setUseIntimatePay(false)
  }

  const handleClose = () => {
    setAmount('')
    setBlessing('恭喜发财，大吉大利')
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
        <div className="red-packet-header">
          <div className="red-packet-title">发红包</div>
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
            <div className="red-packet-hint">最多¥{MAX_AMOUNT}元</div>
          </div>
          
          <div className="red-packet-field">
            <label className="red-packet-label">祝福语</label>
            <input
              type="text"
              className="red-packet-input"
              placeholder="恭喜发财，大吉大利"
              value={blessing}
              onChange={(e) => setBlessing(e.target.value)}
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
              className="red-packet-btn red-packet-btn-send"
              onClick={handleSend}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RedEnvelopeSender
