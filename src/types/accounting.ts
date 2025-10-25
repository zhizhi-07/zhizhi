// 账单类型
export interface Transaction {
  id: string
  type: 'expense' | 'income' // 支出或收入
  category: string // 分类（如：餐饮、交通、购物等）
  amount: number // 金额
  description: string // 描述
  date: string // 日期
  createdAt: string // 创建时间
  aiExtracted?: boolean // 是否由AI提取
}

// 导入图标
import foodIcon from '../assets/accounting-icons/餐饮.webp'
import transportIcon from '../assets/accounting-icons/交通.webp'
import shoppingIcon from '../assets/accounting-icons/购物.webp'
import entertainmentIcon from '../assets/accounting-icons/娱乐.webp'
import healthIcon from '../assets/accounting-icons/医疗.webp'
import educationIcon from '../assets/accounting-icons/教育.webp'
import housingIcon from '../assets/accounting-icons/住宅.webp'
import utilitiesIcon from '../assets/accounting-icons/水电.webp'
import otherIcon from '../assets/accounting-icons/其他.webp'

// 分类类型
export interface Category {
  id: string
  name: string
  emoji: string
  icon?: string
}

// 账单分类
export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: '餐饮', emoji: '🍔', icon: foodIcon },
  { id: 'transport', name: '交通', emoji: '🚗', icon: transportIcon },
  { id: 'shopping', name: '购物', emoji: '🛍️', icon: shoppingIcon },
  { id: 'entertainment', name: '娱乐', emoji: '🎮', icon: entertainmentIcon },
  { id: 'health', name: '医疗', emoji: '💊', icon: healthIcon },
  { id: 'education', name: '教育', emoji: '📚', icon: educationIcon },
  { id: 'housing', name: '住房', emoji: '🏠', icon: housingIcon },
  { id: 'utilities', name: '水电', emoji: '💡', icon: utilitiesIcon },
  { id: 'other', name: '其他', emoji: '📝', icon: otherIcon },
]

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: '工资', emoji: '💰' },
  { id: 'bonus', name: '奖金', emoji: '🎁' },
  { id: 'investment', name: '投资', emoji: '📈' },
  { id: 'other', name: '其他', emoji: '💵' },
]
