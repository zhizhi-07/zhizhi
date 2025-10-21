import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types/accounting'

// 从消息中提取账单信息
export const extractTransactionFromMessage = (message: string) => {
  // 匹配金额（支持多种格式）
  const amountPatterns = [
    /(\d+\.?\d*)\s*元/,
    /(\d+\.?\d*)\s*块/,
    /(\d+\.?\d*)\s*¥/,
    /¥\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*rmb/i,
    /(\d+\.?\d*)\s*钱/,
  ]

  let amount = 0
  let matchedPattern = null
  
  for (const pattern of amountPatterns) {
    const match = message.match(pattern)
    if (match) {
      amount = parseFloat(match[1])
      matchedPattern = pattern
      break
    }
  }

  if (amount === 0) return null

  // 判断是收入还是支出
  const incomeKeywords = ['赚', '收入', '工资', '奖金', '收到', '进账']
  const isIncome = incomeKeywords.some(keyword => message.includes(keyword))
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense'

  // 匹配分类关键词
  const categoryKeywords: Record<string, string[]> = {
    food: ['吃', '喝', '餐', '饭', '奶茶', '咖啡', '外卖', '零食', '水果', '早餐', '午餐', '晚餐', '宵夜', '烧烤', '火锅', '麻辣烫'],
    transport: ['打车', '出租', '地铁', '公交', '滴滴', '油费', '停车', '车费', '交通'],
    shopping: ['买', '购', '衣服', '鞋', '包', '化妆品', '护肤', '商场', '淘宝', '京东'],
    entertainment: ['电影', '游戏', '唱歌', 'KTV', '娱乐', '玩', '游乐园', '密室'],
    health: ['药', '医院', '看病', '体检', '健身', '医疗'],
    education: ['书', '课程', '培训', '学费', '教育'],
    housing: ['房租', '物业', '租金'],
    utilities: ['水费', '电费', '网费', '话费', '燃气'],
  }

  const incomeCategories: Record<string, string[]> = {
    salary: ['工资', '薪水', '月薪'],
    bonus: ['奖金', '红包', '年终奖'],
    investment: ['投资', '理财', '股票', '基金'],
  }

  let category = 'other'
  let categoryName = '其他'

  if (type === 'expense') {
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        category = cat
        const catInfo = EXPENSE_CATEGORIES.find(c => c.id === cat)
        categoryName = catInfo?.name || '其他'
        break
      }
    }
  } else {
    for (const [cat, keywords] of Object.entries(incomeCategories)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        category = cat
        const catInfo = INCOME_CATEGORIES.find(c => c.id === cat)
        categoryName = catInfo?.name || '其他'
        break
      }
    }
  }

  // 提取描述（去除金额部分）
  let description = message
  if (matchedPattern) {
    description = description.replace(matchedPattern, '').trim()
  }
  
  // 清理描述
  description = description.replace(/^[，。、！？\s]+/, '').replace(/[，。、！？\s]+$/, '')
  
  if (!description) {
    description = `${categoryName}${type === 'income' ? '收入' : '消费'}`
  }

  return {
    type,
    amount,
    category,
    categoryName,
    description,
  }
}

// 生成记账确认消息
export const generateAccountingConfirmation = (transactionInfo: ReturnType<typeof extractTransactionFromMessage>) => {
  if (!transactionInfo) return null

  const categories = transactionInfo.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const categoryInfo = categories.find(c => c.id === transactionInfo.category)
  const emoji = categoryInfo?.emoji || '📝'
  const sign = transactionInfo.type === 'income' ? '+' : '-'

  return {
    emoji,
    categoryName: transactionInfo.categoryName,
    amount: transactionInfo.amount,
    description: transactionInfo.description,
    type: transactionInfo.type,
    sign,
  }
}
