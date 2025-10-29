import { callAI } from './api'

// 手机内容数据结构
export interface AIPhoneContent {
  characterId: string
  characterName: string
  generatedAt: number
  
  // 通讯录
  contacts: {
    name: string
    phone: string
    relation: string
    notes?: string
  }[]
  
  // 微信聊天
  wechatChats: {
    name: string
    lastMessage: string
    time: string
    unread: number
    avatar?: string
  }[]
  
  // 浏览器历史
  browserHistory: {
    title: string
    url: string
    time: string
  }[]
  
  // 淘宝订单
  taobaoOrders: {
    title: string
    price: string
    status: string
    image?: string
  }[]
  
  // 支付宝账单
  alipayBills: {
    title: string
    amount: string
    type: 'income' | 'expense'
    time: string
  }[]
  
  // 相册照片
  photos: {
    description: string
    location?: string
    time: string
  }[]
  
  // 备忘录
  notes: {
    title: string
    content: string
    time: string
  }[]
  
  // 音乐播放列表
  musicPlaylist: {
    title: string
    artist: string
    mood?: string
  }[]
  
  // 地图搜索历史
  mapHistory: {
    name: string
    address: string
    time: string
  }[]
}

// 获取角色聊天记录
const getCharacterChatHistory = (characterId: string): string => {
  try {
    const chatKey = `chat_${characterId}`
    const saved = localStorage.getItem(chatKey)
    if (!saved) return '没有聊天记录'
    
    const messages = JSON.parse(saved)
    // 取最近20条消息
    const recentMessages = messages.slice(-20)
    
    return recentMessages.map((msg: any) => {
      const sender = msg.type === 'sent' ? '用户' : '角色'
      return `${sender}: ${msg.content}`
    }).join('\n')
  } catch (e) {
    console.error('获取聊天记录失败:', e)
    return '无法获取聊天记录'
  }
}

// 获取角色信息
const getCharacterInfo = (characterId: string): string => {
  try {
    const saved = localStorage.getItem('characters')
    if (!saved) return '未知角色'
    
    const characters = JSON.parse(saved)
    const character = characters.find((c: any) => c.id === characterId)
    
    if (!character) return '未知角色'
    
    return `角色名：${character.name}\n性格：${character.personality || '未设置'}\n描述：${character.description || '未设置'}`
  } catch (e) {
    console.error('获取角色信息失败:', e)
    return '未知角色'
  }
}

// 生成手机内容的提示词
const buildPhoneContentPrompt = (characterId: string, characterName: string): string => {
  const chatHistory = getCharacterChatHistory(characterId)
  const characterInfo = getCharacterInfo(characterId)
  
  return `你是一个AI助手，需要根据角色的性格和聊天记录，生成该角色手机中的真实内容。

角色信息：
${characterInfo}

最近聊天记录：
${chatHistory}

请根据以上信息，生成这个角色手机中的内容。内容要符合角色性格，与聊天记录相关联，并且要真实自然。

请以JSON格式输出，包含以下内容：

{
  "contacts": [
    {"name": "联系人名字", "phone": "手机号", "relation": "关系", "notes": "备注"}
  ],
  "wechatChats": [
    {"name": "聊天对象", "lastMessage": "最后一条消息", "time": "时间", "unread": 0}
  ],
  "browserHistory": [
    {"title": "网页标题", "url": "网址", "time": "访问时间"}
  ],
  "taobaoOrders": [
    {"title": "商品名称", "price": "价格", "status": "状态"}
  ],
  "alipayBills": [
    {"title": "账单标题", "amount": "金额", "type": "income或expense", "time": "时间"}
  ],
  "photos": [
    {"description": "照片描述", "location": "拍摄地点", "time": "拍摄时间"}
  ],
  "notes": [
    {"title": "标题", "content": "内容", "time": "创建时间"}
  ],
  "musicPlaylist": [
    {"title": "歌曲名", "artist": "歌手", "mood": "适合的心情"}
  ],
  "mapHistory": [
    {"name": "地点名称", "address": "详细地址", "time": "搜索时间"}
  ]
}

要求：
1. 每个类别至少生成3-8条真实的内容
2. 内容要与角色性格和聊天记录高度相关
3. 时间格式要自然（如"2小时前"、"昨天"、"3天前"等）
4. 内容要有细节，不要太笼统
5. **必须严格按照JSON格式输出**
6. **不要有任何markdown标记、代码块符号、额外说明**
7. **字符串中不要有换行符，用\\n代替**
8. **所有字段必须用双引号，不要用单引号**

直接输出纯JSON，示例格式：
{"contacts":[{"name":"张三","phone":"138****1234","relation":"朋友","notes":"备注"}],...}

现在开始输出JSON：`

}

// 生成AI手机内容
export const generateAIPhoneContent = async (
  characterId: string,
  characterName: string
): Promise<AIPhoneContent> => {
  try {
    // 检查缓存
    const cacheKey = `ai_phone_${characterId}`
    const cached = localStorage.getItem(cacheKey)
    
    if (cached) {
      const cachedData = JSON.parse(cached)
      // 缓存有效期：1小时
      if (Date.now() - cachedData.generatedAt < 3600000) {
        console.log('使用缓存的手机内容')
        return cachedData
      }
    }
    
    console.log('正在生成手机内容...')
    const prompt = buildPhoneContentPrompt(characterId, characterName)
    
    const response = await callAI([
      { role: 'user', content: prompt }
    ])
    
    console.log('AI原始返回:', response)
    
    // 解析JSON响应 - 改进版
    let jsonStr = response.trim()
    
    // 移除markdown代码块标记
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    
    // 尝试提取JSON对象
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }
    
    // 清理可能的问题字符
    jsonStr = jsonStr
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
      .replace(/,(\s*[}\]])/g, '$1') // 移除结尾多余逗号
    
    console.log('清理后的JSON:', jsonStr)
    
    let generatedContent
    try {
      generatedContent = JSON.parse(jsonStr)
    } catch (parseError: any) {
      console.error('JSON解析失败，原始内容:', jsonStr)
      console.error('错误详情:', parseError)
      throw new Error(`JSON解析失败: ${parseError?.message || '未知错误'}`)
    }
    
    const phoneContent: AIPhoneContent = {
      characterId,
      characterName,
      generatedAt: Date.now(),
      contacts: generatedContent.contacts || [],
      wechatChats: generatedContent.wechatChats || [],
      browserHistory: generatedContent.browserHistory || [],
      taobaoOrders: generatedContent.taobaoOrders || [],
      alipayBills: generatedContent.alipayBills || [],
      photos: generatedContent.photos || [],
      notes: generatedContent.notes || [],
      musicPlaylist: generatedContent.musicPlaylist || [],
      mapHistory: generatedContent.mapHistory || []
    }
    
    // 保存到缓存
    localStorage.setItem(cacheKey, JSON.stringify(phoneContent))
    
    return phoneContent
    
  } catch (error) {
    console.error('生成手机内容失败:', error)
    
    // 返回默认内容
    return {
      characterId,
      characterName,
      generatedAt: Date.now(),
      contacts: [
        { name: '妈妈', phone: '138****8888', relation: '家人', notes: '最爱我的人' }
      ],
      wechatChats: [
        { name: '好友', lastMessage: '在吗？', time: '刚刚', unread: 1 }
      ],
      browserHistory: [
        { title: '百度首页', url: 'https://www.baidu.com', time: '5分钟前' }
      ],
      taobaoOrders: [
        { title: '商品', price: '99.00', status: '待收货' }
      ],
      alipayBills: [
        { title: '转账', amount: '100.00', type: 'expense', time: '今天' }
      ],
      photos: [
        { description: '风景照', location: '公园', time: '上周' }
      ],
      notes: [
        { title: '待办事项', content: '记得买东西', time: '昨天' }
      ],
      musicPlaylist: [
        { title: '歌曲', artist: '歌手', mood: '放松' }
      ],
      mapHistory: [
        { name: '家', address: '住宅区', time: '今天' }
      ]
    }
  }
}

// 清除缓存
export const clearPhoneCache = (characterId: string) => {
  const cacheKey = `ai_phone_${characterId}`
  localStorage.removeItem(cacheKey)
}

// 清除所有缓存
export const clearAllPhoneCache = () => {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('ai_phone_')) {
      localStorage.removeItem(key)
    }
  })
}
