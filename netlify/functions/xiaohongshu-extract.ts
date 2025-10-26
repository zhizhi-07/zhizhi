import { Handler } from '@netlify/functions'

/**
 * 小红书笔记信息提取 - 从链接自动获取笔记信息
 */

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    const { url } = JSON.parse(event.body || '{}')

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '请提供小红书链接' })
      }
    }

    console.log('🔍 提取小红书笔记:', url)

    // 提取笔记ID
    const noteIdMatch = url.match(/\/explore\/([a-zA-Z0-9]+)/) || 
                        url.match(/\/discovery\/item\/([a-zA-Z0-9]+)/)
    
    if (!noteIdMatch) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '无效的小红书链接' })
      }
    }

    const noteId = noteIdMatch[1]
    console.log('📝 笔记ID:', noteId)

    // 方案1: 如果配置了第三方API
    const EXTRACT_API_URL = process.env.XIAOHONGSHU_EXTRACT_API_URL
    const EXTRACT_API_KEY = process.env.XIAOHONGSHU_EXTRACT_API_KEY

    if (EXTRACT_API_URL) {
      // 使用第三方API提取
      const apiUrl = new URL(EXTRACT_API_URL)
      apiUrl.searchParams.append('url', url)
      
      const requestHeaders: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (EXTRACT_API_KEY) {
        requestHeaders['Authorization'] = `Bearer ${EXTRACT_API_KEY}`
      }

      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: requestHeaders
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ 成功提取笔记信息')

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      }
    }

    // 方案2: 简单的元数据提取（fallback）
    // 尝试获取页面基本信息
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const html = await response.text()

      // 提取标题
      const titleMatch = html.match(/<title>(.*?)<\/title>/)
      const title = titleMatch ? titleMatch[1].replace(' - 小红书', '').trim() : '小红书笔记'

      // 提取描述
      const descMatch = html.match(/<meta name="description" content="(.*?)"/)
      const description = descMatch ? descMatch[1] : ''

      // 提取图片
      const imgMatch = html.match(/<meta property="og:image" content="(.*?)"/)
      const image = imgMatch ? imgMatch[1] : ''

      console.log('✅ 基础信息提取成功')

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: noteId,
          title: title,
          description: description,
          coverImage: image,
          images: image ? [image] : [],
          author: {
            id: 'unknown',
            nickname: '小红书用户',
            avatar: ''
          },
          stats: {
            likes: 0,
            comments: 0,
            collects: 0
          },
          tags: [],
          url: url,
          createTime: Date.now(),
          extracted: true
        })
      }
    } catch (extractError) {
      console.warn('⚠️ 基础提取失败:', extractError)
      
      // 返回最基本的信息
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: noteId,
          title: '小红书笔记',
          description: '点击查看详情',
          coverImage: '',
          images: [],
          author: {
            id: 'unknown',
            nickname: '小红书用户',
            avatar: ''
          },
          stats: {
            likes: 0,
            comments: 0,
            collects: 0
          },
          tags: [],
          url: url,
          createTime: Date.now(),
          needManualInput: true,
          message: '自动提取失败，建议手动填写或使用第三方API'
        })
      }
    }

  } catch (error) {
    console.error('❌ 提取失败:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '提取失败',
        message: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}

export { handler }
