// 火花时刻记录系统

export interface SparkMoment {
  id: string
  contactId: string
  contactName: string
  contactAvatar: string
  content: string
  intensity: number // 0-100
  timestamp: number
  category: 'chat' | 'moments' | 'call' | 'gift'
}

/**
 * 记录火花时刻
 */
export function recordSparkMoment(
  contactId: string,
  contactName: string,
  contactAvatar: string,
  content: string,
  intensity: number,
  category: 'chat' | 'moments' | 'call' | 'gift' = 'chat'
): void {
  try {
    const moments = getSparkMoments()
    
    const newMoment: SparkMoment = {
      id: `spark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contactId,
      contactName,
      contactAvatar,
      content,
      intensity: Math.max(0, Math.min(100, intensity)), // 限制在0-100之间
      timestamp: Date.now(),
      category
    }

    moments.push(newMoment)
    
    // 只保留最近500条记录
    const recentMoments = moments
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 500)
    
    localStorage.setItem('spark_moments', JSON.stringify(recentMoments))
    
    console.log(`✨ 记录火花时刻: ${contactName} - 强度${intensity}`)
  } catch (error) {
    console.error('记录火花时刻失败:', error)
  }
}

/**
 * 获取所有火花时刻
 */
export function getSparkMoments(): SparkMoment[] {
  try {
    const saved = localStorage.getItem('spark_moments')
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('读取火花时刻失败:', error)
  }
  return []
}

/**
 * 获取指定联系人的火花时刻
 */
export function getContactSparkMoments(contactId: string): SparkMoment[] {
  const moments = getSparkMoments()
  return moments.filter(m => m.contactId === contactId)
}

/**
 * 分析消息内容，计算火花强度
 */
export function analyzeSparkIntensity(message: string, aiResponse: string): number {
  let intensity = 0

  // 关键词检测
  const positiveKeywords = [
    '喜欢', '爱', '想你', '开心', '快乐', '幸福', '甜蜜', '温暖',
    '心动', '感动', '美好', '浪漫', '亲爱', '宝贝', '么么哒',
    '抱抱', '亲亲', '想念', '期待', '激动', '兴奋', '惊喜'
  ]

  const emotionalSymbols = ['❤️', '💕', '💖', '💗', '💓', '💞', '💝', '😘', '😍', '🥰', '😊', '😄']

  // 检测用户消息
  positiveKeywords.forEach(keyword => {
    if (message.includes(keyword)) intensity += 10
  })

  emotionalSymbols.forEach(symbol => {
    if (message.includes(symbol)) intensity += 5
  })

  // 检测AI回复
  positiveKeywords.forEach(keyword => {
    if (aiResponse.includes(keyword)) intensity += 8
  })

  emotionalSymbols.forEach(symbol => {
    if (aiResponse.includes(symbol)) intensity += 4
  })

  // 消息长度加分（表示投入程度）
  if (message.length > 50) intensity += 5
  if (aiResponse.length > 100) intensity += 5

  // 问号和感叹号（表示情绪强度）
  const exclamationCount = (message.match(/[!！]/g) || []).length
  const questionCount = (message.match(/[?？]/g) || []).length
  intensity += Math.min(exclamationCount * 3, 15)
  intensity += Math.min(questionCount * 2, 10)

  return Math.min(intensity, 100)
}

/**
 * 记录聊天中的火花时刻（自动分析）
 */
export function recordChatSpark(
  contactId: string,
  contactName: string,
  contactAvatar: string,
  userMessage: string,
  aiResponse: string
): void {
  const intensity = analyzeSparkIntensity(userMessage, aiResponse)
  
  // 只记录强度大于30的时刻
  if (intensity >= 30) {
    const content = `${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}`
    recordSparkMoment(contactId, contactName, contactAvatar, content, intensity, 'chat')
  }
}

/**
 * 删除火花时刻
 */
export function deleteSparkMoment(id: string): void {
  try {
    const moments = getSparkMoments()
    const filtered = moments.filter(m => m.id !== id)
    localStorage.setItem('spark_moments', JSON.stringify(filtered))
  } catch (error) {
    console.error('删除火花时刻失败:', error)
  }
}

/**
 * 清空所有火花时刻
 */
export function clearAllSparkMoments(): void {
  try {
    localStorage.removeItem('spark_moments')
  } catch (error) {
    console.error('清空火花时刻失败:', error)
  }
}
