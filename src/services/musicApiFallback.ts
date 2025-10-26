/**
 * 音乐API备用方案
 * 使用可以直接访问的公开API，无需后端代理
 */

export interface OnlineSong {
  id: number
  name: string
  artists: string
  album: string
  duration: number
  cover: string
  url?: string
  fee?: number
}

/**
 * 使用QQ音乐API搜索（备用方案1）
 * 通过Vite代理避免CORS
 */
async function searchQQMusic(keyword: string, limit: number = 30): Promise<OnlineSong[]> {
  try {
    // 使用Vite代理
    const apiUrl = `/api/qq/soso/fcgi-bin/client_search_cp`
    const params = new URLSearchParams({
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
      n: limit.toString(),
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

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET'
    })

    if (!response.ok) return []

    const data = await response.json()
    
    if (data.data?.song?.list) {
      return data.data.song.list.map((song: any) => ({
        id: song.songmid || song.songid,
        name: song.songname || song.name,
        artists: song.singer?.map((s: any) => s.name).join(' / ') || '未知',
        album: song.albumname || '未知专辑',
        duration: song.interval || 0,
        cover: song.albummid 
          ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${song.albummid}.jpg`
          : '',
        fee: 0
      }))
    }

    return []
  } catch (error) {
    console.error('QQ音乐搜索失败:', error)
    return []
  }
}

/**
 * 酷狗音乐也需要后端代理
 * 暂时不使用，等待后续完善
 */
async function searchKugouMusic(_keyword: string, _limit: number = 30): Promise<OnlineSong[]> {
  console.log('⚠️ 酷狗音乐需要Netlify代理，暂未实现')
  return []
}

/**
 * 混合搜索 - 尝试多个API
 */
export async function searchOnlineMusicFallback(keyword: string, limit: number = 30): Promise<OnlineSong[]> {
  console.log('🔍 使用备用API搜索:', keyword)
  
  // 尝试QQ音乐
  try {
    const qqResults = await searchQQMusic(keyword, limit)
    if (qqResults.length > 0) {
      console.log('✅ QQ音乐搜索成功，找到', qqResults.length, '首')
      return qqResults
    }
  } catch (error) {
    console.log('❌ QQ音乐搜索失败')
  }

  // 尝试酷狗音乐
  try {
    const kugouResults = await searchKugouMusic(keyword, limit)
    if (kugouResults.length > 0) {
      console.log('✅ 酷狗音乐搜索成功，找到', kugouResults.length, '首')
      return kugouResults
    }
  } catch (error) {
    console.log('❌ 酷狗音乐搜索失败')
  }

  console.log('⚠️ 所有备用API都失败')
  return []
}

/**
 * 获取播放URL（备用方案）
 */
export async function getSongUrlFallback(_id: number | string): Promise<string | null> {
  // 注意：这些公开API可能无法直接获取播放链接
  // 建议用户自行上传歌曲或使用付费服务
  console.log('⚠️ 备用API暂不支持获取播放链接，建议将歌曲添加到本地')
  return null
}

/**
 * 获取歌词（备用方案）
 */
export async function getLyricFallback(_id: number | string): Promise<string | null> {
  console.log('⚠️ 备用API暂不支持获取歌词')
  return null
}
