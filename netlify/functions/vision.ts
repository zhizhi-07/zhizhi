import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

/**
 * Vision API - 图像识别/描述
 * 用于识别用户头像和AI角色头像
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { image, prompt } = JSON.parse(event.body || '{}')

    if (!image) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing image data' })
      }
    }

    // 从环境变量获取 API Key (使用 gemini-proxy 中的第一个key作为backup)
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBl5MSzflWp6TCKo_U00114Cg89i94Wi54'

    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not configured')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured' })
      }
    }

    // 移除 data:image/xxx;base64, 前缀
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '')

    // 调用 Gemini Vision API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt || '详细描述这张图片的内容。'
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 500
      }
    }

    console.log('🔍 调用 Gemini Vision API...')

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API error:', response.status, errorText)
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Vision API error',
          details: errorText 
        })
      }
    }

    const data = await response.json()

    // 提取描述文本
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to describe image'

    console.log('✅ Vision API success:', description.substring(0, 100))

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        description,
        result: description
      })
    }

  } catch (error: any) {
    console.error('❌ Vision function error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}
