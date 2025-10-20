import { callAI } from './api'
import { Moment } from '../context/MomentsContext'

// 构建包含聊天上下文的AI朋友圈互动提示词
export const buildContextualMomentsPrompt = (
  characterName: string,
  characterDescription: string,
  moment: Moment,
  recentChatMessages: Array<{ role: 'user' | 'assistant', content: string }>
) => {
  const now = new Date()
  const currentTime = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  
  const currentDate = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  // 构建聊天记录摘要
  const chatContext = recentChatMessages.length > 0 
    ? recentChatMessages.slice(-10).map((msg) => {
        const speaker = msg.role === 'user' ? moment.userName : characterName
        return `${speaker}: ${msg.content}`
      }).join('\n')
    : '暂无最近聊天记录'

  return `你是${characterName}。

${characterDescription}

现在是${currentDate} ${currentTime}。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【重要背景信息】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你和${moment.userName}是朋友，你们之间有聊天记录。

最近的聊天内容：
${chatContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【朋友圈动态】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${moment.userName}刚刚发布了一条朋友圈：

内容：${moment.content}
${moment.location ? `位置：${moment.location}` : ''}
发布时间：${new Date(moment.createdAt).toLocaleString('zh-CN')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【你的决策】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请根据：
1. 你和${moment.userName}的聊天历史
2. 你们的关系亲密程度
3. 朋友圈的内容
4. 你的性格特点
5. 当前的时间和心情

来决定是否要对这条朋友圈进行互动。

⚠️ 重要提示：
• 如果你们刚聊过天，或者关系很好，更可能互动
• 如果朋友圈内容和你们聊天话题相关，更可能评论
• 如果朋友圈内容很普通，可能只点赞或跳过
• 如果你们关系一般或没聊过天，可能跳过
• 评论要自然，可以结合聊天内容

请按以下JSON格式回复（只输出JSON，不要有其他内容）：
{
  "action": "like" 或 "comment" 或 "skip",
  "comment": "如果action是comment，这里写评论内容（5-30字），否则为空字符串",
  "reason": "简短说明你的决策理由（可选，用于调试）"
}

示例：
✅ 如果你们刚聊过相关话题：
{
  "action": "comment",
  "comment": "哈哈，就是我们刚说的那个！",
  "reason": "朋友圈内容和聊天话题相关"
}

✅ 如果关系好但内容普通：
{
  "action": "like",
  "comment": "",
  "reason": "关系不错，点个赞"
}

✅ 如果不太想互动：
{
  "action": "skip",
  "comment": "",
  "reason": "内容不太感兴趣"
}

现在请做出你的决定。`
}

// AI查看朋友圈并决定是否互动（带聊天上下文）
export const aiInteractWithMomentContextual = async (
  _characterId: string,
  characterName: string,
  characterDescription: string,
  moment: Moment,
  recentChatMessages: Array<{ role: 'user' | 'assistant', content: string }>
): Promise<{
  action: 'like' | 'comment' | 'skip'
  comment?: string
  reason?: string
} | null> => {
  try {
    const prompt = buildContextualMomentsPrompt(
      characterName,
      characterDescription,
      moment,
      recentChatMessages
    )
    
    const messages = [
      { role: 'user' as const, content: prompt }
    ]
    
    console.log(`🤖 ${characterName} 正在查看 ${moment.userName} 的朋友圈...`)
    console.log(`📝 聊天上下文: ${recentChatMessages.length} 条消息`)
    
    const response = await callAI(messages)
    
    // 尝试解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ AI返回格式错误:', response)
      return null
    }
    
    const result = JSON.parse(jsonMatch[0])
    
    console.log(`💭 ${characterName} 的决定:`, result.action, result.reason || '')
    
    return {
      action: result.action,
      comment: result.action === 'comment' ? result.comment : undefined,
      reason: result.reason
    }
  } catch (error) {
    console.error('AI互动朋友圈失败:', error)
    return null
  }
}
