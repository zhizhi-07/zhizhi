/**
 * 统一梗库管理器
 * 
 * 管理内置梗和自定义梗，确保小程序和论坛同步
 * 
 * @module utils/memeManager
 */

import { memesData, Meme } from './memesRetrieval'

/**
 * 获取所有梗（内置+自定义）
 */
export function getAllMemes(): Meme[] {
  const customMemes = getCustomMemes()
  return [...memesData, ...customMemes]
}

/**
 * 获取自定义梗
 */
export function getCustomMemes(): Meme[] {
  const saved = localStorage.getItem('custom_memes')
  if (!saved) return []
  
  try {
    return JSON.parse(saved)
  } catch (error) {
    console.error('加载自定义梗失败:', error)
    return []
  }
}

/**
 * 添加自定义梗
 */
export function addCustomMeme(meme: Omit<Meme, 'id'>): Meme {
  const customMemes = getCustomMemes()
  
  // 生成新ID（从10000开始，避免与内置梗冲突）
  const newId = customMemes.length > 0 
    ? Math.max(...customMemes.map(m => m.id)) + 1 
    : 10000
  
  const newMeme: Meme = {
    ...meme,
    id: newId
  }
  
  customMemes.push(newMeme)
  localStorage.setItem('custom_memes', JSON.stringify(customMemes))
  
  return newMeme
}

/**
 * 删除自定义梗
 */
export function deleteCustomMeme(id: number): boolean {
  const customMemes = getCustomMemes()
  const filtered = customMemes.filter(m => m.id !== id)
  
  if (filtered.length === customMemes.length) {
    return false // 没有找到
  }
  
  localStorage.setItem('custom_memes', JSON.stringify(filtered))
  return true
}

/**
 * 更新自定义梗
 */
export function updateCustomMeme(id: number, updates: Partial<Meme>): boolean {
  const customMemes = getCustomMemes()
  const index = customMemes.findIndex(m => m.id === id)
  
  if (index === -1) return false
  
  customMemes[index] = { ...customMemes[index], ...updates }
  localStorage.setItem('custom_memes', JSON.stringify(customMemes))
  
  return true
}

/**
 * 获取格式化的梗库文本（用于AI）
 */
export function getMemesForAI(): string {
  const allMemes = getAllMemes()
  return allMemes
    .map(m => `"${m['梗']}": ${m['含义']}`)
    .join('\n')
}

/**
 * 梗库统计
 */
export function getMemeStats() {
  const customMemes = getCustomMemes()
  return {
    total: memesData.length + customMemes.length,
    builtin: memesData.length,
    custom: customMemes.length
  }
}
