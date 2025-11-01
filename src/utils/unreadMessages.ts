/**
 * 未读消息管理系统
 * 跟踪每个聊天的未读消息数量（支持单聊和群聊）
 */

interface UnreadData {
  chatId: string  // 单聊使用characterId，群聊使用groupId
  count: number
  lastUpdate: number
  type?: 'single' | 'group'  // 聊天类型
}

const STORAGE_KEY = 'unread_messages'

/**
 * 获取未读消息数据
 */
function getUnreadData(): Map<string, UnreadData> {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return new Map()
  
  try {
    const entries = JSON.parse(saved) as Array<[string, UnreadData]>
    return new Map(entries)
  } catch (e) {
    console.error('读取未读消息数据失败:', e)
    return new Map()
  }
}

/**
 * 保存未读消息数据
 */
function saveUnreadData(data: Map<string, UnreadData>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(data.entries())))
}

/**
 * 增加未读消息数
 * @param chatId 聊天ID（单聊用characterId，群聊用groupId）
 * @param count 增加的未读数量
 * @param type 聊天类型
 */
export function incrementUnread(chatId: string, count: number = 1, type: 'single' | 'group' = 'single') {
  const data = getUnreadData()
  const current = data.get(chatId)
  
  if (current) {
    current.count += count
    current.lastUpdate = Date.now()
  } else {
    data.set(chatId, {
      chatId,
      count,
      lastUpdate: Date.now(),
      type
    })
  }
  
  saveUnreadData(data)
  
  // 更新聊天列表
  updateChatListUnread(chatId, current ? current.count : count, type)
  
  console.log(`📬 [${type}] 未读消息 +${count}: ${chatId}, 总计: ${current ? current.count : count}`)
}

/**
 * 清除未读消息
 * @param chatId 聊天ID（单聊用characterId，群聊用groupId）
 * @param type 聊天类型
 */
export function clearUnread(chatId: string, type: 'single' | 'group' = 'single') {
  const data = getUnreadData()
  data.delete(chatId)
  saveUnreadData(data)
  
  // 更新聊天列表
  updateChatListUnread(chatId, 0, type)
  
  console.log(`✅ [${type}] 已清除未读消息: ${chatId}`)
}

/**
 * 获取未读消息数
 * @param chatId 聊天ID（单聊用characterId，群聊用groupId）
 */
export function getUnreadCount(chatId: string): number {
  const data = getUnreadData()
  return data.get(chatId)?.count || 0
}

/**
 * 更新聊天列表中的未读数
 */
function updateChatListUnread(chatId: string, count: number, type: 'single' | 'group' = 'single') {
  try {
    const chatListStr = localStorage.getItem('chatList')
    if (!chatListStr) return
    
    const chatList = JSON.parse(chatListStr)
    
    // 根据类型查找聊天
    const chatIndex = type === 'group' 
      ? chatList.findIndex((c: any) => c.groupId === chatId)
      : chatList.findIndex((c: any) => c.characterId === chatId)
    
    if (chatIndex >= 0) {
      chatList[chatIndex].unread = count > 0 ? count : undefined
      localStorage.setItem('chatList', JSON.stringify(chatList))
      
      // 触发存储事件，通知其他标签页
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'chatList',
        newValue: JSON.stringify(chatList),
        url: window.location.href
      }))
    }
  } catch (e) {
    console.error('更新聊天列表未读数失败:', e)
  }
}

/**
 * 获取所有未读消息总数
 */
export function getTotalUnreadCount(): number {
  const data = getUnreadData()
  let total = 0
  data.forEach(item => {
    total += item.count
  })
  return total
}
