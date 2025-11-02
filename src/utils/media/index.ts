/**
 * 媒体处理相关工具函数统一导出
 */

// 图片处理
export { compressImage, resizeImage, imageToDataURL } from '../imageUtils'
export { imageStorage } from '../imageStorage'

// 头像处理
export { getAvatarUrl, clearAvatarCache } from '../avatarUtils'
export { clearAvatarCache as clearCache } from '../clearAvatarCache'

// 表情包
export { parseEmoji } from '../emojiParser'
export { emojiStorage } from '../emojiStorage'

