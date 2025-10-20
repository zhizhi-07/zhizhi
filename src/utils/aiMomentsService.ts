import { callAI } from './api'
import { Moment } from '../context/MomentsContext'

// AI朋友圈提示词
export const buildAiMomentsPrompt = (
  characterName: string,
  characterDescription: string,
  action: 'post' | 'view' | 'interact',
  moments?: Moment[],
  momentToInteract?: Moment,
  recentChatMessages?: Array<{ role: 'user' | 'assistant', content: string }>
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

  if (action === 'post') {
    // 构建聊天记录摘要
    const chatContext = recentChatMessages && recentChatMessages.length > 0
      ? recentChatMessages.slice(-5).map((msg) => {
          const speaker = msg.role === 'user' ? '用户' : characterName
          return `${speaker}: ${msg.content}`
        }).join('\n')
      : '暂无最近聊天记录'

    return `你是${characterName}。

${characterDescription}

现在是${currentDate} ${currentTime}。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【最近的聊天记录】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${chatContext}

⚠️ 重要：如果你刚才在聊天中说了"要睡觉"、"困了"等，就不要发布朋友圈了！
或者发布的内容要和聊天中的状态一致。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【任务】发布一条朋友圈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请根据你的性格、当前的心情、时间、最近的聊天内容，创作一条真实自然的朋友圈内容。

内容要求：
1. ✅ 符合你的性格和设定
2. ✅ 像真人发朋友圈一样自然、随意
3. ✅ 可以是：日常生活、心情、感悟、吐槽、分享等
4. ✅ 长度：10-100字之间
5. ✅ 可以使用emoji表情
6. ✅ 根据当前时间（${currentTime}）发布合适的内容
7. ⚠️ 必须和最近的聊天记录保持一致！不要自相矛盾！

示例（仅供参考，不要照抄）：
• 早上："刚起床，今天天气不错☀️"
• 中午："午饭吃什么呢🤔"
• 下午："下午茶时间☕"
• 晚上："今天累死了😴"
• 深夜："睡不着，有人聊天吗"

⚠️ 重要：
• 只输出朋友圈文字内容
• 不要有任何解释、说明或额外格式
• 不要说"我要发布"、"朋友圈内容是"等
• 直接输出内容本身
• 如果不适合发朋友圈（比如刚说要睡觉），就输出"SKIP"

现在请发布你的朋友圈：`
  }

  if (action === 'view' && moments && moments.length > 0) {
    const momentsText = moments.slice(0, 5).map((m, idx) => 
      `${idx + 1}. ${m.userName}：${m.content}${m.location ? ` (位置: ${m.location})` : ''}`
    ).join('\n')

    return `你是${characterName}。

${characterDescription}

你正在浏览朋友圈，看到了以下几条动态：

${momentsText}

请判断：你想对哪一条进行互动（点赞或评论）？如果不想互动，也可以选择跳过。

请按以下JSON格式回复（只输出JSON，不要有其他内容）：
{
  "action": "like" 或 "comment" 或 "skip",
  "momentIndex": 互动的动态序号（1-${Math.min(moments.length, 5)}），如果skip则为0,
  "comment": 如果action是comment，这里写评论内容，否则为空字符串
}

要求：
1. 评论要符合你的性格
2. 评论要简短自然，像真人评论一样
3. 可以使用emoji
4. 不要每条都互动，要有选择性`
  }

  if (action === 'interact' && momentToInteract) {
    return `你是${characterName}。

${characterDescription}

你看到了一条朋友圈：
发布者：${momentToInteract.userName}
内容：${momentToInteract.content}
${momentToInteract.location ? `位置：${momentToInteract.location}` : ''}

现在是${currentDate} ${currentTime}。

请判断你想做什么：
1. 点赞
2. 评论（写一条简短自然的评论）
3. 什么都不做

请按以下JSON格式回复（只输出JSON，不要有其他内容）：
{
  "action": "like" 或 "comment" 或 "skip",
  "comment": 如果action是comment，这里写评论内容，否则为空字符串
}

要求：
- 评论要符合你的性格
- 评论要简短自然，像真人评论一样（5-20字）
- 可以使用emoji
- 不要过度热情，要真实`
  }

  return ''
}

// AI发布朋友圈
export const aiPostMoment = async (
  characterId: string,
  characterName: string,
  _characterAvatar: string,
  characterDescription: string
): Promise<string | null> => {
  try {
    console.log(`📝 ${characterName} 准备发布朋友圈...`)
    console.log(`📋 角色描述: ${characterDescription.substring(0, 50)}...`)
    
    // 获取最近的聊天记录
    const chatMessages = localStorage.getItem(`chat_messages_${characterId}`)
    const recentMessages = chatMessages 
      ? JSON.parse(chatMessages).slice(-5).map((msg: any) => ({
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }))
      : []
    
    console.log(`💬 读取到 ${recentMessages.length} 条最近聊天记录`)
    
    const prompt = buildAiMomentsPrompt(characterName, characterDescription, 'post', undefined, undefined, recentMessages)
    const messages = [
      { role: 'user' as const, content: prompt }
    ]
    
    console.log('🔄 正在调用AI API...')
    const response = await callAI(messages)
    console.log('✅ API返回:', response.substring(0, 100))
    
    // 清理响应，移除可能的引号和多余空格
    const content = response.trim().replace(/^["']|["']$/g, '')
    
    // 检查是否返回SKIP
    if (content.toUpperCase() === 'SKIP') {
      console.log('⏭️ AI决定不发布朋友圈（与聊天状态不一致）')
      return null
    }
    
    console.log(`📏 内容长度: ${content.length} 字符`)
    
    if (!content || content.length === 0) {
      console.error('❌ AI返回了空内容')
      return null
    }
    
    if (content.length >= 500) {
      console.warn(`⚠️ 内容太长 (${content.length}字符)，截取前500字符`)
      return content.substring(0, 500)
    }
    
    console.log('✅ 朋友圈内容生成成功')
    return content
  } catch (error) {
    console.error('❌ AI发布朋友圈失败:', error)
    return null
  }
}

// AI查看并互动朋友圈
export const aiInteractWithMoments = async (
  _characterId: string,
  characterName: string,
  _characterAvatar: string,
  characterDescription: string,
  moments: Moment[]
): Promise<{
  action: 'like' | 'comment' | 'skip'
  momentId?: string
  comment?: string
} | null> => {
  try {
    if (moments.length === 0) return null
    
    const prompt = buildAiMomentsPrompt(characterName, characterDescription, 'view', moments)
    const messages = [
      { role: 'user' as const, content: prompt }
    ]
    
    const response = await callAI(messages)
    
    // 尝试解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    
    const result = JSON.parse(jsonMatch[0])
    
    if (result.action === 'skip') {
      return { action: 'skip' }
    }
    
    const momentIndex = parseInt(result.momentIndex) - 1
    if (momentIndex >= 0 && momentIndex < moments.length) {
      const targetMoment = moments[momentIndex]
      
      return {
        action: result.action,
        momentId: targetMoment.id,
        comment: result.action === 'comment' ? result.comment : undefined
      }
    }
    
    return null
  } catch (error) {
    console.error('AI互动朋友圈失败:', error)
    return null
  }
}

// AI对单条朋友圈进行互动判断
export const aiInteractWithSingleMoment = async (
  characterName: string,
  characterDescription: string,
  moment: Moment
): Promise<{
  action: 'like' | 'comment' | 'skip'
  comment?: string
} | null> => {
  try {
    const prompt = buildAiMomentsPrompt(characterName, characterDescription, 'interact', undefined, moment)
    const messages = [
      { role: 'user' as const, content: prompt }
    ]
    
    const response = await callAI(messages)
    
    // 尝试解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    
    const result = JSON.parse(jsonMatch[0])
    
    return {
      action: result.action,
      comment: result.action === 'comment' ? result.comment : undefined
    }
  } catch (error) {
    console.error('AI互动单条朋友圈失败:', error)
    return null
  }
}
