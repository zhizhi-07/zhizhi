/**
 * 🔥 续火花系统
 * 记录和管理连续聊天天数
 */

export interface StreakData {
  characterId: string
  currentStreak: number // 当前连续天数
  longestStreak: number // 历史最长记录
  lastChatDate: string // 最后聊天日期 (YYYY-MM-DD)
  totalDays: number // 总聊天天数
  breakCount: number // 断火次数
  milestones: number[] // 已达成的里程碑
  hasUsedRevive: boolean // 本月是否使用过续火卡
  reviveResetDate: string // 续火卡重置日期
}

// 里程碑定义
export const MILESTONES = [
  { days: 1, name: '初识', emoji: '👋' },
  { days: 3, name: '相识', emoji: '😊' },
  { days: 7, name: '熟悉', emoji: '🤝' },
  { days: 14, name: '知心', emoji: '💕' },
  { days: 30, name: '挚友', emoji: '❤️' },
  { days: 50, name: '密友', emoji: '💖' },
  { days: 100, name: '灵魂伴侣', emoji: '💗' },
  { days: 365, name: '命中注定', emoji: '💍' }
]

/**
 * 获取今天的日期字符串 (YYYY-MM-DD)
 */
function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

/**
 * 获取本月第一天的日期字符串
 */
function getMonthStartString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
}

/**
 * 计算两个日期之间的天数差
 */
function getDaysDiff(date1: string, date2: string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 获取火花数据
 */
export function getStreakData(characterId: string): StreakData {
  const key = `streak_${characterId}`
  const saved = localStorage.getItem(key)
  
  if (saved) {
    return JSON.parse(saved)
  }
  
  // 默认数据
  return {
    characterId,
    currentStreak: 0,
    longestStreak: 0,
    lastChatDate: '',
    totalDays: 0,
    breakCount: 0,
    milestones: [],
    hasUsedRevive: false,
    reviveResetDate: getMonthStartString()
  }
}

/**
 * 保存火花数据
 */
export function saveStreakData(data: StreakData): void {
  const key = `streak_${data.characterId}`
  localStorage.setItem(key, JSON.stringify(data))
}

/**
 * 更新火花（每次发送消息时调用）
 */
export function updateStreak(characterId: string): StreakData {
  const data = getStreakData(characterId)
  const today = getTodayString()
  
  // 如果今天已经聊过了，不更新
  if (data.lastChatDate === today) {
    return data
  }
  
  // 检查续火卡是否需要重置
  const monthStart = getMonthStartString()
  if (data.reviveResetDate !== monthStart) {
    data.hasUsedRevive = false
    data.reviveResetDate = monthStart
  }
  
  // 如果是第一次聊天
  if (!data.lastChatDate) {
    data.currentStreak = 1
    data.longestStreak = 1
    data.totalDays = 1
    data.lastChatDate = today
    data.milestones = [1]
    saveStreakData(data)
    return data
  }
  
  // 计算距离上次聊天的天数
  const daysSinceLastChat = getDaysDiff(data.lastChatDate, today)
  
  if (daysSinceLastChat === 1) {
    // 连续聊天，火花+1
    data.currentStreak += 1
    data.totalDays += 1
    
    // 更新最长记录
    if (data.currentStreak > data.longestStreak) {
      data.longestStreak = data.currentStreak
    }
    
    // 检查是否达成新里程碑
    if (!data.milestones.includes(data.currentStreak)) {
      data.milestones.push(data.currentStreak)
      data.milestones.sort((a, b) => a - b)
    }
    
  } else if (daysSinceLastChat > 1) {
    // 断火了
    data.breakCount += 1
    data.currentStreak = 1
    data.totalDays += 1
  }
  
  data.lastChatDate = today
  saveStreakData(data)
  
  return data
}

/**
 * 使用续火卡
 */
export function useReviveCard(characterId: string): boolean {
  const data = getStreakData(characterId)
  
  // 检查是否已经使用过
  if (data.hasUsedRevive) {
    return false
  }
  
  // 检查是否真的断火了
  const today = getTodayString()
  const daysSinceLastChat = getDaysDiff(data.lastChatDate, today)
  
  if (daysSinceLastChat <= 1) {
    return false // 没有断火，不需要续火
  }
  
  // 使用续火卡
  data.hasUsedRevive = true
  data.lastChatDate = today
  data.currentStreak += 1
  data.totalDays += 1
  
  saveStreakData(data)
  return true
}

/**
 * 获取当前等级
 */
export function getCurrentLevel(streak: number): { name: string; emoji: string; days: number } {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (streak >= MILESTONES[i].days) {
      return MILESTONES[i]
    }
  }
  return MILESTONES[0]
}

/**
 * 获取下一个里程碑
 */
export function getNextMilestone(streak: number): { name: string; emoji: string; days: number } | null {
  for (const milestone of MILESTONES) {
    if (streak < milestone.days) {
      return milestone
    }
  }
  return null
}

/**
 * 检查是否需要提醒（今天还没聊天）
 */
export function shouldRemind(characterId: string): boolean {
  const data = getStreakData(characterId)
  const today = getTodayString()
  
  // 如果今天已经聊过了，不需要提醒
  if (data.lastChatDate === today) {
    return false
  }
  
  // 如果有连续记录，需要提醒
  return data.currentStreak > 0
}

/**
 * 获取聊天率
 */
export function getChatRate(characterId: string): number {
  const data = getStreakData(characterId)
  
  if (!data.lastChatDate) {
    return 0
  }
  
  // 计算从第一次聊天到现在的总天数
  const firstChatDate = data.lastChatDate // 简化处理，实际应该记录第一次聊天日期
  const today = getTodayString()
  const totalPossibleDays = getDaysDiff(firstChatDate, today) + 1
  
  if (totalPossibleDays === 0) {
    return 0
  }
  
  return Math.round((data.totalDays / totalPossibleDays) * 100)
}
