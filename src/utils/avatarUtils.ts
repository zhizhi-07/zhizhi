/**
 * 获取头像URL，如果没有设置则返回空字符串
 * @param avatar 用户/AI的头像URL
 * @param isAi 是否是AI（true=AI，false=用户）
 * @returns 头像URL或空字符串
 */
export const getAvatarUrl = (avatar: string | undefined, isAi: boolean = false): string => {
  // 如果有头像且不为空，返回头像
  // 支持 base64 图片 (data:image) 和普通 URL
  if (avatar && avatar.trim() !== '' && (avatar.startsWith('data:image') || avatar.startsWith('http') || avatar.startsWith('/'))) {
    return avatar
  }
  // 否则返回空字符串（不使用默认头像）
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
