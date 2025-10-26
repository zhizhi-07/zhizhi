import { Handler } from '@netlify/functions'

/**
 * 小红书API代理 - 解决CORS跨域问题
 * 支持搜索小红书笔记
 */

const handler: Handler = async (event) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // 处理OPTIONS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    const { action, keyword, limit } = event.queryStringParameters || {}

    // 从环境变量获取配置
    const XIAOHONGSHU_API_URL = process.env.XIAOHONGSHU_API_URL
    const XIAOHONGSHU_API_KEY = process.env.XIAOHONGSHU_API_KEY

    // 如果没有配置API，返回模拟数据
    if (!XIAOHONGSHU_API_URL) {
      console.log('⚠️ 未配置小红书API，返回提示信息')
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          useMock: true,
          message: '未配置小红书API，请在Netlify环境变量中设置 XIAOHONGSHU_API_URL 和 XIAOHONGSHU_API_KEY',
          notes: [],
          total: 0,
          hasMore: false
        })
      }
    }

    switch (action) {
      case 'search':
        // 搜索小红书笔记
        if (!keyword) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: '缺少关键词参数' })
          }
        }

        const url = new URL(XIAOHONGSHU_API_URL)
        url.searchParams.append('keyword', keyword)
        url.searchParams.append('limit', limit || '10')

        const requestHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        // 如果有API密钥，添加到请求头
        if (XIAOHONGSHU_API_KEY) {
          requestHeaders['Authorization'] = `Bearer ${XIAOHONGSHU_API_KEY}`
        }

        console.log('🔍 调用小红书API:', keyword)

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: requestHeaders
        })

        if (!response.ok) {
          throw new Error(`小红书API请求失败: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('✅ 小红书API返回成功')

        // 根据实际API格式转换数据
        // 这里假设API返回的格式需要转换
        const result = {
          notes: data.notes || data.data || data.items || [],
          total: data.total || data.count || 0,
          hasMore: data.hasMore || data.has_more || false
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '未知的操作类型' })
        }
    }
  } catch (error) {
    console.error('❌ 小红书API代理错误:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: '服务器错误',
        message: error instanceof Error ? error.message : '未知错误',
        useMock: true  // 告诉前端使用模拟数据
      })
    }
  }
}

export { handler }
