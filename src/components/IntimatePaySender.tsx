import { useState, useEffect } from 'react'
import intimatePayIcon from '../assets/intimate-pay-icon.png'
import { getBalance } from '../utils/walletUtils'

interface IntimatePaySenderProps {
  onSend: (monthlyLimit: number) => void
  onCancel: () => void
}

const IntimatePaySender = ({ onSend, onCancel }: IntimatePaySenderProps) => {
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [currentBalance, setCurrentBalance] = useState(0)
  
  // 获取当前余额
  useEffect(() => {
    setCurrentBalance(getBalance())
  }, [])

  // 预设额度选项
  const limitOptions = [
    { label: '500元/月', value: 500 },
    { label: '1000元/月', value: 1000 },
    { label: '2000元/月', value: 2000 },
    { label: '3000元/月', value: 3000 },
    { label: '5000元/月', value: 5000 },
    { label: '自定义', value: 0 },
  ]

  const handleSelectLimit = (value: number) => {
    if (value === 0) {
      setShowCustomInput(true)
      setMonthlyLimit('')
    } else {
      setShowCustomInput(false)
      setMonthlyLimit(value.toString())
    }
  }

  const handleSend = () => {
    const limit = parseFloat(monthlyLimit)
    if (isNaN(limit) || limit <= 0) {
      alert('请输入有效的月额度')
      return
    }
    
    // 检查余额是否足够（余额必须大于等于设置的月额度）
    if (currentBalance < limit) {
      alert(`余额不足，无法开通亲密付\n\n当前余额：￥${currentBalance.toFixed(2)}\n设置额度：￥${limit.toFixed(2)}\n\n你的余额不足以支持此额度，请先充值或降低月额度`)
      return
    }
    
    onSend(limit)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onCancel}>
      <div 
        className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">开通亲密付</h2>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 说明 */}
        <div className="bg-pink-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              <img src={intimatePayIcon} alt="亲密付" className="w-full h-full object-cover" />
            </div>
            <span className="text-sm font-medium text-pink-600">什么是亲密付？</span>
          </div>
          <p className="text-xs text-pink-600 leading-relaxed mb-3">
            为对方开通后，TA每月可使用你的零钱进行消费，你可以随时查看消费记录
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-pink-200">
            <span className="text-xs text-pink-600">当前零钱余额</span>
            <span className={`text-sm font-semibold ${currentBalance < 500 ? 'text-orange-500' : 'text-pink-600'}`}>
              ¥{currentBalance.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-xs text-pink-600">
            💡 提示：你的余额必须≥月额度才能开通
          </div>
        </div>

        {/* 设置月额度 */}
        <div className="mb-6">
          <h3 className="text-sm text-gray-600 mb-3">设置月额度</h3>
          <div className="grid grid-cols-2 gap-3">
            {limitOptions.map((option) => {
              const isDisabled = option.value > 0 && currentBalance < option.value
              const isSelected = (option.value === 0 && showCustomInput) ||
                                (option.value > 0 && monthlyLimit === option.value.toString())
              
              return (
                <button
                  key={option.label}
                  onClick={() => !isDisabled && handleSelectLimit(option.value)}
                  disabled={isDisabled}
                  className={`py-3 rounded-xl text-[15px] font-medium transition-colors relative ${
                    isDisabled
                      ? 'bg-gray-100 text-gray-400 border-2 border-transparent cursor-not-allowed'
                      : isSelected
                        ? 'bg-pink-50 text-pink-500 border-2 border-pink-500'
                        : 'bg-gray-50 text-gray-700 border-2 border-transparent active:bg-gray-100'
                  }`}
                >
                  {option.label}
                  {isDisabled && (
                    <span className="absolute top-1 right-1 text-xs">🔒</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* 自定义额度输入 */}
          {showCustomInput && (
            <div className="mt-4">
              <div className="flex items-center border-2 border-pink-500 rounded-xl px-4 py-3 bg-white">
                <span className="text-xl text-gray-900 mr-2">¥</span>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  placeholder="请输入月额度"
                  className="flex-1 text-xl outline-none"
                  autoFocus
                />
                <span className="text-sm text-gray-500">/月</span>
              </div>
            </div>
          )}
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!monthlyLimit}
          className={`w-full py-4 rounded-xl text-[16px] font-medium transition-all ${
            monthlyLimit
              ? 'bg-gradient-to-r from-pink-400 to-red-400 text-white active:opacity-80'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          发送亲密付
        </button>
      </div>
    </div>
  )
}

export default IntimatePaySender
