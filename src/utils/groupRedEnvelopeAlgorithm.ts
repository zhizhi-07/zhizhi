// 群红包算法 - 拼手气红包（二倍均值法）

/**
 * 生成随机红包金额数组
 * @param totalAmount 总金额（元）
 * @param count 红包个数
 * @returns 红包金额数组
 */
export function generateRandomPackets(totalAmount: number, count: number): number[] {
  if (count <= 0 || totalAmount <= 0) {
    return []
  }

  const packets: number[] = []
  let remaining = totalAmount * 100 // 转换为分，避免浮点数精度问题

  for (let i = 0; i < count - 1; i++) {
    // 随机金额范围：(0.01元, 剩余金额平均值 * 2]
    const max = (remaining / (count - i)) * 2
    const randomAmount = Math.random() * max
    const amount = Math.max(1, Math.floor(randomAmount)) // 最少1分
    
    packets.push(amount)
    remaining -= amount
  }

  // 最后一个红包是剩余金额
  packets.push(Math.max(1, remaining))

  // 转换回元，保留两位小数
  const finalPackets = packets.map(p => Math.round(p) / 100)

  // 打乱顺序
  return finalPackets.sort(() => Math.random() - 0.5)
}

/**
 * 找出手气最佳（金额最大的）
 * @param received 已领取记录
 * @returns 手气最佳的用户ID
 */
export function findLuckiestUser(received: Record<string, { amount: number; timestamp: number }>): string | null {
  let maxAmount = 0
  let luckiestUserId: string | null = null

  Object.entries(received).forEach(([userId, data]) => {
    if (data.amount > maxAmount) {
      maxAmount = data.amount
      luckiestUserId = userId
    }
  })

  return luckiestUserId
}

/**
 * 检查红包是否已抢完
 * @param packets 红包数组
 * @param receivedCount 已领取数量
 * @returns 是否已抢完
 */
export function isRedEnvelopeFinished(packets: number[], receivedCount: number): boolean {
  return receivedCount >= packets.length
}

/**
 * 检查红包是否过期（24小时）
 * @param timestamp 红包创建时间戳
 * @returns 是否过期
 */
export function isRedEnvelopeExpired(timestamp: number): boolean {
  const now = Date.now()
  const expireTime = 24 * 60 * 60 * 1000 // 24小时
  return now - timestamp > expireTime
}
