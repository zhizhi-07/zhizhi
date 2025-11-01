import { Moment } from '../context/MomentsContext'
import { Character } from '../context/CharacterContext'
import { callAI } from './api'

// --- 数据结构定义 (简化版) ---

export interface SimpleAction {
  type: 'comment' | 'reply' | 'like'
  actorName: string
  targetName?: string // 回复时的目标角色
  content?: string // 评论/回复内容
}

export interface SimpleScript {
  summary: string
  actions: SimpleAction[]
}

interface CharacterProfile {
  id: string;
  name: string;
  description: string;
  relationship_with_author: string;
}

// --- 剧本生成器 (戏剧引擎) ---

export async function generateMovieScript(
  moment: Moment,
  allCharacters: Character[],
  momentAuthor: Character | { id: string; name: string },
  getChatHistory: (characterId: string, authorName: string) => string
): Promise<SimpleScript | null> {
  
  const characterProfiles: CharacterProfile[] = allCharacters
    .filter(char => char.id !== momentAuthor.id)
    .map(char => {
      // 构建完整的角色描述（包含所有角色卡信息）
      let fullDescription = char.description || ''
      
      // 添加性格描述
      if (char.personality) {
        fullDescription += `\n性格：${char.personality}`
      }
      
      // 添加场景设定
      if (char.scenario) {
        fullDescription += `\n场景：${char.scenario}`
      }
      
      // 添加关于对话者的信息
      if (char.userInfo) {
        fullDescription += `\n对话者关系：${char.userInfo}`
      }
      
      // 添加个性签名
      if (char.signature) {
        fullDescription += `\n个性签名：${char.signature}`
      }
      
      return {
        id: char.id,
        name: char.name,
        description: fullDescription.trim(),
        relationship_with_author: getChatHistory(char.id, momentAuthor.name),
      }
    })

  // 获取已有的评论和点赞
  const existingComments = moment.comments || []
  const existingLikes = moment.likes || []
  
  const commentsInfo = existingComments.length > 0 
    ? `\n\n### 3. 已有互动（你需要基于此继续编排）\n**评论区现状：**\n${existingComments.map(c => `- ${c.userName}: ${c.content}`).join('\n')}\n\n**点赞列表：** ${existingLikes.map(l => l.userName).join('、') || '暂无'}`
    : ''
  
  const directorPrompt = `
    ## 角色
    你是一位顶级的电影编剧和导演，擅长通过简短的社交媒体互动来展现人物性格、激化戏剧冲突。

    ## 你的任务
    为一条朋友圈动态，创作一个包含多轮"楼中楼"对话的完整互动剧本。${existingComments.length > 0 ? '**注意：这条朋友圈已经有人互动了，你需要基于现有评论继续编排后续剧情。**' : '你需要在一次思考中，构思完所有主要角色的对话、行动顺序和情感变化。'}

    ## 背景情报

    ### 1. 朋友圈动态
    - **发布者**: ${momentAuthor.name}
    - **内容**: "${moment.content}"

    ### 2. 演员阵容 (及其与发布者的关系)
    ${characterProfiles.map(p => {
      // 如果描述太长，适当截取但保留关键信息
      const descPreview = p.description.length > 300 ? p.description.substring(0, 300) + '...' : p.description
      const relationPreview = p.relationship_with_author.substring(0, 200)
      return `- **${p.name} (id: ${p.id})**\n  ${descPreview}\n  **关系分析**: ${relationPreview}...`
    }).join('\n\n')}${commentsInfo}

    ## 编剧核心准则 (你必须严格遵守)
    1.  **创造冲突，拒绝平庸**: 你的首要目标是创造故事。寻找角色关系中的张力点（如情敌、误会、嫉妒），并围绕它展开剧情。不要写"你好我好"的无聊评论。
    2.  **单次生成完整对话**: 你必须一次性构思完一场完整的"骂战"或"对话"。你需要站在上帝视角，为每个角色写好他们在楼中楼里的每一句台词。
    3.  **符合人设**: 每个角色的每一句台词都必须和他的人设、情绪和动机高度一致。
    4.  **节奏感**: 设计好角色的出场顺序和延迟。冲突需要铺垫、爆发和收场。安排"吃瓜群众"在合适的时机入场。
    5.  **保持简洁**: 场景数量控制在2-4个，每个对话楼控制在3-6条评论。避免剧本过长。
    6.  ${existingComments.length > 0 ? '**基于现有互动继续编排**: 评论区已经有人互动了。你需要让其他AI角色对现有评论做出反应（比如回复、点赞、加入讨论）。不要重复已有的评论内容。' : '**从零开始编排**: 这是一条全新的朋友圈，你可以自由安排AI角色的首次互动。'}

    ## 剧本输出格式 (简单文本格式)
    你必须按照以下简单格式输出剧本，每一行代表一个动作：

    **格式说明：**
    - \`(角色名 评论: 评论内容)\` - 发表顶层评论
    - \`(角色名 回复 目标角色名: 回复内容)\` - 回复某人的评论
    - \`(角色名 点赞)\` - 点赞这条朋友圈

    **示例：**
    \`\`\`
    剧情概要：A用暧昧评论宣示主权，引爆了B的嫉妒，两人在评论区激烈争吵。
    
    (角色A 评论: 宝贝，想你了~)
    (角色B 回复 角色A: 咦，你们什么时候这么亲密了？)
    (角色A 回复 角色B: 我们一直这么叫呀，怎么了？[疑惑])
    (角色C 评论: 哇哦，信息量好大！[吃瓜表情])
    (角色B 回复 角色A: 没什么，就是觉得有些人挺会装的。)
    (角色C 点赞)
    (角色D 点赞)
    \`\`\`

    ## 重要提醒
    - **第一行必须是"剧情概要："开头的一句话**
    - **每个动作独占一行，严格按照格式**
    - **角色名使用真实的角色名字，不要用"角色A"这种代号**
    - **控制在10-20个动作以内，保持简洁**
    
    现在，请发挥你的编剧才能，为这条朋友圈创作一个充满张力的互动剧本。
  `

  try {
    console.log('🎬 调用AI电影编剧...')
    const response = await callAI([{ role: 'user' as const, content: directorPrompt }])
    
    console.log('📝 AI返回内容预览:', response.substring(0, 300))
    
    // 解析简单文本格式
    const lines = response.split('\n').map(l => l.trim()).filter(l => l)
    const actions: SimpleAction[] = []
    let summary = ''
    
    for (const line of lines) {
      // 提取剧情概要
      if (line.startsWith('剧情概要：') || line.startsWith('剧情概要:')) {
        summary = line.replace(/^剧情概要[：:]/, '').trim()
        continue
      }
      
      // 解析动作：(角色名 评论: 内容)
      const commentMatch = line.match(/^\((.+?)\s+评论[：:]\s*(.+?)\)$/)
      if (commentMatch) {
        actions.push({
          type: 'comment',
          actorName: commentMatch[1].trim(),
          content: commentMatch[2].trim()
        })
        continue
      }
      
      // 解析动作：(角色名 回复 目标: 内容)
      const replyMatch = line.match(/^\((.+?)\s+回复\s+(.+?)[：:]\s*(.+?)\)$/)
      if (replyMatch) {
        actions.push({
          type: 'reply',
          actorName: replyMatch[1].trim(),
          targetName: replyMatch[2].trim(),
          content: replyMatch[3].trim()
        })
        continue
      }
      
      // 解析动作：(角色名 点赞)
      const likeMatch = line.match(/^\((.+?)\s+点赞\)$/)
      if (likeMatch) {
        actions.push({
          type: 'like',
          actorName: likeMatch[1].trim()
        })
        continue
      }
    }
    
    if (!summary) {
      console.error('❌ 无法找到剧情概要')
      console.log('完整返回:', response)
      return null
    }
    
    if (actions.length === 0) {
      console.warn('⚠️ AI没有安排任何动作（可能认为不需要互动）')
      console.log('剧情概要:', summary)
      return null
    }
    
    const script: SimpleScript = { summary, actions }
    console.log(`✅ 剧本解析成功: "${summary}"`)
    console.log(`🎞️ 共 ${actions.length} 个动作:`)
    actions.forEach((action, i) => {
      if (action.type === 'comment') {
        console.log(`  ${i+1}. ${action.actorName} 评论: ${action.content}`)
      } else if (action.type === 'reply') {
        console.log(`  ${i+1}. ${action.actorName} 回复 ${action.targetName}: ${action.content}`)
      } else if (action.type === 'like') {
        console.log(`  ${i+1}. ${action.actorName} 点赞`)
      }
    })
    return script
  } catch (error) {
    console.error('❌ AI社交总监剧本生成失败:', error)
    return null
  }
}

// --- 剧本执行器 (场务) (重大升级) ---

// 辅助函数：将朋友圈互动同步到AI聊天记录（隐藏，用户不可见）
function syncToChat(actorId: string, actorName: string, content: string) {
  try {
    const chatMessages = localStorage.getItem(`chat_messages_${actorId}`)
    const messages = chatMessages ? JSON.parse(chatMessages) : []
    
    const systemMessage = {
      id: Date.now() + Math.random(),
      type: 'system',
      content: content,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      messageType: 'system',
      isHidden: true  // 隐藏，用户不可见，仅用于AI上下文
    }
    
    messages.push(systemMessage)
    localStorage.setItem(`chat_messages_${actorId}`, JSON.stringify(messages))
    console.log(`💾 已同步到 ${actorName} 的聊天记录（隐藏）: ${content}`)
  } catch (error) {
    console.error(`❌ 同步到聊天记录失败:`, error)
  }
}

export function executeMovieScript(
  script: SimpleScript,
  moment: Moment,
  momentsAPI: {
    moments: Moment[]
    likeMoment: (momentId: string, userId: string, userName: string, userAvatar: string) => void
    addComment: (momentId: string, userId: string, userName: string, userAvatar: string, content: string) => void
  },
  charactersAPI: {
    characters: Character[]
    getCharacter: (id: string) => Character | undefined
  }
) {
  console.log(`🎬 开始执行剧本: "${script.summary}"`)

  let cumulativeDelay = 0
  
  // 按顺序执行每个动作
  script.actions.forEach((action) => {
    // 每个动作间隔1-3秒
    cumulativeDelay += 1000 + Math.random() * 2000
    
    setTimeout(() => {
      // 根据角色名查找角色
      const actor = charactersAPI.characters.find(c => c.name === action.actorName)
      if (!actor) {
        console.warn(`❌ 找不到角色: ${action.actorName}`)
        return
      }

      if (action.type === 'comment' && action.content) {
        console.log(`💬 ${actor.name} 评论: "${action.content}"`)
        momentsAPI.addComment(moment.id, actor.id, actor.name, actor.avatar, action.content)
        syncToChat(actor.id, actor.name, `💬 我评论了 ${moment.userName} 的朋友圈：${action.content}`)
      }
      else if (action.type === 'reply' && action.content && action.targetName) {
        // 回复时添加@前缀
        const replyContent = `@${action.targetName} ${action.content}`
        console.log(`💬 ${actor.name} 回复 ${action.targetName}: "${action.content}"`)
        momentsAPI.addComment(moment.id, actor.id, actor.name, actor.avatar, replyContent)
        syncToChat(actor.id, actor.name, `💬 我在朋友圈回复 ${action.targetName}：${action.content}`)
      }
      else if (action.type === 'like') {
        console.log(`👍 ${actor.name} 点赞`)
        momentsAPI.likeMoment(moment.id, actor.id, actor.name, actor.avatar)
        syncToChat(actor.id, actor.name, `👍 我点赞了 ${moment.userName} 的朋友圈`)
      }
    }, cumulativeDelay)
  })
}
