import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackIcon } from '../components/Icons'
import { useAccounting } from '../context/AccountingContext'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types/accounting'

const AddTransaction = () => {
  const navigate = useNavigate()
  const { addTransaction } = useAccounting()
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES

  const handleSubmit = () => {
    if (!amount || !category) {
      alert('请填写金额和分类')
      return
    }

    addTransaction({
      type,
      category,
      amount: parseFloat(amount),
      description,
      date,
    })

    navigate('/accounting', { replace: true })
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect px-4 py-3 flex items-center justify-between border-b border-gray-200/50">
        <button
          onClick={() => navigate('/accounting', { replace: true })}
          className="flex items-center gap-2 text-gray-700 ios-button"
        >
          <BackIcon size={20} />
          <span className="text-base">取消</span>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">记一笔</h1>
        <button
          onClick={handleSubmit}
          disabled={!amount || !category}
          className="px-4 py-1.5 rounded-full bg-green-500 text-white text-sm font-medium ios-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          完成
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        {/* 类型切换 */}
        <div className="glass-card rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => {
              setType('expense')
              setCategory('')
            }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              type === 'expense'
                ? 'bg-red-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            支出
          </button>
          <button
            onClick={() => {
              setType('income')
              setCategory('')
            }}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              type === 'income'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            收入
          </button>
        </div>

        {/* 金额输入 */}
        <div className="glass-card rounded-2xl p-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">金额</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-5xl font-bold text-gray-900 bg-transparent outline-none text-center w-64"
                step="0.01"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* 分类选择 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">选择分类</div>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-4 rounded-xl transition-all ${
                  category === cat.id
                    ? 'glass-card ring-2 ring-blue-400 shadow-lg scale-105'
                    : 'glass-card text-gray-700 hover:scale-105'
                }`}
              >
                {cat.icon ? (
                  <img src={cat.icon} alt={cat.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
                ) : (
                  <div className="text-3xl mb-2">{cat.emoji}</div>
                )}
                <div className="text-xs font-medium">{cat.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 备注 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">备注（可选）</div>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="添加备注..."
            className="w-full px-4 py-3 rounded-xl glass-card outline-none text-sm"
          />
        </div>

        {/* 日期 */}
        <div className="glass-card rounded-2xl p-4">
          <div className="text-sm text-gray-500 mb-3">日期</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl glass-card outline-none text-sm"
          />
        </div>
      </div>
    </div>
  )
}

export default AddTransaction
