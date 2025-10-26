import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBl5MSzflWp6TCKo_U00114Cg89i94Wi54'

/**
 * AI生成图片并包装成小红书笔记
 * 用于 AI 生图功能
 */

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
              text: `将以下中文图片描述转换为适合AI绘画的英文提示词，要求：
1. 描述清晰、具体
2. 包含风格、色彩、构图等细节
3. 适合stable diffusion/midjourney等模型
4. 直接输出英文，不要解释

中文描述：${chinesePrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200
          }
        })
      }
    )

    if (!response.ok) {
      console.warn('⚠️ Gemini翻译失败，使用原文')
      return chinesePrompt
    }

    const data = await response.json()
    const englishText = data.candidates?.[0]?.content?.parts?.[0]?.text || chinesePrompt
    
    console.log('📝 优化后的提示词:', englishText)
    return englishText.trim()
  } catch (error) {
    console.error('❌ 翻译失败:', error)
    return chinesePrompt
  }
}

// Pollinations.ai 生图（完全免费）
async function generateImage(prompt: string): Promise<string | null> {
  try {
    console.log('🎨 使用Pollinations.ai生成图片:', prompt)
    
    // 将中文提示词转换为英文
    const englishPrompt = await translateToEnglish(prompt)
    
    // 构建Pollinations.ai URL
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=800&height=600&nologo=true&enhance=true`
    
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

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { title, description, prompt } = JSON.parse(event.body || '{}')

    if (!title || !description || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    console.log('🎨 开始生成小红书图片...')
    console.log('标题:', title)
    console.log('描述:', description)
    console.log('提示词:', prompt)

    // 生成图片
    const imageBase64 = await generateImage(prompt)

    if (!imageBase64) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to generate image' })
      }
    }

    // 包装成小红书笔记格式
    const xiaohongshuNote = {
      id: `ai_generated_${Date.now()}`,
      title: title,
      description: description,
      coverImage: imageBase64,
      images: [imageBase64],
      author: {
        userId: 'ai_creator',
        nickname: 'AI创作',
        avatar: '🎨'
      },
      tags: ['AI生成', '原创', '艺术'],
      stats: {
        likes: Math.floor(Math.random() * 1000) + 100,
        comments: Math.floor(Math.random() * 50) + 10,
        collects: Math.floor(Math.random() * 200) + 50
      },
      url: '#',
      publishTime: new Date().toISOString(),
      topComments: []
    }

    console.log('✅ 小红书笔记生成成功')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ note: xiaohongshuNote })
    }

  } catch (error: any) {
    console.error('❌ 生成小红书图片失败:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}
