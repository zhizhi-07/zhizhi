import { callAI } from './api'

// ==================== 数据结构定义 ====================

/**
 * 直播间观众信息
 */
export interface LiveViewer {
  id: string
  name: string
  joinTime: number
  personality?: string // 观众性格：热情、毒舌、理性、搞笑等
}

/**
 * 主播信息
 */
export interface StreamerProfile {
  id: string
  name: string
  avatar: string
  description: string // 主播性格描述
  chatHistory: string // 与用户的聊天历史
}

/**
 * 直播间消息
 */
export interface LiveMessage {
  id: number
  senderId: string
  senderName: string
  senderType: 'streamer' | 'user' | 'viewer' | 'system'
  content: string
  timestamp: number
}

/**
 * 直播剧本中的单个动作
 */
export interface LiveScriptAction {
  actorId: string
  actorName: string
  actorType: 'streamer' | 'viewer'
  content: string
  timestamp: number
}

/**
 * 完整的直播剧本
 */
export interface LiveStreamScript {
  summary: string // 剧情概要
  atmosphere: string // 直播间氛围
  actions: LiveScriptAction[] // 按顺序排列的弹幕和主播回复
  viewerCountChange: number // 人数变化（正数增加，负数减少）
  likeCountChange: number // 点赞数变化
}

// ==================== 观众性格生成 ====================

const viewerPersonalities = [
  '热情粉丝：经常刷礼物，支持主播',
  '理性观众：喜欢提问和讨论',
  '搞笑观众：喜欢开玩笑和调侃',
  '毒舌观众：偶尔吐槽，但不恶意',
  '新来观众：第一次看直播，好奇',
  '潜水观众：很少说话，偶尔冒泡',
  '土豪观众：经常送大礼物',
  '八卦观众：喜欢打听主播私事'
]

/**
 * 为观众分配性格
 */
export function assignViewerPersonality(viewer: LiveViewer): LiveViewer {
  if (!viewer.personality) {
    viewer.personality = viewerPersonalities[Math.floor(Math.random() * viewerPersonalities.length)]
  }
  return viewer
}

// ==================== 直播剧本生成器 ====================

/**
 * 生成直播互动剧本
 * 一次API调用生成主播和多个观众的完整互动
 */
export async function generateLiveStreamScript(
  streamer: StreamerProfile,
  viewers: LiveViewer[],
  recentMessages: LiveMessage[],
  userMessage: string, // 用户发的弹幕
  currentViewerCount: number,
  currentLikeCount: number
): Promise<LiveStreamScript | null> {
  
  try {
    // 为观众分配性格
    const viewersWithPersonality = viewers.slice(0, 8).map(assignViewerPersonality)
    
    // 构建最近的弹幕历史
    const messageHistory = recentMessages.slice(-15).map(msg => 
      `${msg.senderName}: ${msg.content}`
    ).join('\n')
    
    // 构建观众列表
    const viewerList = viewersWithPersonality.map(v => 
      `- ${v.name}（${v.personality}）`
    ).join('\n')
    
    // 构建AI导演提示词
    const directorPrompt = `
# 🎬 你是直播间剧本导演

## 🎯 核心任务
你要为一场直播创作一个完整的互动剧本，包括：
1. 主播的反应和回复
2. 多个观众的弹幕互动
3. 观众之间的对话
4. 直播间氛围的变化

**这不是一问一答，而是一场真实的直播互动！**

---

## 📋 当前情境

### 主播信息
**${streamer.name}**
- 性格描述: ${streamer.description}
- 与用户的关系: ${streamer.chatHistory.substring(0, 500) || '刚开始直播'}

### 直播间观众（${viewersWithPersonality.length}人在线）
${viewerList}

### 最近弹幕
${messageHistory || '（直播刚开始）'}

### 用户刚发的弹幕
**用户说**: ${userMessage}

### 直播间数据
- 当前观众: ${currentViewerCount}人
- 当前点赞: ${currentLikeCount}

---

## 🎭 创作要求

### 1. 剧本结构（15-25条消息）

**必须包含以下元素：**

1. **主播回应**（2-4条）
   - 主播看到用户弹幕后的第一反应
   - 可能是：欣喜、调侃、感谢、回答问题
   - 例如："欸你来了！"、"哈哈这个问题问得好"

2. **观众起哄**（3-5条）
   - 其他观众看到主播和用户互动后的反应
   - 可能是：八卦、调侃、起哄、吃瓜
   - 例如："哇有情况"、"主播和这个xxx什么关系？"

3. **主播解释/回应观众**（2-3条）
   - 主播回应观众的八卦或问题
   - 可能是：害羞、否认、承认、转移话题
   - 例如："没有啦普通朋友"、"你们想多了😅"

4. **观众继续互动**（3-5条）
   - 观众不相信，继续追问或调侃
   - 观众之间互相对话
   - 例如："普通朋友这么紧张？"、"我不信"

5. **主播动作描写**（1-2条，可选）
   - 用（）或（）包裹
   - 例如："（脸红了）"、"（整理了一下头发）"

6. **话题转折**（2-3条）
   - 可能有新观众进入
   - 可能有人送礼物
   - 可能转到新话题
   - 例如："主播唱首歌吧"、"刚来，发生什么了"

### 2. 真实直播间特征

**必须做到：**
- 💬 每条弹幕 **3-15字**，像真人打字
- 🎪 观众可以连续刷屏（同一人连发2-3条）
- 😊 多用表情：😂🤣😭💕🥺👀🙄😅
- 🗨️ 多用语气词：哈哈、哇、欸、啊、呀
- 🎭 观众之间可以对话（@其他观众）
- 📢 可以多人同时说话（话题交叉）
- 🎁 可能有人说要送礼物

**真实直播弹幕示例：**
- 用户: 你好
- 主播: 欸你来了！
- 观众A: 主播和这个叫xxx的什么关系？
- 观众B: 哇有情况👀
- 观众C: 吃瓜吃瓜
- 主播: 没有啦普通朋友😅
- 观众A: 普通朋友这么紧张？
- 观众D: 哈哈哈主播脸红了
- 主播: 才没有！
- 观众B: 懂了懂了😏
- 用户: （继续互动）
- 主播: 好啦好啦不说这个了
- 观众E: 主播唱首歌吧
- 观众F: +1

### 3. 严格符合人设

**主播必须符合性格描述：**
- 活泼型：多用"哈哈"、"呀"、"~"、表情
- 高冷型：简短回复，少表情
- 温柔型：语气柔和，"呢"、"哦"、"💕"
- 傲娇型：嘴硬心软，"哼"、"才不是"

**观众根据性格说话：**
- 热情粉丝："主播加油！"、"爱了爱了"
- 毒舌观众："主播有点菜啊"、"这也太水了"
- 八卦观众："你们什么关系？"、"说实话"
- 搞笑观众："哈哈哈笑死"、"绝了"

### 4. 直播间氛围变化

**根据互动质量决定人数和点赞变化：**
- 🔥 热烈互动：+5到+20人，+50到+200赞
- 😊 正常互动：+2到+8人，+20到+80赞
- 😐 平淡互动：-1到+3人，+5到+30赞
- 😴 无聊互动：-3到-10人，+0到+10赞

---

## 📝 输出格式（严格JSON）

\`\`\`json
{
  "atmosphere": "直播间氛围描述（一句话，20字内）",
  "summary": "互动剧情概要（一句话，30字内）",
  "viewerCountChange": 人数变化（整数，可正可负）,
  "likeCountChange": 点赞变化（整数，必须>=0）,
  "actions": [
    {"actorName": "主播名或观众名", "actorType": "streamer或viewer", "content": "弹幕内容"},
    {"actorName": "主播名或观众名", "actorType": "streamer或viewer", "content": "弹幕内容"}
  ]
}
\`\`\`

**铁律：**
- ✅ actions数组必须有15-25条消息
- ✅ 主播必须出现（actorType: "streamer"）
- ✅ 至少3个不同的观众（actorType: "viewer"）
- ✅ 观众名字必须从观众列表中选择
- ✅ 每条content必须3-15字
- ✅ 允许同一人连续发2-3条
- ❌ 不要用"SKIP"、"不发言"等标记

---

现在开始创作这场直播互动剧本！
`

    console.log('🎬 调用AI导演生成直播剧本...')
    
    const response = await callAI([
      { role: 'user', content: directorPrompt }
    ], 1, 8000) // 增加token限制以支持更长的剧本
    
    console.log('📝 AI导演返回:', response)
    
    // 解析JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ 无法解析JSON')
      return null
    }
    
    const scriptData = JSON.parse(jsonMatch[0])
    
    // 验证数据
    if (!scriptData.actions || !Array.isArray(scriptData.actions)) {
      console.error('❌ 剧本格式错误')
      return null
    }
    
    // 构建剧本
    const actions: LiveScriptAction[] = scriptData.actions.map((action: any, index: number) => {
      // 确定actorId
      let actorId = ''
      let actorType: 'streamer' | 'viewer' = action.actorType || 'viewer'
      
      if (action.actorType === 'streamer' || action.actorName === streamer.name) {
        actorId = streamer.id
        actorType = 'streamer'
      } else {
        // 查找观众
        const viewer = viewersWithPersonality.find(v => v.name === action.actorName)
        actorId = viewer?.id || `viewer_${Date.now()}_${index}`
      }
      
      return {
        actorId,
        actorName: action.actorName,
        actorType,
        content: action.content,
        timestamp: Date.now() + (index + 1) * 1500 // 每条消息间隔1.5秒
      }
    })
    
    const script: LiveStreamScript = {
      summary: scriptData.summary || '直播互动',
      atmosphere: scriptData.atmosphere || '热闹',
      actions,
      viewerCountChange: scriptData.viewerCountChange || 0,
      likeCountChange: scriptData.likeCountChange || 0
    }
    
    console.log('✅ 直播剧本生成成功:', {
      消息数: actions.length,
      人数变化: script.viewerCountChange,
      点赞变化: script.likeCountChange
    })
    
    return script
    
  } catch (error) {
    console.error('❌ 生成直播剧本失败:', error)
    return null
  }
}

// ==================== 剧本执行器 ====================

/**
 * 执行直播剧本
 * 按照剧本顺序，逐条添加弹幕（带延迟效果）
 */
export async function executeLiveStreamScript(
  script: LiveStreamScript,
  onMessageAdd: (message: {
    senderId: string
    senderType: 'streamer' | 'viewer'
    senderName: string
    content: string
  }) => void,
  onViewerCountChange: (change: number) => void,
  onLikeCountChange: (change: number) => void
): Promise<void> {
  console.log(`🎬 开始执行直播剧本: "${script.summary}"`)
  console.log(`🎭 氛围: ${script.atmosphere}`)
  
  // 按顺序执行每个动作
  for (let i = 0; i < script.actions.length; i++) {
    const action = script.actions[i]
    
    // 等待到预定时间
    if (i > 0) {
      const delay = action.timestamp - script.actions[i - 1].timestamp
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    // 添加消息
    onMessageAdd({
      senderId: action.actorId,
      senderType: action.actorType,
      senderName: action.actorName,
      content: action.content
    })
    
    // 随机增加点赞（模拟观众点赞）
    if (Math.random() > 0.7) {
      const randomLikes = Math.floor(Math.random() * 10) + 1
      onLikeCountChange(randomLikes)
    }
  }
  
  // 剧本结束后应用人数和点赞变化
  onViewerCountChange(script.viewerCountChange)
  onLikeCountChange(script.likeCountChange)
  
  console.log('✅ 直播剧本执行完成')
}

