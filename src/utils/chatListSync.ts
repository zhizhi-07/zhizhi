/**
 * 聊天列表同步工具
 * 
 * 后台聊天时同步最后一条消息和显示通知
 */

import { setIndexedDBItem, getIndexedDBItem, STORES } from './indexedDBStorage'

/**
 * 更新聊天列表的最后一条消息
 */
export async function updateChatListLastMessage(
  characterId: string,
  lastMessage: string,
  timestamp?: number
) {
  try {
    // 先尝试从 IndexedDB 读取
    const data = await getIndexedDBItem<any>(STORES.SETTINGS, 'chatList')
    let chatList: any[] = []
    
    if (data && data.chats) {
      chatList = data.chats
    } else {
      // 如果 IndexedDB 没有，尝试从 localStorage 读取
      const chatListStr = localStorage.getItem('chatList')
      if (chatListStr) {
        chatList = JSON.parse(chatListStr)
      } else {
        return // 没有聊天列表，直接返回
      }
    }
    
    const chatIndex = chatList.findIndex((c: any) => c.characterId === characterId)
    
    if (chatIndex >= 0) {
      chatList[chatIndex].lastMessage = lastMessage
      chatList[chatIndex].time = new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      })
      if (timestamp) {
        chatList[chatIndex].timestamp = timestamp
      }
      
      // 保存到 IndexedDB
      await setIndexedDBItem(STORES.SETTINGS, {
        key: 'chatList',
        chats: chatList
      })
      
      // 也更新 localStorage 以保证兼容性
      localStorage.setItem('chatList', JSON.stringify(chatList))
      
      // 触发存储事件，通知聊天列表页面更新（跨标签页）
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'chatList',
        newValue: JSON.stringify(chatList),
        url: window.location.href
      }))
      
      // 触发自定义事件，通知同一页面内的聊天列表更新
      window.dispatchEvent(new CustomEvent('chatlist-updated', {
        detail: { characterId, lastMessage }
      }))
      
      console.log(`✅ 已更新聊天列表最后一条消息: ${characterId}`, lastMessage)
    }
  } catch (e) {
    console.error('更新聊天列表最后消息失败:', e)
  }
}

/**
 * 显示后台消息通知
 */
export function showBackgroundChatNotification(
  characterName: string,
  characterAvatar: string,
  message: string,
  characterId: string
) {
  // 检查是否在聊天详情页（只有完全匹配才跳过）
  const currentPath = window.location.pathname
  const isInCurrentChat = currentPath === `/chat/${characterId}`
  
  // 如果在当前聊天页面且页面可见，不显示通知
  if (isInCurrentChat && document.visibilityState === 'visible') {
    return
  }
  
  // 🔧 修复：始终显示自定义通知（更可靠）
  // 系统通知在移动端和某些浏览器上不稳定，统一使用自定义通知
  showCustomNotification(characterName, message, characterId, characterAvatar)
  
  // 同时尝试显示系统通知（如果有权限）
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`${characterName}`, {
        body: message,
        icon: characterAvatar,
        tag: characterId,
        requireInteraction: false
      })
    } catch (e) {
      // 静默失败
    }
  }
}

/**
 * 显示自定义通知（使用IOSNotification）
 */
function showCustomNotification(characterName: string, message: string, characterId: string, characterAvatar?: string) {
  // 触发自定义事件，让App.tsx中的通知组件捕获
  const event = new CustomEvent('background-chat-message', {
    detail: {
      title: characterName,
      message: message,
      characterId: characterId,
      chatId: characterId,
      type: 'single',
      avatar: characterAvatar
    }
  })
  
  window.dispatchEvent(event)
}
