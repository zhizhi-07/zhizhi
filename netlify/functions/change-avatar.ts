import type { Handler } from '@netlify/functions'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ''

// Pollinations.ai 生图（完全免费）
async function generateAvatarWithAI(prompt: string): Promise<string | null> {
  try {
    console.log('🎨 使用Pollinations.ai生成头像:', prompt)
    
    // 将中文提示词转换为英文（使用Gemini）
    const englishPrompt = await translateToEnglish(prompt)
    console.log('📝 优化后的英文提示词:', englishPrompt)
    
    // 构建Pollinations.ai URL（使用flux模型提高质量）
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=512&height=512&nologo=true&enhance=true&model=flux`
    
    // 下载图片并转换为base64
    const response = await fetch(imageUrl, { 
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`生图失败: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = `data:image/png;base64,${buffer.toString('base64')}`
    
    console.log('✅ AI生图成功')
    return base64
  } catch (error) {
    console.error('❌ AI生图失败:', error)
    return null
  }
}

// 使用Gemini优化提示词
async function translateToEnglish(chinesePrompt: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `请将以下中文头像描述转换为详细的英文AI绘画提示词。要求：
1. 必须以"portrait avatar of"开头，确保生成的是头像而不是风景
2. 添加"centered composition, profile picture style"确保构图正确
3. 包含风格关键词（anime, realistic, cartoon等）
4. 包含细节描述（颜色、表情、特征）
5. 添加质量词（high quality, detailed, professional digital art, 4k）
6. 只返回英文提示词，不要其他解释

中文描述：${chinesePrompt}

英文提示词：`
            }]
          }]
        })
      }
    )
    
    const data = await response.json()
    let englishPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || chinesePrompt
    
    // 确保包含portrait avatar关键词
    if (!englishPrompt.toLowerCase().includes('portrait') && !englishPrompt.toLowerCase().includes('avatar')) {
      englishPrompt = `portrait avatar of ${englishPrompt}, centered composition, profile picture style`
    }
    
    return englishPrompt
  } catch (error) {
    console.error('❌ 提示词优化失败，使用原始描述:', error)
    // 即使失败也添加头像关键词
    return `portrait avatar of ${chinesePrompt}, centered composition, profile picture style, high quality, detailed`
  }
}

// Pexels搜索真实照片
async function searchPhotoWithPexels(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    console.log('⚠️ 未配置Pexels API Key，跳过照片搜索')
    return null
  }
  
  try {
    console.log('🔍 使用Pexels搜索照片:', query)
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=square`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`搜索失败: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.photos || data.photos.length === 0) {
      console.log('⚠️ 未找到相关照片')
      return null
    }
    
    // 随机选择一张照片
    const photo = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))]
    const imageUrl = photo.src.medium
    
    // 下载并转换为base64
    const imgResponse = await fetch(imageUrl)
    const arrayBuffer = await imgResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`
    
    console.log('✅ Pexels搜索成功')
    return base64
  } catch (error) {
    console.error('❌ Pexels搜索失败:', error)
    return null
  }
}

// 主处理函数
export const handler: Handler = async (event) => {
  // 处理CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    }
  }

  try {
    const { description, preferReal } = JSON.parse(event.body || '{}')
    
    if (!description) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: '缺少描述' })
      }
    }
    
    console.log('🖼️ 收到换头像请求:', description)
    
    let avatarBase64: string | null = null
    let method = ''
    
    // 优先级策略
    if (preferReal) {
      // 优先真实照片
      avatarBase64 = await searchPhotoWithPexels(description)
      method = 'pexels'
      
      if (!avatarBase64) {
        avatarBase64 = await generateAvatarWithAI(description)
        method = 'ai_generation'
      }
    } else {
      // 优先AI生成
      avatarBase64 = await generateAvatarWithAI(description)
      method = 'ai_generation'
      
      if (!avatarBase64) {
        avatarBase64 = await searchPhotoWithPexels(description)
        method = 'pexels'
      }
    }
    
    if (!avatarBase64) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: '生成头像失败，请稍后重试' })
      }
    }
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        avatar: avatarBase64,
        method: method
      })
    }
  } catch (error: any) {
    console.error('❌ 换头像失败:', error)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message || '未知错误' })
    }
  }
}
