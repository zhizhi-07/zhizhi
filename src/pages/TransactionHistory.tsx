import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BackIcon } from '../components/Icons'
import { getTransactions, Transaction } from '../utils/walletUtils'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'

const TransactionHistory = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // 处理返回
  const handleBack = () => {
    console.log('点击返回按钮')
    console.log('历史记录长度:', window.history.length)
    // 直接返回到零钱页面
    navigate('/wallet')
  }

  // 从localStorage加载交易记录
  useEffect(() => {
    setTransactions(getTransactions())
  }, [])

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (transactionDate.getTime() === today.getTime()) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#EDEDED]">
      {/* iOS状态栏 */}
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white flex items-center border-b border-gray-200">
        <button 
          onClick={handleBack}
          className="px-4 py-4 active:opacity-50 cursor-pointer flex items-center justify-center"
        >
          <BackIcon size={24} className="text-gray-900" />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-medium text-gray-900 pr-14">交易记录</h1>
      </div>

      {/* 交易列表 */}
      <div className="flex-1 overflow-y-auto">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-gray-400 text-sm">暂无交易记录</div>
          </div>
        ) : (
          <div className="bg-white mt-3">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === 'recharge' || transaction.type === 'red_envelope_receive' || transaction.type === 'transfer_receive'
              const isIntimatePay = transaction.type === 'intimate_pay'
              return (
                <div key={transaction.id} className="px-4 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1">
                      <div className="text-[16px] text-gray-900">{transaction.description}</div>
                      {transaction.characterName && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {transaction.characterName}
                          {isIntimatePay && <span className="ml-2 text-pink-500">亲密付</span>}
                        </div>
                      )}
                    </div>
                    <span className={`text-[18px] font-medium ${
                      isIncome ? 'text-[#07C160]' : 'text-gray-900'
                    }`}>
                      {isIncome ? '+' : '-'}¥{transaction.amount}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(transaction.timestamp)}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TransactionHistory
