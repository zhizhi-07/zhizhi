// 交易类型
export type TransactionType = 'recharge' | 'red_envelope_send' | 'red_envelope_receive' | 'transfer_send' | 'transfer_receive' | 'intimate_pay'

export interface Transaction {
  id: string
  type: TransactionType
  amount: string
  description: string
  timestamp: number
  characterName?: string // 对方角色名称
}

// 获取余额
export const getBalance = (): number => {
  const savedBalance = localStorage.getItem('wallet_balance')
  return savedBalance ? parseFloat(savedBalance) : 0
}

// 设置余额
export const setBalance = (balance: number): void => {
  localStorage.setItem('wallet_balance', balance.toFixed(2))
}

// 添加交易记录
export const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>): void => {
  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now().toString(),
    timestamp: Date.now()
  }
  
  const savedTransactions = localStorage.getItem('wallet_transactions')
  const transactions: Transaction[] = savedTransactions ? JSON.parse(savedTransactions) : []
  transactions.unshift(newTransaction)
  localStorage.setItem('wallet_transactions', JSON.stringify(transactions))
}

// 获取所有交易记录
export const getTransactions = (): Transaction[] => {
  const savedTransactions = localStorage.getItem('wallet_transactions')
  return savedTransactions ? JSON.parse(savedTransactions) : []
}

// 充值
export const recharge = (amount: number): boolean => {
  if (amount <= 0) return false
  
  const currentBalance = getBalance()
  const newBalance = currentBalance + amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'recharge',
    amount: amount.toFixed(2),
    description: '零钱充值'
  })
  
  return true
}

// 发送红包
export const sendRedEnvelope = (amount: number, characterName: string, blessing: string): boolean => {
  const currentBalance = getBalance()
  
  if (currentBalance < amount) {
    return false // 余额不足
  }
  
  const newBalance = currentBalance - amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'red_envelope_send',
    amount: amount.toFixed(2),
    description: `发出红包 - ${blessing}`,
    characterName
  })
  
  return true
}

// 接收红包
export const receiveRedEnvelope = (amount: number, characterName: string, blessing: string): void => {
  const currentBalance = getBalance()
  const newBalance = currentBalance + amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'red_envelope_receive',
    amount: amount.toFixed(2),
    description: `收到红包 - ${blessing}`,
    characterName
  })
}

// 发送转账
export const sendTransfer = (amount: number, characterName: string, message: string): boolean => {
  const currentBalance = getBalance()
  
  if (currentBalance < amount) {
    return false // 余额不足
  }
  
  const newBalance = currentBalance - amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'transfer_send',
    amount: amount.toFixed(2),
    description: `转账 - ${message}`,
    characterName
  })
  
  return true
}

// 接收转账
export const receiveTransfer = (amount: number, characterName: string, message: string): void => {
  const currentBalance = getBalance()
  const newBalance = currentBalance + amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'transfer_receive',
    amount: amount.toFixed(2),
    description: `收到转账 - ${message}`,
    characterName
  })
}

// 亲密付关系接口
export interface IntimatePayRelation {
  id: string
  characterId: string
  characterName: string
  characterAvatar?: string
  monthlyLimit: number // 每月额度
  usedAmount: number // 本月已用
  createdAt: number
  lastResetMonth: string // 上次重置月份，格式：YYYY-MM
  type: 'user_to_character' | 'character_to_user' // 用户给AI 或 AI给用户
}

// 获取所有亲密付关系
export const getIntimatePayRelations = (): IntimatePayRelation[] => {
  const saved = localStorage.getItem('intimate_pay_relations')
  const relations: IntimatePayRelation[] = saved ? JSON.parse(saved) : []
  
  // 检查并重置每月额度
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  let hasReset = false
  
  const updatedRelations = relations.map(relation => {
    if (relation.lastResetMonth !== currentMonth) {
      hasReset = true
      return {
        ...relation,
        usedAmount: 0,
        lastResetMonth: currentMonth
      }
    }
    return relation
  })
  
  // 如果有重置，保存到 localStorage
  if (hasReset) {
    saveIntimatePayRelations(updatedRelations)
  }
  
  return updatedRelations
}

// 保存亲密付关系
const saveIntimatePayRelations = (relations: IntimatePayRelation[]): void => {
  localStorage.setItem('intimate_pay_relations', JSON.stringify(relations))
}

// 开通亲密付（用户给AI）
export const createIntimatePayRelation = (
  characterId: string,
  characterName: string,
  monthlyLimit: number,
  characterAvatar?: string
): boolean => {
  const relations = getIntimatePayRelations()
  
  // 检查是否已存在
  if (relations.some(r => r.characterId === characterId)) {
    return false
  }
  
  const currentMonth = new Date().toISOString().slice(0, 7)
  const newRelation: IntimatePayRelation = {
    id: Date.now().toString(),
    characterId,
    characterName,
    characterAvatar,
    monthlyLimit,
    usedAmount: 0,
    createdAt: Date.now(),
    lastResetMonth: currentMonth,
    type: 'user_to_character'
  }
  
  relations.push(newRelation)
  saveIntimatePayRelations(relations)
  return true
}

// AI给用户开通亲密付
export const createCharacterIntimatePayRelation = (
  characterId: string,
  characterName: string,
  monthlyLimit: number,
  characterAvatar?: string
): boolean => {
  const relations = getIntimatePayRelations()
  
  // 检查是否已存在该AI给用户的亲密付
  if (relations.some(r => r.characterId === characterId && r.type === 'character_to_user')) {
    return false
  }
  
  const currentMonth = new Date().toISOString().slice(0, 7)
  const newRelation: IntimatePayRelation = {
    id: Date.now().toString(),
    characterId,
    characterName,
    characterAvatar,
    monthlyLimit,
    usedAmount: 0,
    createdAt: Date.now(),
    lastResetMonth: currentMonth,
    type: 'character_to_user'
  }
  
  relations.push(newRelation)
  saveIntimatePayRelations(relations)
  return true
}

// 获取单个亲密付关系（优先返回AI给用户的亲密付）
export const getIntimatePayRelation = (characterId: string): IntimatePayRelation | null => {
  const relations = getIntimatePayRelations()
  // 优先查找AI给用户的亲密付（用于红包、转账等场景）
  const characterToUser = relations.find(r => r.characterId === characterId && r.type === 'character_to_user')
  if (characterToUser) return characterToUser
  
  // 如果没有，返回用户给AI的亲密付
  return relations.find(r => r.characterId === characterId && r.type === 'user_to_character') || null
}

// 使用亲密付消费
export const useIntimatePay = (
  characterId: string,
  amount: number,
  description: string
): boolean => {
  const relations = getIntimatePayRelations()
  const relationIndex = relations.findIndex(r => r.characterId === characterId)
  
  if (relationIndex === -1) {
    return false // 未开通亲密付
  }
  
  const relation = relations[relationIndex]
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  // 重置月份额度
  if (relation.lastResetMonth !== currentMonth) {
    relation.usedAmount = 0
    relation.lastResetMonth = currentMonth
  }
  
  // 检查额度
  if (relation.usedAmount + amount > relation.monthlyLimit) {
    return false // 超出额度
  }
  
  // 扣除余额
  const currentBalance = getBalance()
  if (currentBalance < amount) {
    return false // 余额不足
  }
  
  const newBalance = currentBalance - amount
  setBalance(newBalance)
  
  // 更新已用额度
  relation.usedAmount += amount
  relations[relationIndex] = relation
  saveIntimatePayRelations(relations)
  
  // 添加交易记录
  addTransaction({
    type: 'intimate_pay',
    amount: amount.toFixed(2),
    description: `亲密付消费 - ${description}`,
    characterName: relation.characterName
  })
  
  return true
}

// 修改亲密付额度
export const updateIntimatePayLimit = (characterId: string, newLimit: number): boolean => {
  const relations = getIntimatePayRelations()
  const relationIndex = relations.findIndex(r => r.characterId === characterId)
  
  if (relationIndex === -1) {
    return false
  }
  
  // 只允许修改用户给AI开通的亲密付
  if (relations[relationIndex].type !== 'user_to_character') {
    console.warn('无法修改AI给用户开通的亲密付')
    return false
  }
  
  relations[relationIndex].monthlyLimit = newLimit
  saveIntimatePayRelations(relations)
  return true
}

// 关闭亲密付
export const deleteIntimatePayRelation = (characterId: string): boolean => {
  const relations = getIntimatePayRelations()
  const filtered = relations.filter(r => r.characterId !== characterId)
  
  if (filtered.length === relations.length) {
    return false // 未找到
  }
  
  saveIntimatePayRelations(filtered)
  return true
}

// AI使用用户给的亲密付消费
export const useCharacterIntimatePay = (
  characterId: string,
  amount: number,
  description: string,
  receiverName?: string  // 接收者名字（给谁发的红包/转账）
): boolean => {
  const relations = getIntimatePayRelations()
  const relationIndex = relations.findIndex(
    r => r.characterId === characterId && r.type === 'user_to_character'  // ✅ 改成AI用用户给的额度
  )
  
  if (relationIndex === -1) {
    return false // 未开通亲密付
  }
  
  const relation = relations[relationIndex]
  const currentMonth = new Date().toISOString().slice(0, 7)
  
  // 重置月份额度
  if (relation.lastResetMonth !== currentMonth) {
    relation.usedAmount = 0
    relation.lastResetMonth = currentMonth
  }
  
  // 检查额度
  if (relation.usedAmount + amount > relation.monthlyLimit) {
    return false // 超出额度
  }
  
  // 用户使用AI的钱，不扣除用户余额，也不增加用户余额
  // 只记录AI的额度被使用即可
  
  // 更新已用额度
  relation.usedAmount += amount
  relations[relationIndex] = relation
  saveIntimatePayRelations(relations)
  
  // 添加交易记录
  const transactionDesc = receiverName 
    ? `使用${relation.characterName}的亲密付 - ${description} - 给${receiverName}`
    : `使用${relation.characterName}的亲密付 - ${description}`
  
  addTransaction({
    type: 'intimate_pay',
    amount: amount.toFixed(2),
    description: transactionDesc,
    characterName: relation.characterName
  })
  
  // 记录消费通知，供AI感知
  addIntimatePayNotification(characterId, amount, description, receiverName)
  
  return true
}

// 亲密付消费通知接口
export interface IntimatePayNotification {
  id: string
  characterId: string
  amount: number
  description: string
  receiverName?: string  // 接收者名字（给谁发的）
  timestamp: number
  read: boolean // AI是否已读
}

// 添加亲密付消费通知
const addIntimatePayNotification = (
  characterId: string,
  amount: number,
  description: string,
  receiverName?: string
): void => {
  const notification: IntimatePayNotification = {
    id: Date.now().toString(),
    characterId,
    amount,
    description,
    receiverName,
    timestamp: Date.now(),
    read: false
  }
  
  const saved = localStorage.getItem('intimate_pay_notifications')
  const notifications: IntimatePayNotification[] = saved ? JSON.parse(saved) : []
  notifications.push(notification)
  localStorage.setItem('intimate_pay_notifications', JSON.stringify(notifications))
}

// 获取未读的亲密付消费通知
export const getUnreadIntimatePayNotifications = (characterId: string): IntimatePayNotification[] => {
  const saved = localStorage.getItem('intimate_pay_notifications')
  const notifications: IntimatePayNotification[] = saved ? JSON.parse(saved) : []
  return notifications.filter(n => n.characterId === characterId && !n.read)
}

// 标记通知为已读
export const markIntimatePayNotificationsAsRead = (characterId: string): void => {
  const saved = localStorage.getItem('intimate_pay_notifications')
  const notifications: IntimatePayNotification[] = saved ? JSON.parse(saved) : []
  
  const updated = notifications.map(n => {
    if (n.characterId === characterId && !n.read) {
      return { ...n, read: true }
    }
    return n
  })
  
  localStorage.setItem('intimate_pay_notifications', JSON.stringify(updated))
}
