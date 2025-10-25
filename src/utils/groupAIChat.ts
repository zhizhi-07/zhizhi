import { callAI } from './api'

interface GroupMember {
  id: string
  name: string
  avatar: string
  type: 'user' | 'character'
  description?: string
}

interface GroupMessage {
  id: number
  groupId: string
  senderId: string
  senderType: 'user' | 'character'
  senderName: string
  content: string
  time: string
  timestamp: number
}

/**
 * AI群聊自由对话系统
 * 让群内的AI成员自由聊天互动
 */

// 生成AI群聊消息
export const generateGroupAIChat = async (
  groupId: string,
  members: GroupMember[],
  recentMessages: GroupMessage[],
  characterDescriptions: Map<string, string>
): Promise<{
  speakerId: string
  speakerName: string
  content: string
  shouldSpeak: boolean
} | null> => {
  try {
    // 获取所有AI成员
    const aiMembers = members.filter(m => m.type === 'character')
    if (aiMembers.length === 0) {
      console.log('❌ 群里没有AI成员')
      return null
    }

    // 构建最近消息历史（最多20条）
    const messageHistory = recentMessages.slice(-20).map(msg => 
      `${msg.senderName}: ${msg.content}`
    ).join('\n')

    // 构建AI成员信息
    const aiMembersInfo = aiMembers.map(member => {
      const desc = characterDescriptions.get(member.id) || '一个AI角色'
      return `- ${member.name}: ${desc.substring(0, 100)}`
    }).join('\n')

    // 获取用户成员
    const userMembers = members.filter(m => m.type === 'user')
    const userInfo = userMembers.map(u => u.name).join('、')

    const now = new Date()
    const currentTime = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const prompt = `你是一个群聊对话协调系统，需要决定哪个AI角色发言。

【群成员】
用户: ${userInfo || '暂无'}
AI成员:
${aiMembersInfo}

【最近消息】
${messageHistory || '（还没有消息）'}

【当前时间】${currentTime}

【任务】
1. 判断是否需要有AI发言（30%概率发言，70%保持安静）
2. 如果要发言，选择一个最合适的AI
3. 这个AI应该说什么

【决策规则】
✅ **应该发言的情况：**
- 有人@了某个AI
- 话题和某个AI的性格相关
- 群里太安静了（最后一条消息超过1分钟）
- 有人提出问题
- 气氛需要调节

❌ **不应该发言的情况：**
- 刚有AI说过话（避免刷屏）
- 话题和AI们都无关
- 用户之间在私聊
- 氛围很尴尬需要冷静

【回复格式】
只输出JSON，不要其他内容：
{
  "shouldSpeak": true/false,
  "speakerId": "角色ID（如果shouldSpeak是true）",
  "speakerName": "角色名字",
  "content": "要说的话（5-30字，自然随意）",
  "reason": "发言理由"
}

示例1（应该发言）：
{
  "shouldSpeak": true,
  "speakerId": "char_123",
  "speakerName": "小雪",
  "content": "哈哈，你们在聊什么呢，我也想参与~",
  "reason": "群里有趣的对话，想加入"
}

示例2（不发言）：
{
  "shouldSpeak": false,
  "speakerId": "",
  "speakerName": "",
  "content": "",
  "reason": "最近刚有AI说过话，不要刷屏"
}

现在请做出决定：`

    console.log('🤖 调用AI决定是否发言...')
    const response = await callAI([{ role: 'user' as const, content: prompt }], 1, 5000)

    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ AI返回格式错误:', response)
      return null
    }

    const result = JSON.parse(jsonMatch[0])
    console.log('💭 AI决定:', result)

    if (!result.shouldSpeak) {
      console.log('😶 AI决定保持安静')
      return null
    }

    return {
      speakerId: result.speakerId,
      speakerName: result.speakerName,
      content: result.content || '...',
      shouldSpeak: true
    }
  } catch (error) {
    console.error('❌ 生成群聊AI消息失败:', error)
    return null
  }
}

// 让指定AI回复群聊消息
export const generateAIReplyInGroup = async (
  characterId: string,
  characterName: string,
  characterDescription: string,
  recentMessages: GroupMessage[],
  members: GroupMember[]
): Promise<string | null> => {
  try {
    // 构建消息历史
    const messageHistory = recentMessages.slice(-15).map(msg =>
      `${msg.senderName}: ${msg.content}`
    ).join('\n')

    // 构建成员列表
    const memberList = members.map(m => m.name).join('、')

    const prompt = `你是 ${characterName}。

【你的性格】
${characterDescription}

【群成员】${memberList}

【最近对话】
${messageHistory}

【要求】
1. 根据最近的对话，以你的性格自然回复
2. 5-30字，像真人聊天一样随意
3. 可以@某人，格式：@用户名 回复内容
4. 不要说教、不要太正经
5. 直接输出回复内容，不要任何前缀

现在回复：`

    const response = await callAI([{ role: 'user' as const, content: prompt }], 1, 3000)
    
    // 清理回复
    let cleaned = response.trim()
    // 移除可能的引号
    cleaned = cleaned.replace(/^["']|["']$/g, '').trim()
    
    console.log(`💬 ${characterName} 说:`, cleaned)
    return cleaned
  } catch (error) {
    console.error(`❌ ${characterName} 回复失败:`, error)
    return null
  }
}
