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
 * 开发环境使用Vite代理，生产环境使用Netlify Function
 * 失败时自动切换到备用API（QQ音乐）
 */
export async function searchOnlineMusic(keyword: string, limit: number = 30): Promise<OnlineSong[]> {
  try {
    console.log('🔍 尝试使用网易云API搜索:', keyword)
    
    // 使用公共API（支持CORS，无需后端代理）
    const apiUrl = 'https://api.injahow.cn/meting/'
    const params = new URLSearchParams({
      server: 'netease',
      type: 'search',
      id: keyword,
      r: Math.random().toString()
    })

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error('网易云API请求失败')
    }

    const data = await response.json()
    
    // 公共API直接返回数组
    if (Array.isArray(data) && data.length > 0) {
      console.log('✅ 音乐搜索成功，找到', data.length, '首')
      return data.slice(0, limit).map((song: any) => ({
        id: parseInt(song.id) || 0,
        name: song.name || song.title || '未知歌曲',
        artists: song.artist || song.artists || '未知歌手',
        album: song.album || '未知专辑',
        duration: parseInt(song.duration) || 0,
        cover: song.pic || song.cover || '',
        fee: 0
      }))
    }

    throw new Error('音乐API返回空结果')
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
    // 使用公共API获取播放链接
    const apiUrl = 'https://api.injahow.cn/meting/'
    const params = new URLSearchParams({
      server: 'netease',
      type: 'url',
      id: id.toString(),
      r: Math.random().toString()
    })

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    // 公共API返回数组，第一项包含URL
    if (Array.isArray(data) && data.length > 0 && data[0].url) {
      return data[0].url
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
    // 使用公共API获取歌词
    const apiUrl = 'https://api.injahow.cn/meting/'
    const params = new URLSearchParams({
      server: 'netease',
      type: 'lrc',
      id: id.toString(),
      r: Math.random().toString()
    })

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    // 公共API返回数组，第一项包含歌词
    if (Array.isArray(data) && data.length > 0 && data[0].lrc) {
      return data[0].lrc
    }

    return null
  } catch (error) {
    console.error('获取歌词失败:', error)
    return null
  }
}
