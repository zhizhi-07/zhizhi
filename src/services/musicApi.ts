/**
 * 音乐API服务
 * 支持网易云音乐搜索和在线播放
 * 自动切换到备用API（QQ音乐、酷狗音乐）
 */

import { searchOnlineMusicFallback } from './musicApiFallback'

export interface OnlineSong {
  id: number
  name: string
  artists: string
  album: string
  duration: number
  cover: string
  url?: string
  fee?: number // 0: 免费, 1: VIP, 4: 购买, 8: 非会员可免费播放低音质
}

interface NetEaseSong {
  id: number
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    picUrl: string
  }
  duration: number
  fee: number
}

/**
 * 搜索歌曲（网易云音乐）
 * 开发环境使用Vite代理，生产环境使用Cloudflare Worker
 * 失败时自动切换到备用API（QQ音乐）
 */
export async function searchOnlineMusic(keyword: string, limit: number = 30): Promise<OnlineSong[]> {
  try {
    console.log('🔍 尝试使用网易云API搜索:', keyword)
    
    // 根据环境选择API URL
    const isDev = import.meta.env.DEV
    const workerUrl = import.meta.env.VITE_WORKER_URL
    let apiUrl: string
    let params: URLSearchParams
    
    if (isDev) {
      // 开发环境：使用Vite代理
      apiUrl = `/api/netease/search/get/web`
      params = new URLSearchParams({
        s: keyword,
        type: '1',
        offset: '0',
        limit: limit.toString()
      })
    } else if (workerUrl) {
      // 生产环境：优先使用Cloudflare Worker
      console.log('🌐 使用Cloudflare Worker:', workerUrl)
      apiUrl = `${workerUrl}/api/music/search`
      params = new URLSearchParams({
        keyword: keyword
      })
    } else {
      // 备用：使用Netlify Function
      apiUrl = `/.netlify/functions/music-api`
      params = new URLSearchParams({
        action: 'search',
        keyword: keyword,
        limit: limit.toString()
      })
    }

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error('网易云API请求失败')
    }

    const data = await response.json()
    
    if (data.result && data.result.songs) {
      console.log('✅ 网易云搜索成功，找到', data.result.songs.length, '首')
      return data.result.songs.map((song: NetEaseSong) => ({
        id: song.id,
        name: song.name,
        artists: song.artists.map((a: any) => a.name).join(' / '),
        album: song.album.name,
        duration: Math.floor(song.duration / 1000),
        cover: song.album.picUrl,
        fee: song.fee
      }))
    }

    throw new Error('网易云API返回空结果')
  } catch (error) {
    console.log('⚠️ 网易云API失败，切换到QQ音乐:', error)
    
    // 自动切换到QQ音乐
    try {
      const fallbackResults = await searchOnlineMusicFallback(keyword, limit)
      if (fallbackResults.length > 0) {
        return fallbackResults
      }
    } catch (fallbackError) {
      console.error('❌ QQ音乐也失败了:', fallbackError)
    }
    
    return []
  }
}

/**
 * 获取歌曲播放URL
 * 注意：网易云音乐的部分歌曲可能有版权限制
 */
export async function getSongUrl(id: number): Promise<string | null> {
  try {
    const isDev = import.meta.env.DEV
    const workerUrl = import.meta.env.VITE_WORKER_URL
    let apiUrl: string
    let params: URLSearchParams
    
    if (isDev) {
      // 开发环境：使用Vite代理
      apiUrl = `/api/netease/song/enhance/player/url`
      params = new URLSearchParams({
        id: id.toString(),
        ids: `[${id}]`,
        br: '320000'
      })
    } else if (workerUrl) {
      // 生产环境：使用Cloudflare Worker
      apiUrl = `${workerUrl}/api/music/url`
      params = new URLSearchParams({
        id: id.toString()
      })
    } else {
      // 备用：使用Netlify Function
      apiUrl = `/.netlify/functions/music-api`
      params = new URLSearchParams({
        action: 'url',
        id: id.toString()
      })
    }

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.data && data.data.length > 0 && data.data[0].url) {
      return data.data[0].url
    }

    return null
  } catch (error) {
    console.error('获取播放链接失败:', error)
    return null
  }
}

/**
 * 获取歌词
 */
export async function getLyric(id: number): Promise<string | null> {
  try {
    const isDev = import.meta.env.DEV
    const workerUrl = import.meta.env.VITE_WORKER_URL
    let apiUrl: string
    let params: URLSearchParams
    
    if (isDev) {
      // 开发环境：使用Vite代理
      apiUrl = `/api/netease/song/lyric`
      params = new URLSearchParams({
        id: id.toString(),
        lv: '-1',
        tv: '-1'
      })
    } else if (workerUrl) {
      // 生产环境：使用Cloudflare Worker
      apiUrl = `${workerUrl}/api/music/lyric`
      params = new URLSearchParams({
        id: id.toString()
      })
    } else {
      // 备用：使用Netlify Function
      apiUrl = `/.netlify/functions/music-api`
      params = new URLSearchParams({
        action: 'lyric',
        id: id.toString()
      })
    }

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.lrc && data.lrc.lyric) {
      return data.lrc.lyric
    }

    return null
  } catch (error) {
    console.error('获取歌词失败:', error)
    return null
  }
}
