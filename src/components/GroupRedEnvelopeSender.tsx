import { useState } from 'react'

interface GroupRedEnvelopeSenderProps {
  onClose: () => void
  onSend: (amount: number, count: number, message: string) => void
  maxCount: number // 群成员数量
}

const GroupRedEnvelopeSender = ({ onClose, onSend, maxCount }: GroupRedEnvelopeSenderProps) => {
  const [amount, setAmount] = useState('')
  const [count, setCount] = useState('')
  const [message, setMessage] = useState('恭喜发财，大吉大利')

  const handleSend = () => {
    const amountNum = parseFloat(amount)
    const countNum = parseInt(count)

    if (!amountNum || amountNum <= 0) {
      alert('请输入有效的金额')
      return
    }

    if (!countNum || countNum <= 0) {
      alert('请输入有效的红包个数')
      return
    }

    if (countNum > maxCount) {
      alert(`红包个数不能超过群成员数量（${maxCount}个）`)
      return
    }

    if (amountNum < countNum * 0.01) {
      alert('红包金额太小，每个红包至少0.01元')
      return
    }

    onSend(amountNum, countNum, message)
    onClose()
  }

  const avgAmount = amount && count ? (parseFloat(amount) / parseInt(count)).toFixed(2) : '0.00'

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* 发红包面板 */}
      <div className="fixed inset-x-0 bottom-0 z-50 glass-card rounded-t-3xl p-6 animate-slide-up">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">发群红包</h2>

          {/* 总金额 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">总金额</label>
            <div className="flex items-center glass-card rounded-xl p-4">
              <span className="text-2xl font-bold text-red-600 mr-2">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="flex-1 text-2xl font-bold text-gray-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* 红包个数 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">红包个数</label>
            <div className="flex items-center glass-card rounded-xl p-4">
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="0"
                min="1"
                max={maxCount}
                className="flex-1 text-lg font-medium text-gray-900 bg-transparent focus:outline-none"
              />
              <span className="text-sm text-gray-500 ml-2">个（最多{maxCount}个）</span>
            </div>
          </div>

          {/* 祝福语 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">祝福语</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="恭喜发财，大吉大利"
              maxLength={20}
              className="w-full glass-card rounded-xl p-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* 预览 */}
          {amount && count && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl">
              <p className="text-sm text-gray-600">
                平均每个红包 <span className="text-red-600 font-semibold">¥{avgAmount}</span>
              </p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium ios-button"
            >
              取消
            </button>
            <button
              onClick={handleSend}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium ios-button"
            >
              塞钱进红包
            </button>
          </div>
        </div>

        {/* iOS Home Indicator */}
        <div className="flex justify-center pt-4">
          <div className="w-32 h-1 bg-gray-900 rounded-full opacity-30"></div>
        </div>
      </div>
    </>
  )
}

export default GroupRedEnvelopeSender
