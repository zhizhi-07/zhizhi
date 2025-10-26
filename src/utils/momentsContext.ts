import { Moment } from '../context/MomentsContext'

// 获取与角色相关的朋友圈上下文
export const getMomentsContext = (
  characterId: string,
  characterName: string,
  userName: string,
  moments: Moment[]
): string => {
  // 获取最近5条相关的朋友圈（用户发布的 + AI发布的）
  const recentMoments = moments
    .filter(m => m.userId === characterId || m.userId === '1') // '1'是用户ID
    .slice(0, 5)

  if (recentMoments.length === 0) {
    return ''
  }

  const momentsText = recentMoments.map(m => {
    const author = m.userId === characterId ? characterName : userName
    const timeAgo = getTimeAgo(m.createdAt)
    
    let text = `• ${author} ${timeAgo}发布：${m.content}`
    
    // 添加互动信息（简化显示，只显示数量）
    if (m.likes.length > 0) {
      text += `\n  收到${m.likes.length}个赞`
    }
    
    if (m.comments.length > 0) {
      text += `\n  收到${m.comments.length}条评论`
    }
    
    return text
  }).join('\n\n')

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【朋友圈动态】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你们最近的朋友圈：

${momentsText}

提示：
• 你可以在聊天中提到朋友圈的内容
• 如果对方发的朋友圈和聊天话题相关，可以自然地提起
• 不要刻意，要像真人一样自然
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

// 计算时间差
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const past = new Date(dateString)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return `${Math.floor(diffDays / 7)}周前`
}
