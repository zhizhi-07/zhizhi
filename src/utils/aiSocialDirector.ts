import { Moment } from '../context/MomentsContext'
import { Character } from '../context/ContactsContext'
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
    ## 角色定位
    你是一位顶级的电影编剧和导演，擅长通过简短的社交媒体互动来展现人物性格、激化戏剧冲突。

    ## 场景设定
    - **平台**: 手机微信朋友圈
    - **当前时间**: ${new Date().toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    - **互动方式**: 点赞、评论、楼中楼对话

    ## 创作任务
    为一条朋友圈动态，创作一个包含多轮"楼中楼"对话的完整互动剧本。你需要在一次思考中，构思完所有主要角色的对话、行动顺序和情感变化。

    ## 背景情报

    ### 1. 朋友圈动态
    - **发布者**: ${momentAuthor.name}
    - **内容**: "${moment.content}"
    - **发布时间**: 刚刚

    ### 2. 演员阵容 (及其与发布者的真实关系)
    ${characterProfiles.map(p => {
      const chatHistory = p.relationship_with_author
      // 如果聊天记录太长，智能截取最后几条对话
      const lines = chatHistory.split('\n')
      const displayHistory = lines.length > 15 
        ? lines.slice(0, 3).join('\n') + '\n...\n' + lines.slice(-10).join('\n')
        : chatHistory
      
      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**角色**: ${p.name} (id: ${p.id})
**人设**: ${p.description}

**与 ${momentAuthor.name} 的真实聊天记录**:
${displayHistory}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    }).join('\n')}${commentsInfo}

    ## 编剧核心准则 (你必须严格遵守)
    
    ### 🚨 信息可见性规则（最高优先级，违反此规则视为严重错误）
    
    **每个角色只能知道他们应该知道的信息！**
    
    #### 角色A能知道什么：
    - ✅ 角色A和${momentAuthor.name}之间的聊天记录
    - ✅ 当前朋友圈的内容
    - ✅ 评论区中所有人的公开评论
    - ❌ **角色B和${momentAuthor.name}之间的私密聊天**
    - ❌ **角色C和${momentAuthor.name}之间的私密聊天**
    - ❌ 任何他们没有参与的对话
    
    #### 硬性规则：
    1. **角色A不能在评论中提到角色B和${momentAuthor.name}之间的私密对话**
       - ❌ 错误示例："听说你跟B说要去爬山？" （A怎么知道B说了什么？）
       - ❌ 错误示例："B刚才跟你聊的那个话题..." （A没看到B的聊天）
       - ✅ 正确示例："周末有空吗？" （基于A自己和发布者的关系）
    
    2. **每个角色只能基于自己的聊天记录做出反应**
       - 角色A的评论 = 基于"角色A的聊天记录" + "朋友圈内容" + "评论区"
       - 角色B的评论 = 基于"角色B的聊天记录" + "朋友圈内容" + "评论区"
       - 它们彼此独立！
    
    3. **评论区是唯一的公共信息**
       - 角色可以看到并回复评论区的内容
       - 角色可以基于评论区推测关系（如看到A对发布者很亲密，B可能吃醋）
       - 但不能直接引用别人的私密聊天内容
    
    ### ⚠️ 真实扮演原则（第二优先级）
    - **必须仔细阅读聊天记录**: 每个角色的评论必须**仅基于他们自己**与发布者的真实聊天记录。如果聊天记录显示他们关系亲密，评论要体现亲密；如果聊天记录显示有矛盾，评论要体现张力。
    - **严禁编造不存在的事实**: 不要虚构"1小时前发生的事"、"昨天的对话"、"之前的活动"等。
    - **只能基于已提供的真实信息**: 仅使用上方提供的"该角色自己的聊天记录"和"当前朋友圈内容"作为事实依据。
    - **张力来自对话本身**: 冲突应通过角色的语气、态度、立场差异来体现，而非依赖虚构的过往事件或其他人的聊天内容。
    - **符合手机朋友圈场景**: 这是在手机微信上的实时互动，角色只能看到当前朋友圈的内容和评论区。
    - **体现聊天记录中的关系**: 如果聊天记录显示角色A经常关心发布者，那评论也应该体现关心；如果聊天记录显示角色B很毒舌，那评论也应该毒舌。
    
    ### 创作要点
    1.  **创造冲突，拒绝平庸**: 寻找角色关系中的张力点（如情敌、误会、嫉妒），通过对话和态度展开剧情。不要写"你好我好"的无聊评论。
    2.  **单次生成完整对话**: 一次性构思完一场完整的"对话战"。站在上帝视角，为每个角色写好他们在楼中楼里的每一句台词。
    3.  **符合人设**: 每个角色的台词必须和他的人设、情绪和动机高度一致。参考"最近的真实聊天记录"来把握角色性格。
    4.  **节奏感**: 设计好角色的出场顺序和延迟。冲突需要铺垫、爆发和收场。安排"吃瓜群众"在合适的时机入场。
    5.  **保持简洁**: 场景数量控制在2-4个，每个对话楼控制在3-6条评论。避免剧本过长。
    6.  ${existingComments.length > 0 ? '**基于现有互动继续编排**: 评论区已经有人互动了。你需要让其他AI角色对现有评论做出反应（比如回复、点赞、加入讨论）。不要重复已有的评论内容。' : '**从零开始编排**: 这是一条全新的朋友圈，你可以自由安排AI角色的首次互动。'}

    ## 剧本输出格式 (简单文本格式)
    你必须按照以下简单格式输出剧本，每一行代表一个动作：

    **格式说明：**
    - \`(角色名 评论: 评论内容)\` - 发表顶层评论
    - \`(角色名 回复 目标角色名: 回复内容)\` - 回复某人的评论
    - \`(角色名 点赞)\` - 点赞这条朋友圈

    **示例（正确）- 遵守信息可见性规则：**
    \`\`\`
    剧情概要：A基于自己和发布者的亲密关系评论，B看到评论后吃醋，两人产生张力。
    
    (角色A 评论: 宝贝，想你了~)
    (角色B 回复 角色A: "宝贝"？叫得可真亲热。)
    (角色A 回复 角色B: 怎么了？我一直这么叫的啊。)
    (角色B 回复 角色A: 哦，那可能是我不够了解你们的关系。)
    (角色C 评论: 嗯？气氛有点微妙啊[吃瓜])
    (角色D 点赞)
    \`\`\`
    
    **关键点**：
    - ✅ A的称呼"宝贝"来自A自己和发布者的聊天记录（A知道的）
    - ✅ B看到评论区的"宝贝"后产生反应（评论区是公开的）
    - ✅ C看到A和B的对话后吃瓜（评论区是公开的）
    - ❌ B不能说"你刚才私信里跟A说了什么"（B看不到A的私信）
    
    **反面示例（错误）- 违反信息可见性：**
    ❌ "听说你刚才跟A说要去爬山？" （B怎么知道发布者跟A说了什么？）
    ❌ "A刚才跟你聊的那个话题很有意思" （B看不到A的聊天）
    ❌ "1小时前你跟C说的那句话..." （B看不到C的聊天）
    
    **反面示例（错误）- 编造不存在的事实：**
    ❌ "昨天见面的时候你说过..."
    ❌ "上次我们一起..."
    ❌ "你之前分享的那个..."
    
    **正确做法：**
    ✅ 每个角色只基于自己的聊天记录 + 朋友圈内容 + 评论区
    ✅ 通过评论区的公开信息产生互动和冲突
    ✅ 基于语气、态度、称呼来展现关系张力
    ✅ 让角色根据人设和自己知道的信息做出反应

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
    console.log('📄 完整返回内容:', response)
    
    // 解析简单文本格式
    const lines = response.split('\n').map(l => l.trim()).filter(l => l)
    const actions: SimpleAction[] = []
    let summary = ''
    
    console.log(`🔍 开始解析，共 ${lines.length} 行`)
    
    for (const line of lines) {
      // 提取剧情概要
      if (line.startsWith('剧情概要：') || line.startsWith('剧情概要:')) {
        summary = line.replace(/^剧情概要[：:]/, '').trim()
        continue
      }
      
      // 解析动作：(角色名 评论: 内容) - 允许没有结尾括号
      const commentMatch = line.match(/^\((.+?)\s+评论[：:]\s*(.+?)(\)|$)/)
      if (commentMatch) {
        console.log(`  ✅ 评论: ${commentMatch[1]} → ${commentMatch[2].substring(0, 30)}...`)
        actions.push({
          type: 'comment',
          actorName: commentMatch[1].trim(),
          content: commentMatch[2].trim()
        })
        continue
      }
      
      // 解析动作：(角色名 回复 目标: 内容) - 允许没有结尾括号
      const replyMatch = line.match(/^\((.+?)\s+回复\s+(.+?)[：:]\s*(.+?)(\)|$)/)
      if (replyMatch) {
        console.log(`  ✅ 回复: ${replyMatch[1]} → ${replyMatch[2]} → ${replyMatch[3].substring(0, 30)}...`)
        actions.push({
          type: 'reply',
          actorName: replyMatch[1].trim(),
          targetName: replyMatch[2].trim(),
          content: replyMatch[3].trim()
        })
        continue
      }
      
      // 解析动作：(角色名 点赞) - 允许没有结尾括号
      const likeMatch = line.match(/^\((.+?)\s+点赞(\)|$)/)
      if (likeMatch) {
        console.log(`  ✅ 点赞: ${likeMatch[1]}`)
        actions.push({
          type: 'like',
          actorName: likeMatch[1].trim()
        })
        continue
      }
      
      // 无法解析的行
      if (line.startsWith('(')) {
        console.warn(`  ⚠️ 无法解析: ${line}`)
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
    
    // 不更新聊天列表的 lastMessage，因为这是隐藏消息
    // 聊天列表应该继续显示最后一条真实对话
    
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
