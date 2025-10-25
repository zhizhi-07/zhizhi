/**
 * 表情包存储工具 - 使用 IndexedDB 突破 localStorage 限制
 */

import { initDB, getAllIndexedDBItems, setIndexedDBItem, deleteIndexedDBItem, clearIndexedDBStore, STORES } from './indexedDBStorage'

export interface Emoji {
  id: number
  url: string
  name: string
  description: string
  addTime: string
  useCount: number
}

const STORAGE_KEY = 'custom_emojis'
const USE_INDEXEDDB = true // 启用 IndexedDB

/**
 * 获取所有表情包
 */
export async function getEmojis(): Promise<Emoji[]> {
  try {
    if (USE_INDEXEDDB) {
      // 使用 IndexedDB
      const emojis = await getAllIndexedDBItems<Emoji>(STORES.EMOJIS)
      return emojis
    } else {
      // 使用 localStorage
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    }
  } catch (error) {
    console.error('读取表情包失败:', error)
    return []
  }
}

/**
 * 检查存储空间
 */
function checkStorageSpace(data: string): boolean {
  const dataSize = new Blob([data]).size
  const maxSize = 20 * 1024 * 1024 // 20MB（扩大存储空间）
  
  console.log(`📊 表情包数据大小: ${(dataSize / 1024).toFixed(2)} KB`)
  
  if (dataSize > maxSize) {
    console.warn(`⚠️ 数据超过 ${maxSize / 1024 / 1024}MB 限制`)
    return false
  }
  return true
}

/**
 * 保存表情包列表
 */
export async function saveEmojis(emojis: Emoji[]): Promise<boolean> {
  try {
    if (USE_INDEXEDDB) {
      // 使用 IndexedDB - 无需检查空间，支持大容量
      await initDB()
      for (const emoji of emojis) {
        await setIndexedDBItem(STORES.EMOJIS, emoji)
      }
      console.log(`✅ 成功保存 ${emojis.length} 个表情包到 IndexedDB`)
      return true
    } else {
      // 使用 localStorage
      const jsonData = JSON.stringify(emojis)
      
      if (!checkStorageSpace(jsonData)) {
        throw new Error('存储空间不足，数据超过 20MB 限制')
      }
      
      localStorage.setItem(STORAGE_KEY, jsonData)
      console.log(`✅ 成功保存 ${emojis.length} 个表情包`)
      return true
    }
  } catch (error) {
    console.error('❌ 保存表情包失败:', error)
    alert('保存失败！请尝试刷新页面或联系支持。')
    return false
  }
}

/**
 * 添加表情包
 */
export async function addEmoji(emoji: Omit<Emoji, 'id' | 'addTime' | 'useCount'>): Promise<Emoji | null> {
  try {
    const newEmoji: Emoji = {
      ...emoji,
      id: Date.now(),
      addTime: new Date().toISOString(),
      useCount: 0
    }
    
    if (USE_INDEXEDDB) {
      // 直接保存到 IndexedDB
      await setIndexedDBItem(STORES.EMOJIS, newEmoji)
      console.log(`✅ 成功添加表情包: ${newEmoji.name}`)
      return newEmoji
    } else {
      // localStorage 方式
      const emojis = await getEmojis()
      emojis.push(newEmoji)
      const success = await saveEmojis(emojis)
      
      if (!success) {
        return null
      }
      
      return newEmoji
    }
  } catch (error) {
    console.error('添加表情包失败:', error)
    return null
  }
}

/**
 * 删除表情包
 */
export async function deleteEmoji(id: number): Promise<boolean> {
  try {
    if (USE_INDEXEDDB) {
      await deleteIndexedDBItem(STORES.EMOJIS, id)
      return true
    } else {
      const emojis = await getEmojis()
      const filtered = emojis.filter(e => e.id !== id)
      return await saveEmojis(filtered)
    }
  } catch (error) {
    console.error('删除表情包失败:', error)
    return false
  }
}

/**
 * 增加使用次数（优化版：直接更新单个表情包）
 */
export async function incrementUseCount(id: number): Promise<void> {
  try {
    if (USE_INDEXEDDB) {
      // IndexedDB：直接读取并更新单个表情包
      const db = await initDB()
      const transaction = db.transaction([STORES.EMOJIS], 'readwrite')
      const store = transaction.objectStore(STORES.EMOJIS)
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const emoji = getRequest.result
        if (emoji) {
          emoji.useCount = (emoji.useCount || 0) + 1
          store.put(emoji)
        }
      }
    } else {
      // localStorage：需要读取所有数据
      const emojis = await getEmojis()
      const emoji = emojis.find(e => e.id === id)
      if (emoji) {
        emoji.useCount++
        await saveEmojis(emojis)
      }
    }
  } catch (error) {
    console.error('更新使用次数失败:', error)
  }
}

/**
 * 导出表情包数据
 */
export async function exportEmojis(): Promise<string> {
  const emojis = await getEmojis()
  const exportData = {
    version: '2.0',
    exportTime: new Date().toISOString(),
    count: emojis.length,
    storage: 'IndexedDB',
    emojis: emojis
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * 导入表情包数据 - 支持 IndexedDB 大容量存储
 */
export async function importEmojis(jsonData: string, replaceMode: boolean = false): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const importData = JSON.parse(jsonData)
    
    if (!importData.emojis || !Array.isArray(importData.emojis)) {
      return { success: false, count: 0, message: '导入文件格式不正确' }
    }
    
    console.log(`📥 准备导入 ${importData.emojis.length} 个表情包到 IndexedDB`)
    
    const currentEmojis = await getEmojis()
    const originalCount = currentEmojis.length
    let finalEmojis: Emoji[]
    let actualImported = 0
    
    if (replaceMode) {
      // 替换模式：清空现有数据
      console.log(`🔄 替换模式：清空现有 ${originalCount} 个表情包`)
      if (USE_INDEXEDDB) {
        await clearIndexedDBStore(STORES.EMOJIS)
      }
      finalEmojis = importData.emojis
      actualImported = finalEmojis.length
    } else {
      // 追加模式：合并并去重
      const mergedEmojis = [...currentEmojis, ...importData.emojis]
      
      // 去重（基于URL）
      const uniqueEmojis: Emoji[] = []
      const urlSet = new Set<string>()
      
      mergedEmojis.forEach(emoji => {
        if (!urlSet.has(emoji.url)) {
          urlSet.add(emoji.url)
          uniqueEmojis.push(emoji)
        }
      })
      
      finalEmojis = uniqueEmojis
      actualImported = finalEmojis.length - originalCount
    }
    
    // IndexedDB 支持大容量，不需要检查大小
    const jsonSize = new Blob([JSON.stringify(finalEmojis)]).size
    const sizeMB = jsonSize / 1024 / 1024
    console.log(`📊 导入后数据大小: ${(jsonSize / 1024).toFixed(2)} KB (${sizeMB.toFixed(2)} MB)`)
    console.log(`📊 原有: ${originalCount} 个，导入: ${importData.emojis.length} 个，最终: ${finalEmojis.length} 个`)
    
    const saved = await saveEmojis(finalEmojis)
    
    if (saved) {
      return { 
        success: true, 
        count: actualImported, 
        message: `✅ 成功导入 ${actualImported} 个表情包！\n\n总计: ${finalEmojis.length} 个\n大小: ${sizeMB.toFixed(2)} MB\n存储: IndexedDB (无限制)` 
      }
    } else {
      return { success: false, count: 0, message: '保存失败，请刷新页面后重试' }
    }
  } catch (error) {
    console.error('导入错误:', error)
    return { success: false, count: 0, message: `导入失败：${error instanceof Error ? error.message : '文件格式可能不正确'}` }
  }
}

/**
 * 清空所有表情包
 */
export async function clearAllEmojis(): Promise<boolean> {
  try {
    if (USE_INDEXEDDB) {
      await clearIndexedDBStore(STORES.EMOJIS)
      return true
    } else {
      return await saveEmojis([])
    }
  } catch (error) {
    console.error('清空表情包失败:', error)
    return false
  }
}
