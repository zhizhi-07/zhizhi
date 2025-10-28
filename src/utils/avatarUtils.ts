/**
 * 获取头像URL，如果没有设置则返回空字符串
 * @param avatar 用户/AI的头像URL
 * @param isAi 是否是AI（true=AI，false=用户）
 * @returns 头像URL或空字符串
 */
export const getAvatarUrl = (avatar: string | undefined, isAi: boolean = false): string => {
  // 如果没有头像或为空，返回空字符串
  if (!avatar || avatar.trim() === '') {
    return ''
  }
  
  // 过滤掉特殊值（emoji、default等）
  const trimmedAvatar = avatar.trim()
  if (trimmedAvatar === 'default' || trimmedAvatar.length <= 2) {
    // 单个emoji通常1-2个字符，不是有效URL
    return ''
  }
  
  // 只返回有效的图片URL
  // 支持 base64 图片 (data:image) 和普通 URL (http/https//)
  if (trimmedAvatar.startsWith('data:image') || 
      trimmedAvatar.startsWith('http') || 
      trimmedAvatar.startsWith('/')) {
    return trimmedAvatar
  }
  
  // 其他情况（包括emoji）返回空字符串
  return ''
}

/**
 * 获取AI头像URL
 */
export const getAiAvatar = (avatar: string | undefined): string => {
  return getAvatarUrl(avatar, true)
}

/**
 * 获取用户头像URL
 */
export const getUserAvatar = (avatar: string | undefined): string => {
  return getAvatarUrl(avatar, false)
}
