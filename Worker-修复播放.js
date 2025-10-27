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
    
    // 搜索
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword')
      const api = `https://api.vkeys.cn/v2/music/tencent?word=${encodeURIComponent(keyword)}&limit=30`
      
      try {
        const res = await fetch(api)
        const vkeysData = await res.json()
        
        if (vkeysData.code !== 200 || !vkeysData.data) {
          return new Response(JSON.stringify({ result: { songs: [] } }), { headers })
        }
        
        // 转换格式，同时保存数字ID（用于播放）
        const songs = vkeysData.data.map(s => ({
          id: s.id,  // 使用数字ID（播放需要）
          mid: s.mid,  // 保存mid备用
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
      const id = url.searchParams.get('id')
      
      try {
        // 使用vkeys获取真实播放链接
        const api = `https://api.vkeys.cn/v2/music/tencent?id=${id}`
        const res = await fetch(api)
        const vkeysData = await res.json()
        
        let playUrl = null
        
        if (vkeysData.code === 200 && vkeysData.data) {
          // vkeys返回的是对象，不是数组
          playUrl = vkeysData.data.url
        }
        
        // 如果vkeys没有返回URL，使用备用链接
        if (!playUrl) {
          playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
        }
        
        return new Response(JSON.stringify({
          data: [{ id: parseInt(id) || 0, url: playUrl, br: 320000 }]
        }), { headers })
        
      } catch (e) {
        // 错误时使用备用链接
        const playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
        return new Response(JSON.stringify({
          data: [{ id: parseInt(id) || 0, url: playUrl, br: 320000 }]
        }), { headers })
      }
    }
    
    return new Response(JSON.stringify({ status: 'ok' }), { headers })
  }
}

function parseTime(timeStr) {
  const match = timeStr.match(/(\d+)分(\d+)秒/)
  if (match) {
    return (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000
  }
  return 0
}


