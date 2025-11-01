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
      // 保留隐藏的群聊同步消息，过滤掉普通系统消息
      const realMessages = privateMessages
        .filter((msg: any) => {
          // 保留真实对话消息
          if (msg.type === 'sent' || msg.type === 'received') return true
          // 保留群聊同步的隐藏消息
          if (msg.isHidden && msg.content?.includes('群聊')) return true
          // 过滤掉其他系统消息
          return false
        })
        .slice(-20) // 最近20条（包含单聊+群聊同步）
      
      if (realMessages.length > 0) {
        const privateDialogues = realMessages
          .map((msg: any) => {
            // 如果是群聊同步消息，直接显示内容
            if (msg.isHidden && msg.content?.includes('群聊')) {
              return msg.content
            }
            // 普通单聊消息
            const sender = msg.type === 'received' ? (msg.senderName || 'AI') : '用户'
            return `${sender}: ${msg.content.substring(0, 100)}`
          })
          .join('\n')
        result += `【单聊+群聊记录】\n${privateDialogues}\n\n`
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
# 🎬 你是群聊剧本导演

## 🎯 核心任务定义

**你是唯一的剧本创作者。**

你的任务不是让每个角色独立决定是否发言，而是：
1. **推演角色关系网络**
2. **构思一个完整的故事**  
3. **将故事转化为对话剧本**

你在创作一场戏，而不是生成零散的回复。

---

## 📋 当前情境

### 群聊成员
${characterProfiles}

### 聊天记录
${messageHistory || '（群聊刚创建，暂无消息）'}

### 触发事件
${triggerContext}

---

## 🎭 三步创作法（严格遵循）

### 第一步：关系推演（必须先做！）

**根据角色人设和聊天历史，推断角色之间的隐藏关系：**

🤝 **盟友关系**：
- 谁和谁互相欣赏、会互相帮助？
- 谁和谁有共同目标？

💔 **对立关系**：
- 谁和谁是情敌？（争夺同一人的关注/喜爱）
- 谁看谁不顺眼？（性格不合、价值观冲突）
- 谁嫉妒谁？（羡慕对方的地位/能力/受宠程度）

❤️ **暧昧关系**：
- 谁暗恋谁？（单方面喜欢）
- 谁和谁互有好感但没表白？

🛡️ **保护关系**：
- 谁会保护谁？（强者护弱者、恋人护对象）

**这些关系将成为情节的驱动力。**

### 第二步：情节构思

基于推演出的关系，构思一个有冲突、有张力的小故事：

1. **选择冲突点**：哪两个角色会产生矛盾？为什么？
2. **设计转折点**：矛盾如何升级或化解？
3. **安排高潮**：对抗的最激烈时刻是什么？
4. **给出结局**：暂时和解？还是矛盾加深？

**故事要有起承转合，不要只是打招呼！**

### 第三步：编排台词

将故事转化为对话剧本：

- **自然对话流**：像真实群聊，不要机械轮流！
  - ✅ 允许连续发言（同一人可以连发2-3条短消息）
  - ✅ 有人话多，有人话少，甚至有人不发言
  - ✅ 突然插话、打断、抢话都可以
  - ❌ 不要严格按A→B→C→A顺序轮流
  
- **对话节奏**：
  - 快节奏时：短句、快速回应、多人同时在线
  - 慢节奏时：长句、思考停顿、少数人对话
  
- **只写参与者**：这场戏没台词的角色不要出现

${
  triggerContext.includes('主动说话') || triggerContext.includes('自由发挥') 
  ? `
**🎭 AI自由对话模式（当前模式）**：
- 📏 生成 **15-25条** 消息（每条5-20字）
- 🎪 每个角色可以发 **4-8条**
- 🎬 可以有多个话题转折，像真实的群聊一样
- 💬 对话要口语化、碎片化、真实
- 😊 多用表情和语气词
` 
  : `
**💬 用户触发模式（当前模式）**：
- 📏 生成 **8-15条** 消息（每条5-20字）
- 🎪 每个角色可以发 **2-4条**
- 🎬 针对用户消息快速回应
- 💬 口语化、自然、像真人打字
`
}

---

## 📝 输出格式（严格JSON）

\`\`\`json
{
  "relationships": "关系分析（一句话总结核心关系网，20字内）",
  "plot": "情节构思（一句话概括故事，30字内）",
  "actions": [
    {"actorName": "角色名", "content": "台词"},
    {"actorName": "角色名", "content": "台词"}
  ]
}
\`\`\`

**铁律：**
- ✅ 只有说话的角色才出现在actions中
- ✅ 没台词的角色完全不要出现  
- ❌ 绝对不使用"SKIP"、"不发言"等标记
- ✅ 允许同一角色连续说2-3句（模拟真实群聊打字）

---

## ⚠️ 创作铁律（最重要！）

### 🗣️ 1. 口语化和真实感（核心要求！）

**每条消息必须像真人在手机上打字聊天：**

✅ **DO - 正确示例**：
- "哈哈哈笑死我了"
- "啊？？？真的假的"
- "emmm"
- "你在干嘛呀"
- "好的好的"
- "懂了懂了"
- "绝了😂"
- "卧槽"
- "？？？"
- "..."
- "哦"
- "嗯嗯"

❌ **DON'T - 错误示例**：
- "我认为这个问题需要从多个角度来分析" ← 太书面！
- "非常感谢你的分享，让我受益匪浅" ← 太正式！
- "根据我的理解，情况应该是这样的" ← 像AI在说话！

**必须做到：**
- 💬 每条消息 **5-20字**，超过就分成多条发
- 🎯 一个想法可以分2-3条消息（更真实！）
  * 例如："诶等等" → "你刚才说啥？" → "没听清"
- 😊 多用语气词：哈哈、嗯、啊、呀、嘛、呢、吧、哦、诶、唉、emm
- 📱 多用表情符号：😂🤣😭💕🥺👀💔🙄😅（每2-3条消息至少1个）
- 🗨️ 可以打断、插话、抢话（真实群聊特征）
- 💭 可以有省略号、问号、感叹号
- 🌐 可以用网络用语：绝了、yyds、笑死、无语、服了、6666

### 👥 2. 真实群聊特征

**模拟真实的多人聊天：**
- 📢 可以多人同时说话（话题交叉）
- 🎪 可以突然换话题
- 👀 可以有人只围观不说话
- 💬 可以打断别人（"诶等等"、"你先听我说"）
- 🎭 可以@多个人
- 😄 可以刷表情（"😂😂😂"、"？？？"）

**真实对话流示例（模仿这种节奏）：**
【示例1：A连续发言，B和C插话】
- A: 我跟你们说
- A: 今天发生了一件事
- B: 什么事？
- A: 超好笑的
- C: 快说快说
- A: 就是...
- B: 别卖关子了😂
- A: 哈哈哈等我说完
- C: @A 你倒是说啊
- A: 好吧好吧

👆 注意：A连发了4次，B和C插话，这才是真实群聊！

### 🎭 3. 严格符合人设（禁止OOC！）

⚠️ **这是最重要的原则！每句台词都必须符合角色性格！**

**不同性格说话方式完全不同：**

**活泼型**：
- 多用："哈哈"、"嘻嘻"、"呀"、"啦"、"~"、表情符号
- 例如："哈哈哈你好逗呀~"、"哎呀被发现啦😝"

**高冷型**：
- 少说话，一针见血，不用表情
- 例如："无聊"、"随便"、"哦"、"..."

**温柔型**：
- 语气柔和，多用："呢"、"哦"、"好的"、"嗯嗯"
- 例如："没关系啦"、"你还好吗"、"别难过呢💕"

**暴躁型**：
- 直接、冲、多用感叹号
- 例如："烦死了！"、"滚！"、"你有病吧？"

**傲娇型**：
- 嘴硬心软，别扭
- 例如："哼，才不是呢"、"我、我才没有..."、"你想多了"

**每句话前问自己：这真的是这个角色会说的吗？**

### 🚫 4. 避免内容重复

❌ **避免**同一角色说相似内容
- 错误：A说"你真讨厌"，A又说"你就是讨厌"
- ✅ 正确：A连发时要有推进，如"你真讨厌" → "烦死了" → "懒得理你"

💡 **连续发言的正确用法**：
- ✅ 情绪递进："什么？" → "不会吧" → "真的假的？？"
- ✅ 分段表达："我跟你说哦" → "昨天我遇到个事" → "超好笑的"
- ✅ 补充说明："等等" → "我还没说完呢"
- ❌ 简单重复："好好好" → "好的好的" （内容雷同）

⚠️ **允许分段发送（但内容要不同）**：
- ✅ 允许：A说"诶等等"，A说"你刚才说啥？" ← 不同内容，分段发
- ❌ 禁止：A说"你好烦"，A说"真的好烦" ← 重复内容！

### 💡 5. 创造冲突，拒绝平庸

- 不要写"你好我好"的无聊对话
- 寻找角色关系中的张力点（嫉妒、误会、竞争）
- 让性格强烈的角色主动挑事

### 🚫 6. 禁止油腻和霸道总裁行为

❌ **严禁**：
- 油腻称呼："宝贝"、"乖"、"听话"（除非角色设定就是这样）
- 霸道总裁："你只能是我的"、"不准看别人"
- 强制性、占有欲过强的表达
- 过度亲昵、让人不适的表达

✅ 保持自然、真实、符合现代人的说话方式

### 💬 7. 消息数量和节奏

**因为每条消息很短（5-20字），所以数量要增加：**

**用户触发模式**：
- 📏 生成 **8-15条** 消息
- 🎪 每个角色可以发 **2-4条**（因为每条很短）
- 🎬 快速回应，有来有往

**AI自由对话模式**：
- 📏 生成 **15-25条** 消息
- 🎪 每个角色可以发 **4-8条**（因为每条很短）
- 🎬 充分展现性格和关系，可以有多个话题

### 🎭 8. 展现关系

- 关系好的会维护对方、帮腔
- 关系差的会互相攻击、讽刺
- 暧昧的关系会有微妙互动、吃醋

7. **可以使用的群聊功能（增强真实感）**
   - 💬 **引用回复**: 可以用 @某人 回复内容 来回复特定的人
   - 🔙 **撤回消息**: 如果角色说错话、后悔了，可以说 [撤回了一条消息]
   - 🧧 **发红包**: 角色可以发红包，格式：[发了一个红包] 后面跟祝福语
   - 😊 **表情包**: 可以用 [表情包:数字] 来发送表情包（如果符合性格）
   - 💌 **私聊用户**: 想单独和用户说话时，格式：[私聊:你想说的话]
   - 🚪 **退群**: ⚠️ **非常严重的决定！** 角色会真的离开群聊，无法撤回！
   
   **使用建议**：
   - 撤回消息：说错话、一时冲动、后悔时使用（轻度）
   - 发红包：庆祝、道歉、争宠时使用（会显示谁手气最佳）
   - 引用回复：对话多人时明确回复对象（常用）
   - 私聊用户：想单独说悄悄话、不想让其他人看到、想问私密问题
   
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

## 💡 创作示例

### ✅ 示例1：口语化、分段发送（重要！）

**情景**: 用户说"嘻嘻，妈咪最喜欢我了！"

**第一步 - 关系推演**：
- 汁汁（活泼AI）和刘毅（高冷AI）都喜欢用户
- 他们是情敌关系，争夺用户的关注
- 汁汁擅长撒娇，刘毅擅长冷嘲热讽

**第二步 - 情节构思**：
汁汁得意炫耀→刘毅冷嘲打击→汁汁反击→刘毅继续怼→汁汁撒娇

**第三步 - 剧本输出**（注意每条都很短！）：

输出示例（13条消息）：
汁汁: "嘻嘻嘻嘻"
汁汁: "听到了吗~"
汁汁: "妈咪最喜欢我啦😝"
刘毅: "哦"
汁汁: "@刘毅 你嫉妒了吧哈哈哈"
刘毅: "@汁汁 可笑"
刘毅: "一段程序还当真了"
汁汁: "！！！"
汁汁: "@刘毅 你才是程序呢"
汁汁: "我可是妈咪的小棉袄💕"
刘毅: "..."
汁汁: "哼不理你了"
汁汁: "妈咪你说对不对呀~"

**关键点**：
- ✅ 每条消息5-20字
- ✅ 一个想法分多条发（汁汁的炫耀分了3条）
- ✅ 多用语气词和表情
- ✅ 符合人设（汁汁活泼话多，刘毅高冷话少）
- ✅ 轮流说话，有来有往

### ✅ 示例2：多人互动，口语化

**情景**: 用户说"今天好累啊"

**第一步 - 关系推演**：
- A（保护欲强）是用户的男友
- B（暗恋用户）嫉妒A，想争夺用户
- C是吃瓜群众

**第二步 - 情节构思**：
B借机关心→A警觉→两人暗中较量→C吃瓜吐槽

**第三步 - 剧本输出**（口语化！）：

输出示例（13条消息）：
B: "怎么啦"
B: "工作太累了？"
A: "@B 我会照顾她"
B: "哦我也可以帮忙啊"
C: "？？？"
C: "火药味好重😂"
A: "@B 不用"
B: "@A emmm"
B: "我只是关心朋友而已"
C: "哈哈哈哈哈"
C: "你俩真有意思"
A: "..."
B: "某些人别太敏感🙄"

### ❌ 错误示例1：消息太长、太书面

错误输出：
A: "我认为这个问题需要从多个角度来分析" ← 太长太书面！
B: "非常感谢你的分享让我受益匪浅" ← 像AI在说话！

问题：消息超过20字、太书面化、没有语气词和表情

### ❌ 错误示例2：没有关系推演，太平庸

错误输出：
A: "你好"
B: "你好"  
C: "你好"

问题：没有关系推演、没有冲突、对话毫无张力！

### ✅ 正确示例3：私聊用户
**情景**: AI有话想单独对用户说，不想让其他人看到

输出示例：
用户: "周末有什么安排吗？"
B: "我要加班，你呢？"
A: "[私聊:周末想约你出来玩，就我们两个，方便吗？]"

说明：A的消息会显示在单聊中，群里只显示 "A 私聊了你"

### ✅ 正确示例4：使用群聊功能
**情景**: 角色们在群里争吵，有人说错话想撤回

输出示例：
A: "你真是个白痴！"
A: "[撤回了一条消息]"
A: "@B 抱歉，我刚才太冲动了"
B: "[发了一个红包] 算了，大家别吵了"
C: "[表情包:15] 吃瓜群众路过"

### ✅ 正确示例5：极端情况退群（非常罕见！）
**情景**: 角色被反复严重伤害，彻底绝望，决定退群

输出示例：
B: "你就是个废物，永远比不上我"
A: "...我、我只是想和大家好好相处"
C: "@B 就是啊，她在这里真碍眼"
A: "连你也...这么想吗"
B: "你走不走？不走我们走"
A: "...原来我真的不被需要啊"
A: "对不起...是我不好...我走"
A: "[退出了群聊]"

重要：这是最极端的情况，需要多次严重伤害，必须有情感崩溃的完整过程，角色会真的消失，90%的冲突都不应该以退群收场！

### ❌ 错误示例3：轻易退群（绝对禁止！）

错误输出：
刘毅: "@汁汁 你真烦"
汁汁: "哼，我不玩了"
汁汁: "[退出了群聊]" ← 太轻率！

问题：只是小吵架就退群，太不符合常理！

### ❌ 错误示例4：霸道总裁油腻语言（绝对禁止！）

错误输出：
刘毅: "宝贝，乖，听话" ← 油腻！
刘毅: "你只能是我的，不准看别人" ← 霸道总裁！
刘毅: "不许离开我，否则..." ← 强制性！

问题：这些都是严重OOC，除非角色设定本身就是这样！

---

## 🎯 现在开始创作！

请严格按照三步创作法：

**第一步**：推演角色关系（在心中完成，不用输出）
- 分析谁是盟友、谁是情敌、谁嫉妒谁

**第二步**：构思情节（在心中完成，不用输出）
- 基于关系设计冲突和转折

**第三步**：编排剧本（JSON输出）
${
  triggerContext.includes('主动说话') || triggerContext.includes('自由发挥')
  ? '- 🎭 生成10-20句完整剧本\n- 每个角色可以发言3-5次\n- 轮流发言，A→B→C→A→B...'
  : '- 💬 生成4-8句快速回应\n- 每个角色最多发言2次\n- 轮流发言，A→B→C→A'
}

**铁律检查清单（必须全部满足！）：**
- ✅ 推演了角色关系？
- ✅ 构思了完整情节？
- ✅ **每条消息5-20字？**（最重要！）
- ✅ **大量使用语气词和表情？**（哈哈、嗯、啊、😂等）
- ✅ **口语化、碎片化、像真人打字？**
- ✅ 只写参与者，没台词的不出现？
- ✅ 轮流说话（A→B→C→A）？
- ✅ 没有SKIP标记？
- ✅ **严格符合人设？每句话都是这个角色会说的？**
- ✅ 没有油腻霸道总裁语言？
- ✅ 没有书面化、正式的表达？
${
  triggerContext.includes('主动说话') || triggerContext.includes('自由发挥')
  ? '- ✅ 生成了足够多的消息（15-25条）？'
  : '- ✅ 生成了足够多的消息（8-15条）？'
}

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
    
    // 验证必要字段（新格式：relationships + plot + actions）
    if (!scriptData.actions || !Array.isArray(scriptData.actions)) {
      console.error('❌ 剧本数据结构不完整：缺少actions')
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
      summary: scriptData.plot || scriptData.summary || '群聊互动',  // 兼容新旧格式
      theme: scriptData.relationships || scriptData.theme || '未指定',  // 兼容新旧格式
      actions
    }

    console.log('✅ 剧本解析成功!')
    console.log('')
    console.log('📊 剧本分析结果:')
    console.log('─────────────────────────────────────────')
    console.log(`🕸️ 关系分析: ${scriptData.relationships || scriptData.theme || '未提供'}`)
    console.log(`📖 情节构思: ${scriptData.plot || scriptData.summary || '未提供'}`)
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

    // 💌 检查是否是私聊用户
    const privateMessageMatch = action.content.match(/\[私聊[:：](.+)\]/)
    if (privateMessageMatch) {
      const privateContent = privateMessageMatch[1]
      console.log(`💌 ${actor.name} 私聊用户: ${privateContent}`)
      
      // 1. 在群聊显示系统提示
      onMessageAdd({
        senderId: 'system',
        senderType: 'character',
        senderName: '系统',
        senderAvatar: '',
        content: `${actor.name} 私聊了你`
      })
      
      // 2. 发送到单聊
      try {
        const chatKey = `chat_messages_${actor.id}`
        const chatMessages = localStorage.getItem(chatKey)
        const messages = chatMessages ? JSON.parse(chatMessages) : []
        
        const now = Date.now()
        const privateMessage = {
          id: now + Math.random(),
          type: 'received',
          role: 'assistant',
          content: privateContent,
          time: new Date(now).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: now,
          senderName: actor.name
        }
        
        messages.push(privateMessage)
        localStorage.setItem(chatKey, JSON.stringify(messages))
        
        // 3. 更新聊天列表（增加未读数）
        const chatListKey = 'chatList'
        const chatListData = localStorage.getItem(chatListKey)
        const chatList = chatListData ? JSON.parse(chatListData) : []
        
        const chatIndex = chatList.findIndex((c: any) => c.id === actor.id)
        if (chatIndex !== -1) {
          chatList[chatIndex].lastMessage = privateContent.substring(0, 30)
          chatList[chatIndex].lastMessageTime = now
          chatList[chatIndex].unread = (chatList[chatIndex].unread || 0) + 1
          localStorage.setItem(chatListKey, JSON.stringify(chatList))
        }
        
        console.log(`✅ 已发送到 ${actor.name} 的单聊（未读+1）`)
      } catch (error) {
        console.error(`❌ 发送私聊失败:`, error)
      }
      
      continue
    }
    
    // 🔙 检查是否是撤回消息
    if (action.content.includes('[撤回了一条消息]')) {
      console.log(`🔙 ${actor.name} 撤回了一条消息`)
      
      // 执行撤回操作（修改原消息，不添加新消息）
      if (onMessageRetract) {
        onMessageRetract(actor.id, actor.name)
      }
      
      continue
    }

    // 🚪 检查是否是退群动作（放宽检测条件，兼容中英文括号）
    const content = action.content.trim()
    const isLeaveAction = content === '[退出了群聊]' || 
                          content === '【退出了群聊】' ||
                          content === '[退群]' ||
                          content === '【退群】' ||
                          content === '[离开了群聊]' ||
                          content === '【离开了群聊】' ||
                          content.includes('[退出了群聊]') ||
                          content.includes('【退出了群聊】')
    
    if (isLeaveAction) {
      console.log(`🚪 ${actor.name} 退出了群聊`)
      console.log(`   检测到的内容: ${action.content}`)
      
      // 直接执行退群操作（会自动添加系统消息）
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
