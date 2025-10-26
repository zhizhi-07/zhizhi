/**
 * 表情包存储工具 - IndexedDB 版本
 * 使用旧的 indexedDB.ts（版本1），避免版本冲突
 */

import { setItem, getAllItems, deleteItem, clearStore, STORES } from './indexedDB'

export interface Emoji {
  id: number
  url: string
  name: string
  description: string
  addTime: string
  useCount: number
}

console.log('📦 表情包存储：IndexedDB')

/**
 * 获取所有表情包
 */
export async function getEmojis(): Promise<Emoji[]> {
  try {
    return await getAllItems<Emoji>(STORES.EMOJIS)
  } catch (error) {
    console.error('读取表情包失败:', error)
    return []
  }
}

/**
 * 保存表情包列表
 */
export async function saveEmojis(emojis: Emoji[]): Promise<boolean> {
  try {
    // 清空旧数据
    await clearStore(STORES.EMOJIS)
    // 批量保存
    for (const emoji of emojis) {
      await setItem(STORES.EMOJIS, emoji)
    }
    return true
  } catch (error) {
    console.error('保存表情包失败:', error)
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
    
    await setItem(STORES.EMOJIS, newEmoji)
    return newEmoji
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
    await deleteItem(STORES.EMOJIS, id)
    return true
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
    const { getItem } = await import('./indexedDB')
    const emoji = await getItem<Emoji>(STORES.EMOJIS, id)
    if (emoji) {
      emoji.useCount = (emoji.useCount || 0) + 1
      await setItem(STORES.EMOJIS, emoji)
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
    storage: 'localStorage',
    emojis: emojis
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * 导入表情包数据 - 支持 IndexedDB 大容量存储
 */
export async function importEmojis(jsonData: string, replaceMode: boolean = false): Promise<{ success: boolean, count: number, message: string }> {
  try {
    const importData = JSON.parse(jsonData)
    
    if (!importData.emojis || !Array.isArray(importData.emojis)) {
      return { success: false, count: 0, message: '导入文件格式不正确' }
    }
    
    let finalEmojis: Emoji[]
    let actualImported = 0
    let originalCount = 0
    
    if (replaceMode) {
      finalEmojis = importData.emojis
      actualImported = finalEmojis.length
    } else {
      const currentEmojis = await getEmojis()
      originalCount = currentEmojis.length
      
      // 合并去重
      const mergedEmojis = [...currentEmojis, ...importData.emojis]
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
    
    const saved = await saveEmojis(finalEmojis)
    
    if (saved) {
      const modeText = replaceMode ? '替换导入' : '追加导入'
      return { 
        success: true, 
        count: actualImported, 
        message: `✅ 成功${modeText} ${actualImported} 个表情包！\n\n${replaceMode ? '' : `原有: ${originalCount} 个\n`}总计: ${finalEmojis.length} 个` 
      }
    } else {
      return { success: false, count: 0, message: '保存失败' }
    }
  } catch (error) {
    console.error('导入错误:', error)
    return { success: false, count: 0, message: `导入失败：${error instanceof Error ? error.message : '未知错误'}` }
  }
}

/**
 * 清空所有表情包
 */
export async function clearAllEmojis(): Promise<boolean> {
  try {
    await clearStore(STORES.EMOJIS)
    return true
  } catch (error) {
    console.error('清空表情包失败:', error)
    return false
  }
}
