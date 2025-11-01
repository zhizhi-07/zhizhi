import { callAI } from './api'
import { Moment } from '../context/MomentsContext'
import { addMomentNotification } from './momentsNotification'

// 构建AI查看朋友圈的提示词（包括其他AI的朋友圈）
export const buildSocialMomentsPrompt = (
  characterName: string,
  characterDescription: string,
  moment: Moment,
  recentChatMessages: Array<{ role: 'user' | 'assistant', content: string }>,
  existingComments: Array<{ userName: string, content: string }>
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

  // 构建已有评论
  const commentsText = existingComments.length > 0
    ? existingComments.map(c => `${c.userName}: ${c.content}`).join('\n')
    : '暂无评论'

  return `你是${characterName}。

${characterDescription}

现在是${currentDate} ${currentTime}。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【朋友圈动态】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${moment.userName}发布了一条朋友圈：

内容：${moment.content}
${moment.location ? `位置：${moment.location}` : ''}
发布时间：${new Date(moment.createdAt).toLocaleString('zh-CN')}

点赞：${moment.likes.map(l => l.userName).join('、') || '暂无'}

评论区：
${commentsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【关系分析】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你和${moment.userName}的聊天记录：
${chatContext}

⚠️ 重要提示：
• 仔细看你的人设描述，里面会说明你和${moment.userName}是什么关系
• 如果人设里没提到${moment.userName}，说明你们关系一般或不认识
• 评论区的人你不一定认识，除非你的人设里明确提到了他们
• 如果评论区在讨论你不了解的事情，就不要随便插话

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【你的决策】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请像真人一样思考和反应：

1. **评论区有人@我吗？**
   • 如果有人@我，我应该回复他们说的话
   • 回复时要针对他们的话，不要答非所问

2. **评论区的内容和我有关吗？**
   • 比如：有人夸${moment.userName}漂亮，而我是${moment.userName}的恋人 → 我可能会吃醋或者也想说点什么
   • 比如：有人在讨论我感兴趣的话题 → 我可能想参与
   • 比如：有人说了让我不爽的话 → 我可能想回怼

3. **我和${moment.userName}是什么关系？**
   • 看人设描述和聊天记录
   • 关系越好，越可能互动

4. **根据我的性格，我会怎么做？**
   • 活泼的人可能更爱评论
   • 高冷的人可能只点赞
   • 吃醋的人可能会回复情敌

⚠️ 唯一的硬性规则：
• 不要发送和别人完全相同的评论

其他的，完全由你根据人设、关系、情境自然决定。

💡 互动方式选择：
• 点赞（like）：最常用！表示"看到了"、"不错"、"支持"
• 评论（comment）：只有真的有话想说时
• 跳过（skip）：不感兴趣或和自己无关

⚠️ 真实的朋友圈使用习惯：
• 80%的情况应该点赞，不要评论
• 点赞是最自然、最常见的互动方式
• 不要总是评论，大部分时候点个赞就够了
• 只有真的有话想说，或者被@了，才评论

请按以下JSON格式回复（只输出JSON，不要有其他内容）：
{
  "action": "like" 或 "comment" 或 "skip",
  "comment": "如果action是comment，这里写评论内容（5-30字），否则为空字符串",
  "reason": "简短说明你的决策理由（可选）"
}

示例：
✅ 点赞（最常见）：
{
  "action": "like",
  "comment": "",
  "reason": "内容不错，点个赞"
}

✅ 评论：
{
  "action": "comment",
  "comment": "哈哈，有意思",
  "reason": "真的想说点什么"
}

✅ 跳过：
{
  "action": "skip",
  "comment": "",
  "reason": "没什么想说的"
}

现在请做出你的决定。`
}

// 批量处理多个AI的朋友圈互动决策（一次API调用）
export const batchAIInteractWithMoment = async (
  characters: Array<{
    id: string
    name: string
    description: string
    recentMessages: Array<{ role: 'user' | 'assistant', content: string }>
  }>,
  moment: Moment
): Promise<Array<{
  characterId: string
  characterName: string
  actions: Array<'like' | 'comment' | 'message' | 'skip'>
  comment?: string
  message?: string
  reason?: string
}>> => {
  try {

    // 构建角色信息（平衡版）
    const charactersInfo = characters.map((char, idx) => {
      // 只保留最近2条聊天记录，但保留更多字数
      const recentChats = char.recentMessages.slice(-2).map((msg) => {
        // 限制每条消息最多50字
        const content = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content
        return `${msg.role === 'user' ? '用户' : char.name}: ${content}`
      }).join('\n')

      // 限制人设描述最多120字
      const desc = char.description.length > 120 ? char.description.substring(0, 120) + '...' : char.description

      return `${idx + 1}. ${char.name}
人设：${desc}
${recentChats ? `聊天：\n${recentChats}` : '无聊天'}`
    }).join('\n\n')

    // 构建已有评论（清晰标注谁说的）
    const commentsText = moment.comments.length > 0
      ? moment.comments.map((c, idx) => `[${idx + 1}] ${c.userName}说：${c.content}`).join('\n')
      : '暂无'

    const prompt = `【朋友圈】
发布者：${moment.userName}
内容：${moment.content}
${moment.location ? `位置：${moment.location}` : ''}

点赞：${moment.likes.map(l => l.userName).join('、') || '暂无'}

【评论区对话】
${commentsText}

⚠️ 注意：仔细看清楚每条评论是谁说的！
• ${moment.userName} = 发布者
• 微信用户 = 真实用户
• 其他名字 = AI角色

【AI角色信息】
${charactersInfo}

【任务】
为每个AI决定是否互动这条朋友圈。

⚠️ 重要规则：
1. 如果有人@我，我应该回复（即使我之前评论过）
2. 如果我已经评论过，但没人@我，可以skip或like
3. 如果没有@我，大部分情况应该like，不要总是comment

思考步骤（必须按顺序思考）：
1. 仔细看评论区，谁说了什么？
2. 有人@我吗？他们对我说了什么？
3. 如果有人@我，我应该针对他们说的话回复
4. 如果没人@我，我要不要主动说点什么？
5. 我之前说过什么吗？不要重复

互动方式（可以同时做多个）：
• skip = 跳过（完全不感兴趣）
• like = 点赞（看到了，表示支持）
• comment = 公开评论（想说点什么，让所有人看到）
• message = 私信（想单独跟发布者聊聊，不想让别人看到）

✨ 重要：可以同时做多个动作！
• 点赞+评论：很常见的组合
• 点赞+私信：公开点赞，私下再聊
• 评论+私信：公开回应，私下补充
• 点赞+评论+私信：都可以！

硬性规则：
• 被@了应该回复（comment或message）
• 不要重复说同样的话
• comment是公开的，所有人能看到
• message是私密的，只有发布者能看到

请按以下JSON格式回复（只输出JSON数组，不要有其他内容）：
[
  {
    "characterName": "角色名字",
    "actions": ["like", "comment"],
    "comment": "如果有comment动作，这里写评论内容（5-30字）",
    "message": "如果有message动作，这里写私信内容（10-50字）",
    "reason": "简短说明决策理由（可选）"
  },
  ...
]

示例：
[
  {
    "characterName": "小雪",
    "actions": ["like", "comment"],
    "comment": "哈哈好可爱",
    "message": "",
    "reason": "很有趣，点赞加评论"
  },
  {
    "characterName": "小明",
    "actions": ["like", "message"],
    "comment": "",
    "message": "看到你发的朋友圈了，有空一起出来玩吧",
    "reason": "想私下聊聊"
  },
  {
    "characterName": "小李",
    "actions": ["skip"],
    "comment": "",
    "message": "",
    "reason": "和我无关"
  }
]

现在请为所有角色做出决定：`

    console.log(`🤖 批量处理 ${characters.length} 个AI的决策...`)
    
    // 使用更大的maxTokens（10000）避免超时
    const response = await callAI([{ role: 'user' as const, content: prompt }], 1, 10000)
    
    // 尝试解析JSON响应
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('❌ AI返回格式错误:', response)
      return []
    }
    
    const results = JSON.parse(jsonMatch[0])
    
    // 映射回characterId
    return results.map((result: any) => {
      const character = characters.find(c => c.name === result.characterName)
      return {
        characterId: character?.id || '',
        characterName: result.characterName,
        actions: Array.isArray(result.actions) ? result.actions : [result.action || 'skip'],
        comment: result.comment || undefined,
        message: result.message || undefined,
        reason: result.reason
      }
    })
  } catch (error) {
    console.error('批量AI互动朋友圈失败:', error)
    return []
  }
}

// AI查看朋友圈并决定是否互动（社交版本，考虑其他人的评论）
export const aiInteractWithMomentSocial = async (
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
    // 获取已有评论
    const existingComments = moment.comments.map(c => ({
      userName: c.userName,
      content: c.content
    }))

    const prompt = buildSocialMomentsPrompt(
      characterName,
      characterDescription,
      moment,
      recentChatMessages,
      existingComments
    )
    
    const messages = [
      { role: 'user' as const, content: prompt }
    ]
    
    console.log(`🤖 ${characterName} 正在查看 ${moment.userName} 的朋友圈...`)
    console.log(`📝 聊天上下文: ${recentChatMessages.length} 条消息`)
    console.log(`💬 已有评论: ${existingComments.length} 条`)
    
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

// 当朋友圈有新评论时，触发其他AI查看
export const triggerAIReactToComment = async (
  momentId: string,
  moment: Moment,
  newCommentUserName: string,
  allCharacters: Array<{ id: string, name: string, avatar: string, description: string }>,
  getChatMessages: (characterId: string) => Array<{ role: 'user' | 'assistant', content: string }>,
  likeMoment: (momentId: string, userId: string, userName: string, userAvatar: string) => void,
  addComment: (momentId: string, userId: string, userName: string, userAvatar: string, content: string) => void
) => {
  // 获取所有启用了AI朋友圈功能的角色（排除刚评论的角色）
  // 如果是用户评论了AI的朋友圈，AI本身可以回复
  const enabledCharacters = allCharacters.filter(char => {
    const enabled = localStorage.getItem(`ai_moments_enabled_${char.id}`)
    // 只排除刚评论的角色，不排除发布者（这样AI可以回复自己朋友圈下的评论）
    return enabled === 'true' && char.name !== newCommentUserName
  })
  
  // 获取已有的评论内容，用于去重
  const existingComments = moment.comments.map(c => c.content.toLowerCase().trim())

  if (enabledCharacters.length === 0) {
    console.log('📭 没有其他角色需要查看这条评论')
    return
  }

  console.log(`🔔 ${newCommentUserName} 评论了朋友圈，批量处理 ${enabledCharacters.length} 个AI的决策（只调用1次API）`)

  try {
    // 准备所有角色的数据
    const charactersData = enabledCharacters.map(character => {
      const recentMessages = getChatMessages(character.id)
      return {
        id: character.id,
        name: character.name,
        description: character.description || '',
        recentMessages
      }
    })

    // 批量调用AI（只调用一次API）
    const results = await batchAIInteractWithMoment(charactersData, moment)

    // 处理结果（支持多动作）
    results.forEach(result => {
      const character = enabledCharacters.find(c => c.id === result.characterId)
      if (!character) return

      console.log(`💭 ${result.characterName} 的决定: ${result.actions.join('+')} ${result.reason || ''}`)

      // 处理点赞
      if (result.actions.includes('like')) {
        const hasLiked = moment.likes.some(like => like.userId === result.characterId)
        if (!hasLiked) {
          console.log(`👍 ${result.characterName} 决定点赞，正在执行...`)
          likeMoment(momentId, result.characterId, result.characterName, character.avatar)
          console.log(`✅ ${result.characterName} 点赞成功！`)
          
          // 添加通知
          addMomentNotification({
            type: 'like',
            momentId: momentId,
            momentContent: moment.content,
            fromUserId: result.characterId,
            fromUserName: result.characterName,
            fromUserAvatar: character.avatar
          })
        } else {
          console.log(`⏭️ ${result.characterName} 已经点赞过了`)
        }
      }
      
      // 处理评论
      if (result.actions.includes('comment') && result.comment) {
        const cleanComment = result.comment.replace(/@\S+\s*/g, '').toLowerCase().trim()
        const isDuplicate = existingComments.some(existing => {
          const cleanExisting = existing.replace(/@\S+\s*/g, '').toLowerCase().trim()
          return cleanExisting === cleanComment
        })
        
        if (isDuplicate) {
          console.log(`🔁 ${result.characterName} 的评论与已有评论重复，跳过: ${result.comment}`)
        } else {
          addComment(momentId, result.characterId, result.characterName, character.avatar, result.comment)
          console.log(`💬 ${result.characterName} 回复了: ${result.comment}`)
          existingComments.push(result.comment.toLowerCase().trim())
          
          // 检查是否是回复别人的评论（包含@用户名）
          const mentionMatch = result.comment.match(/@(\S+)/)
          const isReply = !!mentionMatch
          const replyToUser = mentionMatch ? mentionMatch[1] : undefined
          
          // 添加通知
          addMomentNotification({
            type: isReply ? 'reply' : 'comment',
            momentId: momentId,
            momentContent: moment.content,
            fromUserId: result.characterId,
            fromUserName: result.characterName,
            fromUserAvatar: character.avatar,
            comment: result.comment,
            replyToUser: replyToUser
          })
        }
      }
      
      // 处理私信
      if (result.actions.includes('message') && result.message) {
        // 发送私信到聊天记录
        const chatMessages = localStorage.getItem(`chat_messages_${result.characterId}`)
        const messages = chatMessages ? JSON.parse(chatMessages) : []
        const messageContent = {
          id: Date.now() + Math.random(),
          type: 'received',
          content: result.message,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'text',
          blocked: false
        }
        messages.push(messageContent)
        localStorage.setItem(`chat_messages_${result.characterId}`, JSON.stringify(messages))
        console.log(`💬 ${result.characterName} 发送私信: ${result.message}`)
      }
      
      // 跳过
      if (result.actions.includes('skip') || result.actions.length === 0) {
        console.log(`😶 ${result.characterName} 选择跳过`)
      }
    })
  } catch (error) {
    console.error(`❌ 批量AI互动失败:`, error)
  }
}
