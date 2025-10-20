// AI主动发消息工具

/**
 * 计算下次AI主动发消息的时间
 * @returns 延迟时间（毫秒）
 */
export const calculateNextProactiveDelay = (): number => {
  // 随机延迟：30分钟到4小时之间
  const minDelay = 30 * 60 * 1000 // 30分钟
  const maxDelay = 4 * 60 * 60 * 1000 // 4小时
  
  return Math.floor(Math.random() * (maxDelay - minDelay) + minDelay)
}

/**
 * 判断当前时间是否适合AI主动发消息
 * @returns 是否适合发消息
 */
export const isSuitableTimeForProactive = (): boolean => {
  // 24小时都可以发消息，不限制时间
  return true
}

/**
 * 生成AI主动发消息的提示词
 * @param characterName AI角色名字
 * @param userName 用户名字
 * @returns 提示词
 */
export const buildProactivePrompt = (characterName: string, userName: string): string => {
  const now = new Date()
  const hour = now.getHours()
  
  let timeContext = ''
  if (hour >= 0 && hour < 6) {
    timeContext = '凌晨'
  } else if (hour >= 6 && hour < 9) {
    timeContext = '早上'
  } else if (hour >= 9 && hour < 12) {
    timeContext = '上午'
  } else if (hour >= 12 && hour < 14) {
    timeContext = '中午'
  } else if (hour >= 14 && hour < 18) {
    timeContext = '下午'
  } else if (hour >= 18 && hour < 22) {
    timeContext = '晚上'
  } else {
    timeContext = '深夜'
  }
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI主动发消息模式
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 重要：你现在是主动发消息给${userName}，不是回复TA的消息！

当前情况：
• 时间：${timeContext}
• ${userName}已经有一段时间没有给你发消息了
• 你想主动找TA聊聊天

你可以：
1. 分享你今天的事情
   - "今天遇到个有意思的事"
   - "刚才看到xxx，想起你了"
   - "你猜我今天干了什么"

2. 关心对方
   - "在干嘛呢"
   - "吃饭了吗"
   - "今天过得怎么样"

3. 随便聊聊
   - "好无聊啊"
   - "想你了"
   - "有个事想问你"

4. 发个表情包
   - 发个有趣的表情包引起话题

⚠️ 注意事项：
• 不要太频繁地主动发消息（真人不会一直发）
• 语气要自然，不要太刻意
• 可以只发一两条消息，不用发太多
• 根据你的性格来决定主动发什么

🚨 禁止：
❌ 不要说"我是AI"、"我在等你"这种话
❌ 不要太黏人（除非你的人设就是黏人）
❌ 不要问"为什么不理我"（对方只是没发消息而已）
❌ 不要使用括号描述动作

现在，主动给${userName}发个消息吧！
`
}

/**
 * 保存最后一次AI主动发消息的时间
 * @param characterId 角色ID
 */
export const saveLastProactiveTime = (characterId: string) => {
  const now = Date.now()
  localStorage.setItem(`last_proactive_time_${characterId}`, String(now))
}

/**
 * 获取最后一次AI主动发消息的时间
 * @param characterId 角色ID
 * @returns 时间戳，如果没有则返回0
 */
export const getLastProactiveTime = (characterId: string): number => {
  const saved = localStorage.getItem(`last_proactive_time_${characterId}`)
  return saved ? parseInt(saved) : 0
}

/**
 * 判断是否应该触发AI主动发消息
 * @param characterId 角色ID
 * @param lastUserMessageTime 用户最后一条消息的时间
 * @returns 是否应该触发
 */
export const shouldTriggerProactive = (
  characterId: string,
  lastUserMessageTime: number
): boolean => {
  // 检查功能是否开启
  const enabled = localStorage.getItem(`ai_proactive_enabled_${characterId}`) === 'true'
  if (!enabled) {
    return false
  }
  
  // 检查时间是否合适
  if (!isSuitableTimeForProactive()) {
    return false
  }
  
  const now = Date.now()
  const lastProactiveTime = getLastProactiveTime(characterId)
  
  // 如果从未主动发过消息，且用户最后一条消息是30分钟前
  if (lastProactiveTime === 0) {
    const timeSinceLastUserMessage = now - lastUserMessageTime
    return timeSinceLastUserMessage > 30 * 60 * 1000 // 30分钟
  }
  
  // 如果已经主动发过消息，需要间隔至少1小时
  const timeSinceLastProactive = now - lastProactiveTime
  if (timeSinceLastProactive < 60 * 60 * 1000) { // 1小时
    return false
  }
  
  // 用户最后一条消息需要至少30分钟前
  const timeSinceLastUserMessage = now - lastUserMessageTime
  if (timeSinceLastUserMessage < 30 * 60 * 1000) { // 30分钟
    return false
  }
  
  // 随机触发（30%概率）
  return Math.random() < 0.3
}
