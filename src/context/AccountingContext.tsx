import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Transaction } from '../types/accounting'

interface AccountingContextType {
  transactions: Transaction[]
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void
  deleteTransaction: (id: string) => void
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void
  getMonthlyTotal: (year: number, month: number) => { income: number; expense: number }
  getCategoryTotal: (category: string, type: 'expense' | 'income') => number
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined)

export const AccountingProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // 从 localStorage 加载账单
  useEffect(() => {
    const saved = localStorage.getItem('accounting_transactions')
    if (saved) {
      try {
        setTransactions(JSON.parse(saved))
      } catch (error) {
        console.error('加载账单失败:', error)
      }
    }
  }, [])

  // 保存账单到 localStorage
  useEffect(() => {
    localStorage.setItem('accounting_transactions', JSON.stringify(transactions))
  }, [transactions])

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    setTransactions(prev => [newTransaction, ...prev])
  }

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const getMonthlyTotal = (year: number, month: number) => {
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getFullYear() === year && date.getMonth() === month
    })

    return monthTransactions.reduce(
      (acc, t) => {
        if (t.type === 'income') {
          acc.income += t.amount
        } else {
          acc.expense += t.amount
        }
        return acc
      },
      { income: 0, expense: 0 }
    )
  }

  const getCategoryTotal = (category: string, type: 'expense' | 'income') => {
    return transactions
      .filter(t => t.category === category && t.type === type)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  return (
    <AccountingContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        getMonthlyTotal,
        getCategoryTotal,
      }}
    >
      {children}
    </AccountingContext.Provider>
  )
}

export const useAccounting = () => {
  const context = useContext(AccountingContext)
  if (!context) {
    throw new Error('useAccounting must be used within AccountingProvider')
  }
  return context
}
