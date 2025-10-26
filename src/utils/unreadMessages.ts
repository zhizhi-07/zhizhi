/**
 * 未读消息管理系统
 * 跟踪每个聊天的未读消息数量
 */

interface UnreadData {
  characterId: string
  count: number
  lastUpdate: number
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
 */
export function incrementUnread(characterId: string, count: number = 1) {
  const data = getUnreadData()
  const current = data.get(characterId)
  
  if (current) {
    current.count += count
    current.lastUpdate = Date.now()
  } else {
    data.set(characterId, {
      characterId,
      count,
      lastUpdate: Date.now()
    })
  }
  
  saveUnreadData(data)
  
  // 更新聊天列表
  updateChatListUnread(characterId, current ? current.count : count)
  
  console.log(`📬 未读消息 +${count}: ${characterId}, 总计: ${current ? current.count : count}`)
}

/**
 * 清除未读消息
 */
export function clearUnread(characterId: string) {
  const data = getUnreadData()
  data.delete(characterId)
  saveUnreadData(data)
  
  // 更新聊天列表
  updateChatListUnread(characterId, 0)
  
  console.log(`✅ 已清除未读消息: ${characterId}`)
}

/**
 * 获取未读消息数
 */
export function getUnreadCount(characterId: string): number {
  const data = getUnreadData()
  return data.get(characterId)?.count || 0
}

/**
 * 更新聊天列表中的未读数
 */
function updateChatListUnread(characterId: string, count: number) {
  try {
    const chatListStr = localStorage.getItem('chatList')
    if (!chatListStr) return
    
    const chatList = JSON.parse(chatListStr)
    const chatIndex = chatList.findIndex((c: any) => c.characterId === characterId)
    
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
