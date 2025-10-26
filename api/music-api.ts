import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * 音乐API代理 - 解决CORS跨域问题
 * 支持网易云音乐搜索、获取播放链接、获取歌词
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Content-Type', 'application/json')

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { action, keyword, id, limit } = req.query as Record<string, string>

    // 网易云音乐API基础URL
    const baseUrl = 'https://music.163.com/api'

    let apiUrl = ''
    let params: Record<string, string> = {}

    // 根据不同的action调用不同的API
    switch (action) {
      case 'search':
      case 'search-netease':
        // 搜索歌曲 - 网易云
        if (!keyword) {
          return res.status(400).json({ error: '缺少关键词参数' })
        }
        apiUrl = `${baseUrl}/search/get/web`
        params = {
          s: keyword,
          type: '1',
          offset: '0',
          limit: limit || '30'
        }
        break

      case 'search-qq':
        // 搜索歌曲 - QQ音乐
        if (!keyword) {
          return res.status(400).json({ error: '缺少关键词参数' })
        }
        try {
          const qqUrl = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp'
          const qqParams = new URLSearchParams({
            ct: '24',
            qqmusic_ver: '1298',
            new_json: '1',
            remoteplace: 'txt.yqq.song',
            searchid: Math.random().toString(),
            t: '0',
            aggr: '1',
            cr: '1',
            catZhida: '1',
            lossless: '0',
            flag_qc: '0',
            p: '1',
            n: limit || '30',
            w: keyword,
            g_tk: '5381',
            loginUin: '0',
            hostUin: '0',
            format: 'json',
            inCharset: 'utf8',
            outCharset: 'utf-8',
            notice: '0',
            platform: 'yqq.json',
            needNewCode: '0'
          })
          
          const qqResponse = await fetch(`${qqUrl}?${qqParams}`)
          const qqData = await qqResponse.json()
          
          return res.status(200).json(qqData)
        } catch (error) {
          return res.status(500).json({ error: 'QQ音乐API请求失败' })
        }

      case 'url':
        // 获取播放URL
        if (!id) {
          return res.status(400).json({ error: '缺少歌曲ID参数' })
        }
        apiUrl = `${baseUrl}/song/enhance/player/url`
        params = {
          id: id,
          ids: `[${id}]`,
          br: '320000'
        }
        break

      case 'lyric':
        // 获取歌词
        if (!id) {
          return res.status(400).json({ error: '缺少歌曲ID参数' })
        }
        apiUrl = `${baseUrl}/song/lyric`
        params = {
          id: id,
          lv: '-1',
          tv: '-1'
        }
        break

      default:
        return res.status(400).json({ error: '未知的操作类型' })
    }

    // 构建查询参数
    const queryString = new URLSearchParams(params).toString()
    const fullUrl = `${apiUrl}?${queryString}`

    // 发送请求到网易云API
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`网易云API请求失败: ${response.status}`)
    }

    const data = await response.json()

    return res.status(200).json(data)
  } catch (error) {
    console.error('音乐API代理错误:', error)
    return res.status(500).json({ 
      error: '服务器错误',
      message: error instanceof Error ? error.message : '未知错误'
    })
  }
}
