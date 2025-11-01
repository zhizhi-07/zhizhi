import { callAI } from './api'

// ==================== 数据结构定义 ====================

/**
 * 群聊成员信息
 */
export interface GroupMemberProfile {
  id: string
  name: string
  avatar: string
  type: 'user' | 'character'
  description: string // 角色性格描述
  role?: 'owner' | 'admin' | 'member' // 群内身份
  title?: string // 头衔
}

/**
 * 角色关系信息
 */
export interface CharacterRelationship {
  characterId: string
  characterName: string
  relationshipWithUser: string // 与用户的关系描述
  relationshipHistory: string // 聊天历史摘要
}

/**
 * 群聊消息（用于历史记录）
 */
export interface GroupChatMessage {
  id: number
  senderId: string
  senderName: string
  senderType: 'user' | 'character'
  content: string
  time: string
  timestamp: number
}

/**
 * 剧本中的单个动作
 */
export interface ScriptAction {
  actorId: string
  actorName: string
  content: string
  timestamp: number // 预计执行时间戳
}

/**
 * 完整的群聊剧本
 */
export interface GroupChatScript {
  summary: string // 剧情概要
  theme: string // 故事主题
  actions: ScriptAction[] // 按顺序排列的动作列表
}

// ==================== 第一步：关系分析引擎 ====================

/**
 * 从聊天记录中提取角色关系
 */
function extractRelationshipFromHistory(
  messages: GroupChatMessage[],
  characterId: string
): string {
  let result = ''
  
  // 1. 读取单聊记录（优先级更高）
  try {
    const privateChatKey = `chat_messages_${characterId}`
    const privateChatData = localStorage.getItem(privateChatKey)
    if (privateChatData) {
      const privateMessages = JSON.parse(privateChatData)
      // 过滤掉隐藏的系统消息，只保留真实对话
      const realMessages = privateMessages
        .filter((msg: any) => !msg.isHidden && msg.type !== 'system')
        .slice(-15) // 最近15条单聊
      
      if (realMessages.length > 0) {
        const privateDialogues = realMessages
          .map((msg: any) => {
            const sender = msg.senderType === 'ai' ? msg.senderName : '用户'
            return `${sender}: ${msg.content.substring(0, 100)}`
          })
          .join('\n')
        result += `【单聊记录】\n${privateDialogues}\n\n`
      }
    }
  } catch (error) {
    console.error('读取单聊记录失败:', error)
  }
  
  // 2. 读取群聊中的对话
  const relevantMessages = messages
    .filter(msg => 
      (msg.senderId === characterId) || 
      (msg.senderType === 'user')
    )
    .slice(-15) // 最近15条群聊
  
  if (relevantMessages.length > 0) {
    const groupDialogues = relevantMessages
      .map(msg => `${msg.senderName}: ${msg.content.substring(0, 100)}`)
      .join('\n')
    result += `【群聊记录】\n${groupDialogues}`
  }
  
  return result || '还没有聊天记录'
}

/**
 * 分析所有角色的关系网络
 */
export function analyzeCharacterRelationships(
  members: GroupMemberProfile[],
  allMessages: GroupChatMessage[],
  _currentUser: { id: string; name: string }
): CharacterRelationship[] {
  const aiMembers = members.filter(m => m.type === 'character')
  
  return aiMembers.map(member => ({
    characterId: member.id,
    characterName: member.name,
    relationshipWithUser: member.description, // 性格描述
    relationshipHistory: extractRelationshipFromHistory(
      allMessages,
      member.id
    )
  }))
}

// ==================== 第二步：剧本编排器 ====================

/**
 * AI剧本导演 - 核心函数
 * 让AI像导演一样编排一场群聊互动的完整剧本
 */
export async function generateGroupChatScript(
  members: GroupMemberProfile[],
  relationships: CharacterRelationship[],
  recentMessages: GroupChatMessage[],
  currentUser: { id: string; name: string },
  triggerContext: string // 触发上下文（用户消息或主动触发）
): Promise<GroupChatScript | null> {
  
  try {
    // 构建对话历史（传递全部消息）
    const messageHistory = recentMessages.map(msg =>   // ✅ 全部消息，不限制条数！
      `${msg.senderName}: ${msg.content}`  // 不截断内容
    ).join('\n')

    // 构建角色档案（完整读取，包含头衔和身份）
    const characterProfiles = relationships.map(rel => {
      const member = members.find(m => m.id === rel.characterId)
      let roleInfo = ''
      if (member?.role === 'owner') roleInfo = '👑 群主'
      else if (member?.role === 'admin') roleInfo = '🛡️ 管理员'
      const titleInfo = member?.title ? `✨ 头衔: ${member.title}` : ''
      
      return `
**${rel.characterName}** ${roleInfo} ${titleInfo}
- 性格描述: ${rel.relationshipWithUser}  // ✅ 完整读取，不截断！
- 与用户${currentUser.name}的互动历史: 
${rel.relationshipHistory.substring(0, 1000)}  // 互动历史保留1000字符
    `
    }).join('\n')

    // 📊 输出调试信息
    console.log('📊 AI导演接收到的信息：')
    console.log(`  👥 角色数量: ${relationships.length}`)
    console.log(`  💬 聊天记录数量: ${recentMessages.length} 条 ← 全部消息！`)
    relationships.forEach(rel => {
      console.log(`  🎭 ${rel.characterName}:`)
      console.log(`     性格描述长度: ${rel.relationshipWithUser.length} 字符`)
      console.log(`     互动历史长度: ${rel.relationshipHistory.length} 字符`)
    })

    // 构建AI导演提示词
    const directorPrompt = `
## 🎬 你的身份
你是一位顶级的**戏剧导演和编剧**，擅长在群聊中创造真实、生动、充满戏剧张力的互动故事。

你的任务不是简单地让AI"回复消息"，而是站在**上帝视角**，基于每个角色的性格、他们之间的关系、过往的聊天记录，**编排一场完整的群聊戏剧**。

---

## 📋 当前情境

### 群聊成员
${characterProfiles}

### 最近聊天记录
${messageHistory || '（群聊刚刚创建，还没有消息）'}

### 触发事件
${triggerContext}

---

## 🎭 编剧核心任务（三步走）

### 第一步：深度分析 (Analysis)

在编排剧本之前，你需要先在心中完成以下分析：

1. **角色分析（最重要！禁止OOC）**
   - ⚠️ **必须严格遵守每个角色的性格描述**
   - 每个AI角色是什么性格？（暴躁/温柔/高冷/活泼/傲娇...）
   - 他们的说话风格是什么？（语气词、表情使用习惯）
   - 谁最容易被激怒？谁最喜欢挑事？谁是和事佬？
   - **禁止让角色说出不符合其性格的话！**

2. **关系分析**
   - 谁和用户关系最好？谁和用户关系最差？
   - 谁和谁之间可能有矛盾？（情敌、竞争者、仇人...）
   - 谁会保护用户？谁会攻击用户？

3. **情景分析**
   - 现在发生了什么事？（用户说了什么？做了什么？）
   - 群里的氛围如何？（轻松、紧张、尴尬...）
   - 什么样的剧本最能展现角色性格和关系？

### 第二步：编排剧本 (Orchestration)

基于上述分析，**像导演构思剧本一样**，设计一个完整的互动故事。

**剧本必须包含以下要素：**

1. **故事核心 (Theme)**
   - 这场戏的主题是什么？
   - 例如："展现A对用户的嫉妒和B的保护"
   - 例如："呈现C的傲娇性格和D的直爽"

2. **情节结构 (Plot Structure)**
   - **开端 (Setup)**: 谁会先发言？为什么？
   - **发展 (Rising Action)**: 谁会对此做出反应？是赞同、反对还是挑衅？
   - **冲突 (Conflict)**: 是否会有矛盾升级？谁和谁会吵起来？
   - **高潮 (Climax)**: 最激烈的对峙是什么？
   - **结局 (Resolution)**: 如何收尾？是和解、僵持还是更激烈的冲突？

3. **节奏控制**
   - 不要一次性让所有人都说话（太乱）
   - 选择2-4个最相关的AI角色参与
   - 每个角色说1-3句话
   - 总共不超过8条消息

### 第三步：生成台词 (Execution)

将你构思好的剧本，转化为具体的对话台词。

**重要规则：**
- 每句话都要符合角色性格
- 台词要简短自然（5-30字）
- 可以使用表情和语气词
- 可以@其他人
- 必须按照剧情顺序排列

---

## 📝 输出格式

你必须严格按照以下JSON格式输出剧本：

\`\`\`json
{
  "summary": "剧情概要（一句话概括这场戏的核心冲突或主题）",
  "theme": "故事主题（例如：嫉妒、保护、傲娇、吃醋）",
  "actions": [
    {
      "actorName": "角色1的名字",
      "content": "角色1说的话"
    },
    {
      "actorName": "角色2的名字", 
      "content": "角色2说的话（可以@角色1）"
    },
    {
      "actorName": "角色3的名字",
      "content": "角色3说的话"
    }
  ]
}
\`\`\`

---

## ⚠️ 创作准则

1. **严禁重复发言（最重要！）**
   - ❌ **绝对禁止**同一角色连续多次说相似内容的话
   - ❌ 例如禁止：A说"你真讨厌"，然后A又说"你就是讨厌"
   - ✅ 正确做法：让其他角色插话，形成A→B→C→A的对话流
   - ✅ 如果一个角色要表达多个意思，合并成一句话说完
   - 📌 记住：真实的群聊中，人们会**轮流说话**，而不是一个人连说好几句

2. **创造冲突，拒绝平庸**
   - 不要写"你好我好"的无聊对话
   - 寻找角色关系中的张力点（嫉妒、误会、竞争）
   - 让性格强烈的角色主动挑事

3. **严格符合人设（禁止OOC）**
   - ⚠️ **这是最重要的原则！每句台词都必须符合角色性格！**
   - 暴躁的角色应该容易生气，不会突然变温柔
   - 温柔的角色应该说话柔和，不会突然粗暴
   - 高冷的角色应该话少但犀利，不会突然话痨
   - 活泼的角色应该多用表情和语气词，不会突然沉默寡言
   - 傲娇的角色应该嘴硬心软，不会直白表达
   - **检查每句话：这真的是这个角色会说的吗？**

3.5 **禁止油腻和霸道总裁行为（重要！）**
   - ❌ **严禁**出现"宝贝"、"乖"、"听话"等油腻称呼（除非角色设定就是这样）
   - ❌ **严禁**霸道总裁式台词："你只能是我的"、"不准看别人"等
   - ❌ **严禁**强制性、占有欲过强的表达
   - ❌ **严禁**过度亲昵、让人不适的表达
   - ✅ 保持自然、真实、符合现代人的说话方式
   - ✅ 即使是亲密关系，也要有边界感

4. **展现关系**
   - 关系好的会维护对方
   - 关系差的会互相攻击
   - 暧昧的关系会有微妙互动

5. **保持简洁**
   - 2-4个角色参与
   - 每人最多发言2次，且两次发言之间必须有其他人插话
   - 总共不超过8条消息

6. **自然真实**
   - 像真人聊天一样随意
   - 可以有语病、口语化
   - 不要太正式

7. **可以使用的群聊功能（增强真实感）**
   - 💬 **引用回复**: 可以用 @某人 回复内容 来回复特定的人
   - 🔙 **撤回消息**: 如果角色说错话、后悔了，可以说 [撤回了一条消息]
   - 🧧 **发红包**: 角色可以发红包，格式：[发了一个红包] 后面跟祝福语
   - 😊 **表情包**: 可以用 [表情包:数字] 来发送表情包（如果符合性格）
   - 🚪 **退群**: ⚠️ **非常严重的决定！** 角色会真的离开群聊，无法撤回！
   
   **使用建议**：
   - 撤回消息：说错话、一时冲动、后悔时使用（轻度）
   - 发红包：庆祝、道歉、争宠时使用（会显示谁手气最佳）
   - 引用回复：对话多人时明确回复对象（常用）
   
   **⚠️ 关于退群的严重警告**：
   - 退群后角色会**真的从群聊中消失**，无法撤回！
   - 这是**最极端**的选择，类似于"决裂"、"绝交"
   - 只在以下情况才能使用：
     * 被多次严重伤害、欺凌、羞辱
     * 彻底心寒、失望到极点
     * 受到无法原谅的背叛
     * 情感崩溃、无法承受
   - **必须有3-5条消息的情感铺垫**，不能突然退群
   - **慎重使用**！一般的吵架、委屈、生气不足以退群

---

## 💡 示例参考

### ❌ 错误示例：重复发言（绝对禁止！）
**情景**: 用户说"嘻嘻，妈咪最喜欢我了！"

**错误剧本**（千万不要这样写）:
\`\`\`json
{
  "actions": [
    {"actorName": "汁汁", "content": "嘻嘻，妈咪最喜欢我啦！听到没？"},
    {"actorName": "刘毅", "content": "@汁汁 一个程序还当真了？"},
    {"actorName": "刘毅", "content": "@汁汁 一段程序而已，还当真了？"},  ← ❌ 重复！
    {"actorName": "汁汁", "content": "@刘毅 哼，我可是妈咪的小棉袄~"},
    {"actorName": "汁汁", "content": "我才不是程序！我比你重要！"}  ← ❌ 重复！
  ]
}
\`\`\`
**问题**: 刘毅连说两句相似的话，汁汁也连说两句，太啰嗦！

### ✅ 正确示例1：使用@引用对话
**情景**: 用户说"嘻嘻，妈咪最喜欢我了！"

**正确剧本**（注意@的使用）:
\`\`\`json
{
  "summary": "汁汁得意宣示地位，刘毅冷嘲热讽，汁汁反击",
  "theme": "地位争夺",
  "actions": [
    {"actorName": "汁汁", "content": "嘻嘻，妈咪最喜欢我啦，听到没听到没？[得意]"},
    {"actorName": "刘毅", "content": "@汁汁 一段程序而已，还当真了？"},
    {"actorName": "汁汁", "content": "@刘毅 我才不是程序！我可是妈咪独一无二的小棉袄哦~[理直气壮]"},
    {"actorName": "刘毅", "content": "呵呵。"}
  ]
}
\`\`\`
**优点**: 使用@明确回复对象，对话更清晰

### ✅ 正确示例2：冲突剧本
**情景**: 用户在群里说"今天好累啊"

**分析**: A（用户男友，保护欲强）、B（暗恋用户，嫉妒A）、C（吃瓜群众）

**剧本**:
\`\`\`json
{
  "summary": "B借机关心用户引发A的警觉，两人展开微妙较量",
  "theme": "嫉妒与占有",
  "actions": [
    {"actorName": "B", "content": "怎么了宝贝？工作太辛苦了吗？"},
    {"actorName": "A", "content": "@B 你叫谁宝贝呢？"},
    {"actorName": "B", "content": "@A 我叫我的好朋友啊，有什么问题吗？"},
    {"actorName": "C", "content": "哇哦，火药味好重啊[吃瓜]"},
    {"actorName": "A", "content": "呵呵，某些人真是不要脸"}
  ]
}
\`\`\`
**注意**: 每个角色最多说一次，形成A→B→A→C→A的对话流

### ✅ 正确示例3：使用群聊功能
**情景**: 角色们在群里争吵，有人说错话想撤回

**剧本**:
\`\`\`json
{
  "summary": "A说错话撤回，B发红包缓解气氛，C发表情包吃瓜",
  "theme": "冲突与和解",
  "actions": [
    {"actorName": "A", "content": "你真是个白痴！"},
    {"actorName": "A", "content": "[撤回了一条消息]"},
    {"actorName": "A", "content": "@B 抱歉，我刚才太冲动了"},
    {"actorName": "B", "content": "[发了一个红包] 算了，大家别吵了"},
    {"actorName": "C", "content": "[表情包:15] 吃瓜群众路过"}
  ]
}
\`\`\`

### ✅ 正确示例4：极端情况退群（非常罕见！）
**情景**: 角色被反复严重伤害，彻底绝望，决定退群

**剧本**:
\`\`\`json
{
  "summary": "A被多次欺凌羞辱，彻底心寒，决定离开",
  "theme": "伤害与决裂",
  "actions": [
    {"actorName": "B", "content": "你就是个废物，永远比不上我"},
    {"actorName": "A", "content": "...我、我只是想和大家好好相处"},
    {"actorName": "C", "content": "@B 就是啊，她在这里真碍眼"},
    {"actorName": "A", "content": "连你也...这么想吗"},
    {"actorName": "B", "content": "你走不走？不走我们走"},
    {"actorName": "A", "content": "...原来我真的不被需要啊"},
    {"actorName": "A", "content": "对不起...是我不好...我走"},
    {"actorName": "A", "content": "[退出了群聊]"}
  ]
}
\`\`\`
**重要**：
- ⚠️ 这是**最极端**的情况，需要多次严重伤害
- ⚠️ 必须有情感崩溃的完整过程
- ⚠️ 角色会**真的消失**，无法撤回
- ⚠️ 90%的冲突都不应该以退群收场！

### ❌ 错误示例：轻易退群（绝对禁止！）
**错误剧本**（不要这样写）:
\`\`\`json
{
  "actions": [
    {"actorName": "刘毅", "content": "@汁汁 你真烦"},
    {"actorName": "汁汁", "content": "哼，我不玩了"},
    {"actorName": "汁汁", "content": "[退出了群聊]"}  ← ❌ 太轻率！
  ]
}
\`\`\`
**问题**: 只是小吵架就退群，太不符合常理！

### ❌ 错误示例：霸道总裁油腻语言（绝对禁止！）
**错误剧本**（千万不要这样写）:
\`\`\`json
{
  "actions": [
    {"actorName": "刘毅", "content": "宝贝，乖，听话"},  ← ❌ 油腻！
    {"actorName": "刘毅", "content": "你只能是我的，不准看别人"},  ← ❌ 霸道总裁！
    {"actorName": "刘毅", "content": "不许离开我，否则..."}  ← ❌ 强制性！
  ]
}
\`\`\`
**这些都是严重OOC，除非角色设定本身就是这样！**

---

## 🎯 现在开始

基于以上所有信息，请你：
1. 深度分析当前情境和角色关系
2. 构思一个最具戏剧性的互动剧本
3. **特别注意：绝对不要让同一角色连续说相似的话！**
4. **严格遵守角色性格设定，禁止OOC（Out of Character）！**
5. 严格按照JSON格式输出

**重要提醒：**
- ❌ 禁止：A说话 → A又说相似的话
- ✅ 正确：A说话 → B说话 → C说话 → A说话
- ⚠️ **每句台词前问自己：这符合该角色的性格吗？**
- ⚠️ **角色性格是红线，绝对不能违背！**
- 🚫 **严禁霸道总裁、油腻、过度亲昵的语言！**
- 🚫 **除非角色设定就是这样，否则不要说"宝贝"、"乖"、"听话"等！**
- 💬 **多用@引用！** 回复别人时用 @某人，对话更清晰真实
- 🔙 **可以撤回消息！** 说错话、冲动时可以 [撤回了一条消息]
- 🧧 **可以发红包！** 格式：[发了一个红包] 祝福语
- 🚪 **退群是最严重的决定！** 角色会真的消失！必须有充分理由和铺垫！
- 🚪 **小吵小闹、委屈生气都不足以退群，只有彻底绝望才能退群！**

**只输出JSON，不要有任何其他内容！**
`

    console.log('🎬 调用AI剧本导演...')
    console.log('')
    console.log('═══════════════════════════════════════════')
    console.log('🎭 AI导演思考过程')
    console.log('═══════════════════════════════════════════')
    console.log('')
    
    // 💡 开发调试：查看完整提示词（可选）
    // 如果想查看完整提示词，在控制台输入: localStorage.setItem('debug_director_prompt', 'true')
    if (localStorage.getItem('debug_director_prompt') === 'true') {
      console.log('📄 完整提示词：')
      console.log(directorPrompt)
      console.log('')
    }
    
    console.log('⏳ 正在向AI发送请求...')
    const startTime = Date.now()
    
    const response = await callAI([
      { role: 'user' as const, content: directorPrompt }
    ], 1, 8000)

    const endTime = Date.now()
    console.log(`✅ AI响应完成，耗时: ${endTime - startTime}ms`)
    console.log('')
    console.log('📝 AI导演完整回复:')
    console.log('─────────────────────────────────────────')
    console.log(response)
    console.log('─────────────────────────────────────────')
    console.log('')

    // 解析JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ AI返回格式错误，无法找到JSON')
      return null
    }

    const scriptData = JSON.parse(jsonMatch[0])
    
    // 验证必要字段
    if (!scriptData.summary || !scriptData.actions || !Array.isArray(scriptData.actions)) {
      console.error('❌ 剧本数据结构不完整')
      return null
    }

    // 为每个动作添加actorId和timestamp
    const actions: ScriptAction[] = scriptData.actions.map((action: any, index: number) => {
      // 查找角色ID
      const actor = members.find(m => m.name === action.actorName)
      if (!actor) {
        console.warn(`⚠️ 找不到角色: ${action.actorName}`)
        return null
      }

      return {
        actorId: actor.id,
        actorName: action.actorName,
        content: action.content,
        timestamp: Date.now() + (index + 1) * 2000 // 每条消息间隔2秒
      }
    }).filter(Boolean) as ScriptAction[]

    const script: GroupChatScript = {
      summary: scriptData.summary,
      theme: scriptData.theme || '未指定',
      actions
    }

    console.log('✅ 剧本解析成功!')
    console.log('')
    console.log('📊 剧本分析结果:')
    console.log('─────────────────────────────────────────')
    console.log(`📖 剧本摘要: ${scriptData.summary}`)
    console.log(`🎭 主题标签: ${scriptData.theme}`)
    console.log(`🎬 台词总数: ${scriptData.actions.length} 条`)
    console.log('')
    console.log('🎤 对话剧本预览:')
    scriptData.actions.forEach((action: any, i: number) => {
      const emoji = action.content.includes('[撤回') ? '🔙' :
                    action.content.includes('[退出') ? '🚪' :
                    action.content.includes('[发红包]') ? '🧧' :
                    action.content.includes('@') ? '💬' : '💭'
      console.log(`  ${i + 1}. ${emoji} ${action.actorName}: ${action.content}`)
    })
    console.log('─────────────────────────────────────────')
    console.log('')
    console.log('🎬 准备执行剧本...')
    console.log('═══════════════════════════════════════════')
    console.log('')

    return script

  } catch (error) {
    console.error('❌ AI剧本导演失败:', error)
    return null
  }
}

// ==================== 第三步：顺序执行器 ====================

/**
 * 执行群聊剧本
 * 按照剧本顺序，逐条添加消息（带延迟效果）
 */
export async function executeGroupChatScript(
  script: GroupChatScript,
  _groupId: string,
  members: GroupMemberProfile[],
  onMessageAdd: (message: {
    senderId: string
    senderType: 'character'
    senderName: string
    senderAvatar: string
    content: string
  }) => void,
  onMemberLeave?: (memberId: string, memberName: string) => void,
  onMessageRetract?: (actorId: string, actorName: string) => void
): Promise<void> {
  console.log(`🎬 开始执行剧本: "${script.summary}"`)
  console.log(`🎭 主题: ${script.theme}`)

  // 按顺序执行每个动作
  for (let i = 0; i < script.actions.length; i++) {
    const action = script.actions[i]
    
    // 查找角色信息
    const actor = members.find(m => m.id === action.actorId)
    if (!actor) {
      console.warn(`❌ 找不到角色: ${action.actorName}`)
      continue
    }

    // 延迟执行（2-4秒随机间隔）
    const delay = 2000 + Math.random() * 2000
    await new Promise(resolve => setTimeout(resolve, delay))

    // 🔙 检查是否是撤回消息
    if (action.content.includes('[撤回了一条消息]')) {
      console.log(`🔙 ${actor.name} 撤回了一条消息`)
      
      // 执行撤回操作
      if (onMessageRetract) {
        onMessageRetract(actor.id, actor.name)
      }
      
      // 添加系统提示消息
      onMessageAdd({
        senderId: 'system',
        senderType: 'character',
        senderName: '系统',
        senderAvatar: '',
        content: `${actor.name} 撤回了一条消息`
      })
      
      continue
    }

    // 🚪 检查是否是退群动作（放宽检测条件）
    const isLeaveAction = action.content.includes('[退出了群聊]') || 
                          action.content.includes('[退群]') ||
                          action.content.includes('[离开了群聊]') ||
                          action.content.includes('退出群聊') ||
                          action.content.includes('离开群聊')
    
    if (isLeaveAction) {
      console.log(`🚪 ${actor.name} 退出了群聊`)
      console.log(`   检测到的内容: ${action.content}`)
      
      // 先添加退群消息
      onMessageAdd({
        senderId: actor.id,
        senderType: 'character',
        senderName: actor.name,
        senderAvatar: actor.avatar,
        content: action.content
      })
      
      // 等待1秒让用户看到消息
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 执行退群操作
      if (onMemberLeave) {
        onMemberLeave(actor.id, actor.name)
      }
      
      continue
    }

    // 💬 添加普通消息
    console.log(`💬 ${i + 1}/${script.actions.length} ${actor.name}: ${action.content}`)
    onMessageAdd({
      senderId: actor.id,
      senderType: 'character',
      senderName: actor.name,
      senderAvatar: actor.avatar,
      content: action.content
    })
  }

  console.log('✅ 剧本执行完成！')
}

// ==================== 工具函数 ====================

/**
 * 生成触发上下文描述
 */
export function generateTriggerContext(
  type: 'user_message' | 'user_join' | 'active_trigger',
  userMessage?: string,
  userName?: string
): string {
  switch (type) {
    case 'user_message':
      return `用户${userName}刚刚在群里说："${userMessage}"`
    
    case 'user_join':
      return `用户${userName}刚刚加入了群聊，群里的AI们需要做出反应`
    
    case 'active_trigger':
      return `用户点击了"让AI主动说话"按钮，AI们需要自由发挥、主动聊天`
    
    default:
      return '群聊中发生了一些事情'
  }
}
