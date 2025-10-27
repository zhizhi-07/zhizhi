export default {
  async fetch(req) {
    const url = new URL(req.url)
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Server': 'ZhiZhi-Music-API/1.0', // 自定义服务器标识
      'X-Powered-By': 'ZhiZhi' // 移除真实API痕迹
    }
    
    if (req.method === 'OPTIONS') {
      return new Response(null, {headers: {...headers, 'Access-Control-Allow-Methods': 'GET'}})
    }
    
    // 搜索接口
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword')
      
      // 使用Base64编码隐藏真实API URL
      const apiBase = atob('aHR0cHM6Ly9hcGkudmtleXMuY24vdjIvbXVzaWMvdGVuY2VudA==')
      const api = `${apiBase}?word=${encodeURIComponent(keyword)}&limit=30`
      
      try {
        const res = await fetch(api)
        const data = await res.json()
        
        if (data.code !== 200 || !data.data) {
          return new Response(JSON.stringify({result: {songs: []}}), {headers})
        }
        
        // 转换格式并添加随机延迟（模拟真实服务器）
        await randomDelay()
        
        const songs = data.data.map(s => ({
          id: s.id,
          mid: s.mid,
          name: s.song,
          artists: [{name: s.singer}],
          album: {name: s.album, picUrl: s.cover},
          duration: parseTime(s.interval),
          fee: s.pay === '免费' ? 0 : 1,
          source: 'zhizhi' // 添加自己的标识
        }))
        
        return new Response(JSON.stringify({result: {songs: songs}}), {headers})
      } catch (e) {
        return new Response(JSON.stringify({result: {songs: []}}), {headers})
      }
    }
    
    // 播放链接接口
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id')
      
      try {
        const apiBase = atob('aHR0cHM6Ly9hcGkudmtleXMuY24vdjIvbXVzaWMvdGVuY2VudA==')
        const api = `${apiBase}?id=${id}`
        const res = await fetch(api)
        const data = await res.json()
        
        await randomDelay()
        
        let playUrl = null
        if (data.code === 200 && data.data && data.data.url) {
          playUrl = data.data.url
        }
        
        if (!playUrl) {
          playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
        }
        
        return new Response(JSON.stringify({data: [{url: playUrl}]}), {headers})
      } catch (e) {
        const playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
        return new Response(JSON.stringify({data: [{url: playUrl}]}), {headers})
      }
    }
    
    // 歌词接口
    if (url.pathname === '/api/music/lyric') {
      const id = url.searchParams.get('id')
      
      try {
        const apiBase = atob('aHR0cHM6Ly9hcGkudmtleXMuY24vdjIvbXVzaWMvdGVuY2VudC9seXJpYw==')
        const api = `${apiBase}?id=${id}`
        const res = await fetch(api)
        const data = await res.json()
        
        await randomDelay()
        
        if (data.code === 200 && data.data && data.data.lrc) {
          return new Response(JSON.stringify({lrc: {lyric: data.data.lrc}}), {headers})
        }
        
        return new Response(JSON.stringify({lrc: {lyric: ''}}), {headers})
      } catch (e) {
        return new Response(JSON.stringify({lrc: {lyric: ''}}), {headers})
      }
    }
    
    return new Response(JSON.stringify({
      status: 'ok',
      service: 'ZhiZhi Music API',
      version: '1.0.0'
    }), {headers})
  }
}

function parseTime(timeStr) {
  const match = timeStr.match(/(\d+)分(\d+)秒/)
  if (match) {
    return (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000
  }
  return 0
}

// 添加随机延迟，模拟真实服务器响应时间
function randomDelay() {
  const delay = Math.floor(Math.random() * 100) + 50
  return new Promise(resolve => setTimeout(resolve, delay))
}

