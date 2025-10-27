export default {
  async fetch(req) {
    const url = new URL(req.url)
    
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
    
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        headers: {...headers, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Allow-Headers': 'Content-Type'} 
      })
    }
    
    // 搜索 - 转换QQ音乐格式为网易云格式
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword')
      const api = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.song&searchid=${Math.random()}&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=30&w=${encodeURIComponent(keyword)}&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`
      
      try {
        const res = await fetch(api)
        const qqData = await res.json()
        
        // 转换为网易云格式
        const songs = (qqData.data?.song?.list || []).map(s => ({
          id: s.songmid || s.songid,
          name: s.songname || s.name,
          artists: (s.singer || []).map(a => ({ name: a.name })),
          album: {
            name: s.albumname || '未知专辑',
            picUrl: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : ''
          },
          duration: (s.interval || 0) * 1000,
          fee: 0
        }))
        
        const result = {
          result: {
            songs: songs,
            songCount: songs.length
          }
        }
        
        return new Response(JSON.stringify(result), { headers })
      } catch (e) {
        return new Response(JSON.stringify({ result: { songs: [] } }), { headers })
      }
    }
    
    // 播放链接
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id')
      const playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
      
      const result = {
        data: [{ 
          id: parseInt(id) || 0,
          url: playUrl,
          br: 320000
        }]
      }
      
      return new Response(JSON.stringify(result), { headers })
    }
    
    // 健康检查
    return new Response(JSON.stringify({ status: 'ok', service: 'QQ音乐转网易云格式' }), { headers })
  }
}


