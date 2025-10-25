import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon, AddIcon } from '../components/Icons'
import { useAccounting } from '../context/AccountingContext'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types/accounting'

const Accounting = () => {
  const navigate = useNavigate()
  const { transactions, deleteTransaction, getMonthlyTotal } = useAccounting()
  const { showStatusBar } = useSettings()
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // 获取当月统计
  const monthlyTotal = getMonthlyTotal(selectedMonth.year, selectedMonth.month)
  const balance = monthlyTotal.income - monthlyTotal.expense

  // 过滤当月账单
  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date)
    return date.getFullYear() === selectedMonth.year && date.getMonth() === selectedMonth.month
  })

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }

  // 获取分类信息
  const getCategoryInfo = (category: string, type: 'expense' | 'income') => {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
    return categories.find(c => c.id === category) || { id: 'other', name: category, emoji: '📝' }
  }

  // 按日期分组
  const groupedTransactions = monthTransactions.reduce((groups, transaction) => {
    const date = transaction.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(transaction)
    return groups
  }, {} as Record<string, typeof monthTransactions>)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 flex items-center justify-between border-b border-gray-200/50">
        <button
          onClick={() => navigate('/wechat/discover', { replace: true })}
          className="flex items-center gap-2 text-gray-700 ios-button"
        >
          <BackIcon size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">记账本</h1>
        <button
          onClick={() => navigate('/accounting/chat')}
          className="px-3 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium ios-button"
        >
          AI记账
        </button>
      </div>

      {/* 月份选择器 */}
      <div className="p-4">
        <div className="glass-card rounded-3xl p-6 shadow-xl ios-button">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                const newMonth = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1
                const newYear = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year
                setSelectedMonth({ year: newYear, month: newMonth })
              }}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center ios-button"
            >
              <span className="text-gray-600">←</span>
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {selectedMonth.year}年{selectedMonth.month + 1}月
              </div>
              <div className="text-sm text-gray-500 mt-1">
                收入 ¥{monthlyTotal.income.toFixed(2)} · 支出 ¥{monthlyTotal.expense.toFixed(2)}
              </div>
            </div>
            
            <button
              onClick={() => {
                const newMonth = selectedMonth.month === 11 ? 0 : selectedMonth.month + 1
                const newYear = selectedMonth.month === 11 ? selectedMonth.year + 1 : selectedMonth.year
                setSelectedMonth({ year: newYear, month: newMonth })
              }}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center ios-button"
            >
              <span className="text-gray-600">→</span>
            </button>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              ¥{balance.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">本月结余</div>
          </div>
        </div>
      </div>

      {/* 账单列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-20">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-sm">暂无账单</p>
            <p className="text-xs mt-2 text-gray-300">点击右上角"AI记账"开始记账</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTransactions)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, items]) => (
                <div key={date}>
                  <div className="text-xs text-gray-500 mb-2 px-2">
                    {formatDate(date)}
                  </div>
                  <div className="space-y-2">
                    {items.map((transaction) => {
                      const categoryInfo = getCategoryInfo(transaction.category, transaction.type)
                      return (
                        <div key={transaction.id} className="glass-card rounded-2xl p-4 ios-button">
                          <div className="flex items-center">
                            <div className="w-12 h-12 flex items-center justify-center">
                              {categoryInfo.icon ? (
                                <img src={categoryInfo.icon} alt={categoryInfo.name} className="w-full h-full object-contain" />
                              ) : (
                                <div className="text-2xl">{categoryInfo.emoji}</div>
                              )}
                            </div>
                            <div className="flex-1 ml-3">
                              <div className="font-medium text-gray-900">
                                {categoryInfo.name}
                              </div>
                              {transaction.description && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {transaction.description}
                                </div>
                              )}
                            </div>
                            <div className={`text-lg font-semibold ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 底部快捷记账按钮 */}
      <div className="fixed bottom-20 right-6 z-10">
        <button
          onClick={() => navigate('/accounting/add')}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-2xl flex items-center justify-center ios-button hover:scale-110 transition-transform"
        >
          <AddIcon size={28} />
        </button>
      </div>
    </div>
  )
}

export default Accounting
