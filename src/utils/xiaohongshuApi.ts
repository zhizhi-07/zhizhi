import { XiaohongshuNote, XiaohongshuSearchResult } from '../types/xiaohongshu'

// ============================================
// 小红书API配置说明
// ============================================
// 真实API配置在Netlify环境变量中：
// - XIAOHONGSHU_API_URL: 你的小红书API地址
// - XIAOHONGSHU_API_KEY: API密钥（可选）
//
// 本地开发时，在 .env 文件中配置
// 部署到Netlify后，在Netlify控制台 -> Site settings -> Environment variables 中配置
// ============================================

// ============================================
// 模拟数据（作为备用方案）
// ============================================

const mockXiaohongshuNotes: XiaohongshuNote[] = [
  {
    id: 'xhs_001',
    title: '北京探店 | 这家咖啡店真的太好拍了！☕️',
    description: '在三里屯发现了一家超级好看的咖啡店，装修是ins风格，每个角落都很出片！咖啡味道也很不错～',
    coverImage: 'https://picsum.photos/300/400?random=1',
    images: ['https://picsum.photos/300/400?random=1'],
    author: {
      id: 'user_001',
      nickname: '小红薯用户',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    stats: {
      likes: 12300,
      comments: 856,
      collects: 9800
    },
    tags: ['探店', '咖啡', '北京', '三里屯'],
    url: 'https://www.xiaohongshu.com/explore/xhs_001',
    createTime: Date.now() - 86400000
  },
  {
    id: 'xhs_002',
    title: '🔥超实用的化妆技巧分享！新手必看',
    description: '姐妹们！这些化妆技巧真的太实用了，学会之后妆容精致了好多～今天分享给大家💄',
    coverImage: 'https://picsum.photos/300/400?random=2',
    images: ['https://picsum.photos/300/400?random=2'],
    author: {
      id: 'user_002',
      nickname: '美妆博主Lily',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    stats: {
      likes: 45600,
      comments: 2340,
      collects: 38900
    },
    tags: ['美妆', '化妆教程', '新手必看'],
    url: 'https://www.xiaohongshu.com/explore/xhs_002',
    createTime: Date.now() - 172800000
  },
  {
    id: 'xhs_003',
    title: '减肥食谱 | 一周瘦5斤不是梦！🥗',
    description: '分享我的减肥食谱，跟着吃真的能瘦！而且不用饿肚子，食材都很常见～',
    coverImage: 'https://picsum.photos/300/400?random=3',
    images: ['https://picsum.photos/300/400?random=3'],
    author: {
      id: 'user_003',
      nickname: '健身达人Anna',
      avatar: 'https://i.pravatar.cc/150?img=9'
    },
    stats: {
      likes: 67800,
      comments: 4521,
      collects: 52300
    },
    tags: ['减肥', '健康饮食', '食谱分享'],
    url: 'https://www.xiaohongshu.com/explore/xhs_003',
    createTime: Date.now() - 259200000
  },
  {
    id: 'xhs_004',
    title: '上海迪士尼攻略 | 省钱又好玩的玩法！🎢',
    description: '去了5次迪士尼总结的攻略！教你如何避开人群，玩遍所有项目～',
    coverImage: 'https://picsum.photos/300/400?random=4',
    images: ['https://picsum.photos/300/400?random=4'],
    author: {
      id: 'user_004',
      nickname: '旅行日记',
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    stats: {
      likes: 89200,
      comments: 6789,
      collects: 71200
    },
    tags: ['旅行', '上海', '迪士尼', '攻略'],
    url: 'https://www.xiaohongshu.com/explore/xhs_004',
    createTime: Date.now() - 432000000
  },
  {
    id: 'xhs_005',
    title: '平价好物推荐 | 这些东西真的超值！💰',
    description: '分享最近买到的超值好物，都是平价但质量很好的～学生党也能轻松入手！',
    coverImage: 'https://picsum.photos/300/400?random=5',
    images: ['https://picsum.photos/300/400?random=5'],
    author: {
      id: 'user_005',
      nickname: '省钱小能手',
      avatar: 'https://i.pravatar.cc/150?img=15'
    },
    stats: {
      likes: 34500,
      comments: 1890,
      collects: 28900
    },
    tags: ['好物推荐', '平价', '学生党'],
    url: 'https://www.xiaohongshu.com/explore/xhs_005',
    createTime: Date.now() - 518400000
  },
  {
    id: 'xhs_006',
    title: '穿搭灵感 | 小个子女生的显高秘籍👗',
    description: '155cm的我总结的显高穿搭技巧，跟着穿轻松显高10cm！',
    coverImage: 'https://picsum.photos/300/400?random=6',
    images: ['https://picsum.photos/300/400?random=6'],
    author: {
      id: 'user_006',
      nickname: '穿搭博主小米',
      avatar: 'https://i.pravatar.cc/150?img=20'
    },
    stats: {
      likes: 56700,
      comments: 3210,
      collects: 45600
    },
    tags: ['穿搭', '小个子', '显高'],
    url: 'https://www.xiaohongshu.com/explore/xhs_006',
    createTime: Date.now() - 604800000
  }
]

// ============================================
// 真实API调用函数
// ============================================

/**
 * 调用真实的小红书API搜索（通过Netlify Functions代理）
 */
const searchRealXiaohongshuApi = async (
  keyword: string,
  limit: number = 10
): Promise<XiaohongshuSearchResult> => {
  try {
    console.log('🔍 通过Netlify Functions调用小红书API:', keyword)
    
    // 调用Netlify Function代理
    // 在开发环境：/.netlify/functions/xiaohongshu-api
    // 在生产环境：/api/xiaohongshu-api (通过netlify.toml重定向)
    const apiUrl = new URL('/.netlify/functions/xiaohongshu-api', window.location.origin)
    apiUrl.searchParams.append('action', 'search')
    apiUrl.searchParams.append('keyword', keyword)
    apiUrl.searchParams.append('limit', limit.toString())
    
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // 如果返回的是模拟数据标记，抛出错误回退
    if (data.useMock) {
      console.log('⚠️ 服务端未配置API，使用模拟数据')
      throw new Error('未配置小红书API')
    }
    
    console.log('✅ 真实API返回数据:', data)
    
    return {
      notes: data.notes || [],
      total: data.total || 0,
      hasMore: data.hasMore || false
    }
  } catch (error) {
    console.error('❌ 真实API调用失败:', error)
    throw error
  }
}

/**
 * 使用模拟数据搜索
 */
const searchMockXiaohongshuNotes = async (
  keyword: string,
  limit: number = 10
): Promise<XiaohongshuSearchResult> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  console.log('🔍 搜索关键词:', keyword)
  console.log('📊 总数据量:', mockXiaohongshuNotes.length)

  // 简单的关键词匹配
  let filteredNotes = mockXiaohongshuNotes
  
  if (keyword.trim()) {
    filteredNotes = mockXiaohongshuNotes.filter(note => 
      note.title.includes(keyword) ||
      note.description.includes(keyword) ||
      note.tags.some(tag => tag.includes(keyword))
    )
    console.log('🎯 匹配结果数:', filteredNotes.length)
  }

  // 随机排序以模拟不同的搜索结果
  filteredNotes = [...filteredNotes].sort(() => Math.random() - 0.5)

  const result = filteredNotes.slice(0, limit)
  
  console.log('✅ 返回结果数:', result.length)

  return {
    notes: result,
    total: filteredNotes.length,
    hasMore: filteredNotes.length > limit
  }
}

/**
 * 搜索小红书笔记（智能切换真实API或模拟数据）
 */
export const searchXiaohongshuNotes = async (
  keyword: string,
  limit: number = 10
): Promise<XiaohongshuSearchResult> => {
  // 在开发环境下，直接使用模拟数据
  // 除非是通过netlify dev启动（netlify dev会设置特殊环境）
  const isDevelopment = import.meta.env.DEV
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1'
  
  // 本地开发环境直接用模拟数据（避免调用不存在的Functions）
  if (isDevelopment && isLocalhost) {
    console.log('📕 本地开发环境，使用模拟数据')
    console.log('💡 提示：这是正常的，模拟数据已经可以使用')
    console.log('💡 部署到Netlify后，可以配置真实API（参考文档）')
    return await searchMockXiaohongshuNotes(keyword, limit)
  }
  
  // 生产环境，尝试调用真实API
  try {
    console.log('📕 生产环境，尝试使用真实小红书API')
    return await searchRealXiaohongshuApi(keyword, limit)
  } catch (error) {
    console.warn('⚠️ 真实API调用失败，回退到模拟数据', error)
    // 调用失败时回退到模拟数据
    console.log('📕 使用模拟数据')
    return await searchMockXiaohongshuNotes(keyword, limit)
  }
}

/**
 * 获取随机推荐笔记
 */
export const getRecommendedNotes = async (count: number = 3): Promise<XiaohongshuNote[]> => {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // 随机选择几个笔记
  const shuffled = [...mockXiaohongshuNotes].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

/**
 * 根据ID获取笔记详情
 */
export const getXiaohongshuNoteById = async (id: string): Promise<XiaohongshuNote | null> => {
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const note = mockXiaohongshuNotes.find(n => n.id === id)
  return note || null
}

/**
 * 从AI生成的内容创建小红书笔记
 */
export const createNoteFromAIContent = (content: string): XiaohongshuNote => {
  // 生成随机统计数据
  const randomLikes = Math.floor(Math.random() * 50000) + 1000
  const randomComments = Math.floor(Math.random() * 3000) + 100
  const randomCollects = Math.floor(Math.random() * 30000) + 500
  
  // 从内容中提取标签（简单处理）
  const tags: string[] = []
  if (content.includes('美食') || content.includes('好吃') || content.includes('餐厅') || content.includes('火锅') || content.includes('烧烤')) {
    tags.push('美食')
  }
  if (content.includes('穿搭') || content.includes('衣服') || content.includes('搭配')) {
    tags.push('穿搭')
  }
  if (content.includes('咖啡') || content.includes('探店') || content.includes('店')) {
    tags.push('探店')
  }
  if (content.includes('化妆') || content.includes('美妆') || content.includes('口红')) {
    tags.push('美妆')
  }
  if (content.includes('旅行') || content.includes('旅游') || content.includes('风景')) {
    tags.push('旅行')
  }
  
  // 如果没有标签，添加"生活"
  if (tags.length === 0) {
    tags.push('生活', '分享')
  }
  
  // 生成标题（取前30个字符）
  const title = content.length > 30 ? content.substring(0, 30) + '...' : content
  
  return {
    id: `ai_generated_${Date.now()}`,
    title: title,
    description: content,
    coverImage: `https://picsum.photos/300/400?random=${Date.now()}`, // 随机图片
    images: [`https://picsum.photos/300/400?random=${Date.now()}`],
    author: {
      id: 'ai_author',
      nickname: 'AI分享',
      avatar: 'https://i.pravatar.cc/150?img=8'
    },
    stats: {
      likes: randomLikes,
      comments: randomComments,
      collects: randomCollects
    },
    tags: tags,
    url: `https://www.xiaohongshu.com/explore/ai_${Date.now()}`,
    createTime: Date.now()
  }
}

/**
 * AI使用：根据关键词获取相关的小红书笔记
 * 支持两种模式：
 * 1. 如果内容是一段描述（超过10个字），直接生成笔记
 * 2. 如果是简短关键词，搜索相关笔记
 */
export const getXiaohongshuForAI = async (keywords: string[]): Promise<XiaohongshuNote | null> => {
  const keyword = keywords.join(' ')
  console.log('🤖 AI小红书内容:', keyword)
  
  // 如果内容比较长（超过10个字），认为是AI生成的内容
  if (keyword.length > 10) {
    console.log('✨ AI生成小红书笔记内容')
    return createNoteFromAIContent(keyword)
  }
  
  // 否则搜索相关笔记
  console.log('🔍 搜索相关笔记，关键词:', keyword)
  const result = await searchXiaohongshuNotes(keyword, 5)
  
  console.log('📊 搜索结果数:', result.notes.length)
  
  if (result.notes.length === 0) {
    console.log('⚠️ 没有找到相关笔记')
    return null
  }
  
  const selectedNote = result.notes[0]
  console.log('✅ 选中笔记:', selectedNote.title)
  return selectedNote
}

/**
 * 实际项目中，可以使用真实的小红书API
 * 例如：
 * 
 * export const searchRealXiaohongshuNotes = async (keyword: string) => {
 *   // 选项1: 使用官方API（需要申请）
 *   const response = await fetch(`https://api.xiaohongshu.com/v1/search?keyword=${keyword}`, {
 *     headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
 *   })
 *   
 *   // 选项2: 使用第三方数据服务
 *   const response = await fetch(`https://your-proxy.com/xiaohongshu/search?q=${keyword}`)
 *   
 *   // 选项3: 通过自建的Netlify Function代理
 *   const response = await fetch(`/.netlify/functions/xiaohongshu-proxy?keyword=${keyword}`)
 *   
 *   return await response.json()
 * }
 */
