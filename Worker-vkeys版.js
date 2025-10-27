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
    
    // 搜索 - 使用vkeys.cn API
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword')
      const api = `https://api.vkeys.cn/v2/music/tencent?word=${encodeURIComponent(keyword)}&limit=30`
      
      try {
        const res = await fetch(api)
        const vkeysData = await res.json()
        
        if (vkeysData.code !== 200 || !vkeysData.data) {
          return new Response(JSON.stringify({ result: { songs: [] } }), { headers })
        }
        
        // 转换为网易云格式
        const songs = vkeysData.data.map(s => ({
          id: s.mid,  // 使用mid作为ID（播放需要）
          name: s.song,
          artists: [{ name: s.singer }],
          album: {
            name: s.album,
            picUrl: s.cover
          },
          duration: parseTime(s.interval),
          fee: s.pay === '免费' ? 0 : 1
        }))
        
        return new Response(JSON.stringify({
          result: {
            songs: songs,
            songCount: songs.length
          }
        }), { headers })
        
      } catch (e) {
        return new Response(JSON.stringify({ result: { songs: [] } }), { headers })
      }
    }
    
    // 播放链接
    if (url.pathname === '/api/music/url') {
      const mid = url.searchParams.get('id')
      
      try {
        const api = `https://api.vkeys.cn/v2/music/tencent?id=${mid}`
        const res = await fetch(api)
        const data = await res.json()
        
        if (data.code === 200 && data.data && data.data.length > 0) {
          const playUrl = data.data[0].url || `https://ws.stream.qqmusic.qq.com/C400${mid}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
          
          return new Response(JSON.stringify({
            data: [{ id: 0, url: playUrl, br: 320000 }]
          }), { headers })
        }
        
        // 备用播放链接
        const playUrl = `https://ws.stream.qqmusic.qq.com/C400${mid}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
        return new Response(JSON.stringify({
          data: [{ id: 0, url: playUrl, br: 320000 }]
        }), { headers })
        
      } catch (e) {
        const playUrl = `https://ws.stream.qqmusic.qq.com/C400${mid}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
        return new Response(JSON.stringify({
          data: [{ id: 0, url: playUrl, br: 320000 }]
        }), { headers })
      }
    }
    
    return new Response(JSON.stringify({ status: 'ok', service: 'vkeys.cn音乐API' }), { headers })
  }
}

// 解析时间字符串为毫秒
function parseTime(timeStr) {
  const match = timeStr.match(/(\d+)分(\d+)秒/)
  if (match) {
    return (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000
  }
  return 0
}


