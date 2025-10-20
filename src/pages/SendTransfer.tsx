import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

const SendTransfer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { characterName, chatId } = location.state || {}

  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入转账金额')
      return
    }

    // 返回聊天页面并传递转账数据
    navigate(`/chat/${chatId}`, {
      state: {
        transfer: {
          amount: parseFloat(amount),
          message: message || '你发起了一笔转账'
        }
      }
    })
  }

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      {/* 顶部标题栏 */}
      <div className="px-4 py-3 flex items-center justify-between bg-white border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-700 text-base"
        >
          取消
        </button>
        <h1 className="text-base font-semibold text-gray-900">
          转账
        </h1>
        <button
          onClick={handleSend}
          disabled={!amount || parseFloat(amount) <= 0}
          className={`text-base font-medium ${
            amount && parseFloat(amount) > 0
              ? 'text-[#576B95]'
              : 'text-gray-300'
          }`}
        >
          转账
        </button>
      </div>

      {/* 转账内容 */}
      <div className="flex-1 flex flex-col">
        {/* 收款人信息 */}
        <div className="bg-white px-5 py-4 mb-2">
          <div className="text-xs text-gray-400 mb-1.5">收款方</div>
          <div className="text-[15px] text-gray-900 font-medium">{characterName}</div>
        </div>

        {/* 金额输入区域 */}
        <div className="bg-white flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full px-8">
              <div className="flex items-baseline justify-center mb-2">
                <span className="text-[40px] font-normal text-gray-900 mr-1">¥</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value
                    // 只允许数字和一个小数点
                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                      setAmount(value)
                    }
                  }}
                  placeholder="0.00"
                  autoFocus
                  className="text-[56px] font-normal text-gray-900 bg-transparent border-none outline-none text-center flex-1 placeholder-gray-300"
                  style={{ 
                    minWidth: '200px',
                    maxWidth: '100%',
                    letterSpacing: '0.02em'
                  }}
                />
              </div>
              <div className="h-[1px] bg-gray-200 mx-auto" style={{ width: '280px' }}></div>
              <div className="text-center mt-4 text-xs text-gray-400">
                单笔转账限额¥200,000.00
              </div>
            </div>
          </div>

          {/* 转账说明 */}
          <div className="px-5 py-4 border-t border-gray-100">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="添加转账说明"
              maxLength={20}
              className="w-full bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-[15px]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SendTransfer

