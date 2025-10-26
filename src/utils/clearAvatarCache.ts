/**
 * 清理所有头像识图缓存
 * 用于解决"默认头像识图结果一直存在"的问题
 */

export function clearAllAvatarCache() {
  const keysToRemove: string[] = []
  
  // 遍历localStorage，找出所有头像相关的key
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key.includes('avatar_description') ||
      key.includes('avatar_fingerprint') ||
      key.includes('avatar_recognized_at')
    )) {
      keysToRemove.push(key)
    }
  }
  
  // 删除所有找到的key
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    console.log(`🗑️ 已删除: ${key}`)
  })
  
  console.log(`✅ 已清理 ${keysToRemove.length} 个头像缓存`)
  return keysToRemove.length
}

/**
 * 清理指定用户的头像缓存
 */
export function clearUserAvatarCache(userId: string) {
  localStorage.removeItem(`user_avatar_description_${userId}`)
  localStorage.removeItem(`user_avatar_fingerprint_${userId}`)
  localStorage.removeItem(`user_avatar_recognized_at_${userId}`)
  console.log(`✅ 已清理用户 ${userId} 的头像缓存`)
}

/**
 * 清理指定角色的头像缓存
 */
export function clearCharacterAvatarCache(characterId: string) {
  localStorage.removeItem(`character_avatar_description_${characterId}`)
  localStorage.removeItem(`character_avatar_fingerprint_${characterId}`)
  localStorage.removeItem(`character_avatar_recognized_at_${characterId}`)
  console.log(`✅ 已清理角色 ${characterId} 的头像缓存`)
}

// 在浏览器控制台中可以直接调用
if (typeof window !== 'undefined') {
  ;(window as any).clearAllAvatarCache = clearAllAvatarCache
  ;(window as any).clearUserAvatarCache = clearUserAvatarCache
  ;(window as any).clearCharacterAvatarCache = clearCharacterAvatarCache
}
