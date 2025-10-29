/**
 * forumAI.ts - 论坛AI功能封装
 * 
 * 处理角色初始化、内容生成等AI调用
 * 
 * @module utils/forumAI
 */

import type { Character } from '../context/CharacterContext'
import { getAllMemes } from './memeManager'

// ==================== 类型定义 ====================

export interface ForumCharacterProfile {
  characterId: string
  originalName: string
  originalAvatar: string
  forumName: string
  forumNickname?: string        // 论坛昵称
  forumAvatar?: string           // 论坛头像emoji
  forumBio: string
  forumSignature?: string        // 个性签名
  personality?: string           // 性格描述
  followersCount: number
  followingCount: number
  influence: 'high' | 'medium' | 'low'
  isFollowedByUser: boolean
  chatMemory?: string[]
}

export interface CharacterNameAndBio {
  forumName: string
  forumBio: string
}

export interface CharacterStats {
  characterId: string
  followersCount: number
  followingCount: number
  influence: 'high' | 'medium' | 'low'
}

// ==================== API调用封装 ====================

/**
 * 获取配置的API
 */
function getConfiguredAPI() {
  const apiSettings = localStorage.getItem('apiSettings')
  if (!apiSettings) {
    throw new Error('请先在设置中配置API')
  }
  
  try {
    const settings = JSON.parse(apiSettings)
    return {
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
      provider: settings.provider
    }
  } catch {
    throw new Error('API配置格式错误')
  }
}

/**
 * 调用AI API
 */
async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  console.log('🚀 [ForumAI] 开始调用API...')
  console.log('📝 [ForumAI] Prompt长度:', prompt.length)
  
  const api = getConfiguredAPI()
  console.log('🔧 [ForumAI] API配置:', {
    baseUrl: api.baseUrl,
    model: api.model,
    hasKey: !!api.apiKey
  })
  
  const requestBody = {
    model: api.model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 2000  // 增加到2000，话题内容多
  }
  
  console.log('📤 [ForumAI] 发送请求:', api.baseUrl + '/chat/completions')
  
  const response = await fetch(api.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${api.apiKey}`
    },
    body: JSON.stringify(requestBody)
  })
  
  console.log('📥 [ForumAI] 响应状态:', response.status, response.statusText)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ [ForumAI] API错误:', errorText)
    throw new Error(`API调用失败: ${response.statusText} - ${errorText}`)
  }
  
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  
  console.log('✅ [ForumAI] API返回内容长度:', content.length)
  console.log('📄 [ForumAI] 返回内容前200字:', content.substring(0, 200))
  
  return content
}

// ==================== 角色初始化 ====================

/**
 * 单个角色生成昵称和签名（角色扮演）
 */
export async function generateCharacterNameAndBio(character: Character): Promise<CharacterNameAndBio> {
  const prompt = `你现在扮演这个角色：

【角色信息】
名字：${character.name}
描述：${character.description}
${character.personality ? `性格：${character.personality}` : ''}

【任务】
为自己设置论坛信息（第一人称，像真的是你在说话）：
1. 论坛昵称 - 5-10个字，符合你的性格和身份
2. 个性签名 - 20字以内，展现你的个性

【示例】
如果你是游戏主播，可能是："带你躺の小明" / "签名：包上分！钻石以下都能带"
如果你是文艺青年，可能是："云游诗人" / "签名：世界那么大，我想去看看"

请严格返回JSON格式，不要有其他文字：
{
  "forumName": "你的昵称",
  "forumBio": "你的签名"
}`

  const result = await callAI(prompt)
  
  try {
    // 去除markdown代码块并提取JSON
    let cleanedResult = result.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('未找到JSON格式')
    }
    
    // 修复JSON格式错误
    let jsonStr = jsonMatch[0]
    jsonStr = jsonStr.replace(/(\w+):/g, '"$1":')
    jsonStr = jsonStr.replace(/""(\w+)""/g, '"$1"')
    
    const parsed = JSON.parse(jsonStr)
    return {
      forumName: parsed.forumName || character.name,
      forumBio: parsed.forumBio || '这个人很懒，什么都没写'
    }
  } catch (error) {
    console.error('解析失败，使用默认值:', error)
    return {
      forumName: character.name,
      forumBio: '这个人很懒，什么都没写'
    }
  }
}

/**
 * 系统助手分析并分配粉丝数（批量）
 */
export async function analyzeAndAssignStats(characters: Array<{
  id: string
  name: string
  description: string
}>): Promise<CharacterStats[]> {
  const prompt = `你是论坛系统助手，负责分析角色身份并分配合理的粉丝数。

【角色列表】
${characters.map((c, i) => `
角色${i + 1}:
- ID: ${c.id}
- 名字: ${c.name}
- 描述: ${c.description.substring(0, 200)}
`).join('\n')}

【分配规则】
根据角色的职业身份和影响力分配：
- 明星/网红/游戏主播/大V: 50000-500000粉丝
- 博主/KOL/专业人士: 5000-50000粉丝
- 活跃用户: 1000-5000粉丝
- 普通人/学生/上班族: 100-1000粉丝

关注数 = 粉丝数的 10%-50%（粉丝越多，关注比例越低）

请严格返回JSON数组，不要有其他文字：
[
  {
    "characterId": "角色ID",
    "followersCount": 数字,
    "followingCount": 数字,
    "influence": "high/medium/low"
  }
]`

  const result = await callAI(prompt)
  
  try {
    // 去除markdown代码块并提取JSON数组
    let cleanedResult = result.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    const jsonMatch = cleanedResult.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('未找到JSON数组')
    }
    
    // 修复JSON格式错误
    let jsonStr = jsonMatch[0]
    jsonStr = jsonStr.replace(/(\w+):/g, '"$1":')
    jsonStr = jsonStr.replace(/""(\w+)""/g, '"$1"')
    
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('解析失败，使用默认值:', error)
    // 返回默认值
    return characters.map(c => ({
      characterId: c.id,
      followersCount: Math.floor(Math.random() * 900) + 100,
      followingCount: Math.floor(Math.random() * 400) + 50,
      influence: 'low' as const
    }))
  }
}

/**
 * 批量初始化角色（方案A - 顺序调用）
 */
export async function initializeForumCharacters(
  characters: Character[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<ForumCharacterProfile[]> {
  const profiles: ForumCharacterProfile[] = []
  
  // 第一步：每个角色生成昵称和签名
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i]
    onProgress?.(i + 1, characters.length + 1, `${character.name} 正在设置论坛信息...`)
    
    try {
      const nameAndBio = await generateCharacterNameAndBio(character)
      profiles.push({
        characterId: character.id,
        originalName: character.name,
        originalAvatar: character.avatar,
        forumName: nameAndBio.forumName,
        forumBio: nameAndBio.forumBio,
        followersCount: 0, // 待分配
        followingCount: 0, // 待分配
        influence: 'low',
        isFollowedByUser: false,
      })
    } catch (error) {
      console.error(`${character.name} 初始化失败:`, error)
      // 使用默认值
      profiles.push({
        characterId: character.id,
        originalName: character.name,
        originalAvatar: character.avatar,
        forumName: character.name,
        forumBio: '这个人很懒，什么都没写',
        followersCount: 0,
        followingCount: 0,
        influence: 'low',
        isFollowedByUser: false,
      })
    }
  }
  
  // 第二步：系统助手批量分配粉丝数
  onProgress?.(characters.length + 1, characters.length + 1, '系统助手正在分析角色身份...')
  
  try {
    const stats = await analyzeAndAssignStats(
      characters.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description
      }))
    )
    
    // 合并数据
    profiles.forEach(profile => {
      const stat = stats.find(s => s.characterId === profile.characterId)
      if (stat) {
        profile.followersCount = stat.followersCount
        profile.followingCount = stat.followingCount
        profile.influence = stat.influence
      } else {
        // 默认值
        profile.followersCount = Math.floor(Math.random() * 900) + 100
        profile.followingCount = Math.floor(Math.random() * 400) + 50
      }
    })
  } catch (error) {
    console.error('系统助手分析失败，使用随机值:', error)
    // 所有角色使用随机粉丝数
    profiles.forEach(profile => {
      profile.followersCount = Math.floor(Math.random() * 900) + 100
      profile.followingCount = Math.floor(Math.random() * 400) + 50
    })
  }
  
  return profiles
}

// ==================== 数据保存和读取 ====================

/**
 * 保存论坛角色配置
 */
export function saveForumCharacters(profiles: ForumCharacterProfile[]): void {
  localStorage.setItem('forum_characters', JSON.stringify(profiles))
  localStorage.setItem('forum_initialized', 'true')
}

/**
 * 读取论坛角色配置
 */
export function getForumCharacters(): ForumCharacterProfile[] {
  const saved = localStorage.getItem('forum_characters')
  if (!saved) return []
  
  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

/**
 * 检查是否已初始化
 */
export function isForumInitialized(): boolean {
  return localStorage.getItem('forum_initialized') === 'true'
}

/**
 * 获取/保存选中的角色ID列表
 */
export function getSelectedCharacterIds(): string[] {
  const saved = localStorage.getItem('forum_selected_characters')
  return saved ? JSON.parse(saved) : []
}

export function saveSelectedCharacterIds(ids: string[]): void {
  localStorage.setItem('forum_selected_characters', JSON.stringify(ids))
}

// ==================== 话题内容生成 ====================

/**
 * 获取梗库 - 直接从微信梗库读取（包含含义）
 */
function getMemes(): Array<{ 梗: string, 含义: string }> {
  // 使用统一梗库（内置+自定义）
  return getAllMemes().map((m) => ({
    梗: m['梗'],
    含义: m['含义']
  }))
}

/**
 * 保存梗库（论坛不需要单独保存，使用微信的）
 */
export function saveMemes(_memes: string[]): void {
  // 论坛和微信共享梗库，不需要单独保存
  console.log('💡 论坛使用微信梗库，无需单独保存')
}

/**
 * 生成话题的完整讨论内容（一次API调用）
 */
export async function generateTopicContent(topicName: string, topicDesc: string): Promise<{
  users: any[]
  posts: any[]
}> {
  console.log('🎯 [话题生成] 开始生成话题:', topicName)
  console.log('📝 [话题生成] 话题介绍:', topicDesc)
  
  // 获取梗库
  const memes = getMemes()
  const memesSection = memes.length > 0 ? `

🎭 网络梗库（请自然地融入到帖子和评论中，理解含义后使用）：
${memes.map((m, i) => `${i + 1}. "${m.梗}" - ${m.含义}`).join('\n')}

示例用法（要符合梗的含义）：
- "这波操作真的绷不住了"（表示忍不住笑了）
- "经典，纯纯的纯良"（讽刺某事很离谱）
- "我的评价是不如..."（用于吐槽）
- "你礼貌吗？"（表示被冒犯或质疑对方）
` : ''
  
  const prompt = `你现在要为话题「${topicName}」创建一个真实的论坛讨论区。

话题介绍：${topicDesc}
${memesSection}

请生成10-15条帖子和评论，使用以下简单格式（每行一条，用|||分隔）：

用户格式：
U|||用户ID|||昵称|||签名|||emoji头像|||粉丝数

帖子格式：
P|||帖子ID|||用户ID|||内容(80-150字)|||点赞数

评论格式：
C|||评论ID|||用户ID|||内容(20-50字)|||回复哪个帖子|||回复哪个评论(可选)|||点赞数

要求：
1. 先生成15-20个用户(用户ID用user1, user2...)
2. 然后生成10-15条帖子(帖子ID用post1, post2...)
3. 每个帖子下3-8条评论(评论ID用c1, c2...)
4. 评论可以互相回复形成楼中楼
5. 内容要有不同观点：赞同、反对、调侃、吐槽等
${memesSection ? '6. 自然融入梗库里的梗，不要生硬' : ''}

示例：
U|||user1|||键盘侠|||专业抬杠二十年|||👨‍💼|||12000
P|||post1|||user1|||今天这话题我必须说两句...|||45
C|||c1|||user2|||同意楼主|||post1||||||12
C|||c2|||user3|||我不这么认为|||post1|||c1|||8

直接输出，不要有其他说明文字！`

  const result = await callAI(prompt)
  
  console.log('📦 [话题生成] AI原始返回长度:', result.length)
  
  try {
    // 解析简单文本格式
    const lines = result.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const users: any[] = []
    const posts: any[] = []
    const commentsByPost: { [postId: string]: any[] } = {}
    
    const now = Date.now()
    
    for (const line of lines) {
      const parts = line.split('|||').map(p => p.trim())
      
      if (parts[0] === 'U' && parts.length >= 6) {
        // 用户: U|||ID|||昵称|||签名|||头像|||粉丝数
        users.push({
          id: parts[1],
          name: parts[2],
          bio: parts[3],
          avatar: parts[4],
          followers: parseInt(parts[5]) || 1000
        })
      } else if (parts[0] === 'P' && parts.length >= 5) {
        // 帖子: P|||ID|||用户ID|||内容|||点赞数
        const postId = parts[1]
        posts.push({
          id: postId,
          authorId: parts[2],
          content: parts[3],
          likes: parseInt(parts[4]) || 0,
          timestamp: now - Math.floor(Math.random() * 24 * 3600 * 1000), // 过去24小时内
          comments: []
        })
        commentsByPost[postId] = []
      } else if (parts[0] === 'C' && parts.length >= 7) {
        // 评论: C|||ID|||用户ID|||内容|||帖子ID|||回复评论ID|||点赞数
        const comment = {
          id: parts[1],
          authorId: parts[2],
          content: parts[3],
          likes: parseInt(parts[6]) || 0,
          timestamp: now - Math.floor(Math.random() * 20 * 3600 * 1000),
          replyTo: parts[5] || null
        }
        
        const postId = parts[4]
        if (!commentsByPost[postId]) {
          commentsByPost[postId] = []
        }
        commentsByPost[postId].push(comment)
      }
    }
    
    // 将评论添加到对应的帖子
    posts.forEach(post => {
      if (commentsByPost[post.id]) {
        post.comments = commentsByPost[post.id]
      }
    })
    
    const data = { users, posts }
    
    console.log('✅ [话题生成] 解析成功')
    console.log('👥 [话题生成] 用户数量:', data.users?.length)
    console.log('📝 [话题生成] 帖子数量:', data.posts?.length)
    
    // 验证数据
    if (!data.users || !data.posts) {
      console.error('❌ [话题生成] 数据不完整:', data)
      throw new Error('数据格式不完整')
    }
    
    if (data.users.length < 5) {
      console.warn('⚠️ [话题生成] 用户数量少于5个')
    }
    
    if (data.posts.length < 5) {
      console.warn('⚠️ [话题生成] 帖子数量少于5个')
    }
    
    return data
  } catch (error) {
    console.error('❌ [话题生成] 解析失败:', error)
    console.error('原始返回:', result)
    throw new Error('AI生成内容解析失败：' + (error as Error).message)
  }
}

