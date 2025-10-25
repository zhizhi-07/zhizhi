import { useState, useEffect } from 'react'
import { getIntimatePayRelations, getBalance } from '../utils/walletUtils'

interface TransferSenderProps {
  show: boolean
  onClose: () => void
  onSend: (amount: number, message: string, useIntimatePay?: boolean, intimatePayCharacterId?: string) => void
  characterId?: string
  characterName?: string
}

const TransferSender = ({ show, onClose, onSend, characterId, characterName: _characterName }: TransferSenderProps) => {
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [useIntimatePay, setUseIntimatePay] = useState(false)
  const [availableIntimatePayList, setAvailableIntimatePayList] = useState<Array<{id: string, name: string, remaining: number}>>([])
  const [selectedIntimatePayId, setSelectedIntimatePayId] = useState<string>('')
  
  // 每次打开弹窗时重置表单
  useEffect(() => {
    if (show) {
      setAmount('')
      setMessage('')
      setUseIntimatePay(false)
    }
  }, [show])
  
  // 检查所有可用的亲密付（AI给用户开通的）
  useEffect(() => {
    if (show) {
      console.log('🔍 [转账] 检查所有可用的亲密付')
      const allRelations = getIntimatePayRelations()
      
      // 过滤出AI给用户开通的亲密付，且额度大于0
      const available = allRelations
        .filter(r => r.type === 'character_to_user')
        .map(r => ({
          id: r.characterId,
          name: r.characterName,
          remaining: r.monthlyLimit - r.usedAmount
        }))
        .filter(r => r.remaining > 0)
      
      console.log('💰 [转账] 可用的亲密付列表:', available)
      setAvailableIntimatePayList(available)
      
      // 如果有可用的亲密付，优先选择当前AI的，否则选择第一个
      if (available.length > 0) {
        // 优先选择当前聊天窗口AI的亲密付
        const currentAiRelation = characterId ? available.find(r => r.id === characterId) : null
        const defaultSelected = currentAiRelation || available[0]
        
        setSelectedIntimatePayId(defaultSelected.id)
        setUseIntimatePay(true)
      } else {
        setUseIntimatePay(false)
        setSelectedIntimatePayId('')
      }
    }
  }, [show])

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
      const selectedRelation = availableIntimatePayList.find(r => r.id === selectedIntimatePayId)
      if (!selectedRelation) {
        alert('请选择要使用的亲密付')
        return
      }
      if (amountNum > selectedRelation.remaining) {
        alert(`${selectedRelation.name}的亲密付剩余额度不足\n剩余：￥${selectedRelation.remaining.toFixed(2)}\n需要：￥${amountNum.toFixed(2)}\n\n您可以取消勾选"使用亲密付"，使用零钱余额支付`)
        return
      }
    } else {
      const balance = getBalance()
      if (amountNum > balance) {
        alert('余额不足，请先充值')
        return
      }
    }
    
    const finalMessage = message.trim()
    onSend(amountNum, finalMessage, useIntimatePay, useIntimatePay ? selectedIntimatePayId : undefined)
    
    // 重置表单
    setAmount('')
    setMessage('')
    setUseIntimatePay(false)
  }

  const handleClose = () => {
    setAmount('')
    setMessage('')
    setUseIntimatePay(false)
    setSelectedIntimatePayId('')
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
              placeholder="添加转账说明（可选）"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={20}
            />
          </div>
          
          {/* 亲密付支付选项 */}
          {availableIntimatePayList.length > 0 && (
            <div className="red-packet-field">
              <label className="flex items-center cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={useIntimatePay}
                  onChange={(e) => setUseIntimatePay(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 font-medium">
                  使用亲密付
                </span>
              </label>
              
              {/* 选择使用哪个AI的亲密付 */}
              {useIntimatePay && (
                <select
                  value={selectedIntimatePayId}
                  onChange={(e) => setSelectedIntimatePayId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                >
                  {availableIntimatePayList.map(relation => (
                    <option key={relation.id} value={relation.id}>
                      {relation.name}的亲密付（剩余￥{relation.remaining.toFixed(2)}）
                    </option>
                  ))}
                </select>
              )}
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
