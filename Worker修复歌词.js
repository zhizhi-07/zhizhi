export default {
  async fetch(req) {
    const url = new URL(req.url)
    const headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}
    
    if (req.method === 'OPTIONS') {
      return new Response(null, {headers: {...headers, 'Access-Control-Allow-Methods': 'GET'}})
    }
    
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword')
      const api = 'https://api.vkeys.cn/v2/music/tencent?word=' + encodeURIComponent(keyword) + '&limit=30'
      
      try {
        const res = await fetch(api)
        const data = await res.json()
        
        if (data.code !== 200 || !data.data) {
          return new Response(JSON.stringify({result: {songs: []}}), {headers})
        }
        
        const songs = data.data.map(s => ({
          id: s.id,
          mid: s.mid,
          name: s.song,
          artists: [{name: s.singer}],
          album: {name: s.album, picUrl: s.cover},
          duration: parseTime(s.interval),
          fee: s.pay === '免费' ? 0 : 1
        }))
        
        return new Response(JSON.stringify({result: {songs: songs}}), {headers})
      } catch (e) {
        return new Response(JSON.stringify({result: {songs: []}}), {headers})
      }
    }
    
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id')
      
      try {
        const api = 'https://api.vkeys.cn/v2/music/tencent?id=' + id
        const res = await fetch(api)
        const data = await res.json()
        
        let playUrl = null
        if (data.code === 200 && data.data && data.data.url) {
          playUrl = data.data.url
        }
        
        if (!playUrl) {
          playUrl = 'https://ws.stream.qqmusic.qq.com/C400' + id + '.m4a?guid=0&vkey=&uin=0&fromtag=120032'
        }
        
        return new Response(JSON.stringify({data: [{url: playUrl}]}), {headers})
      } catch (e) {
        const playUrl = 'https://ws.stream.qqmusic.qq.com/C400' + id + '.m4a?guid=0&vkey=&uin=0&fromtag=120032'
        return new Response(JSON.stringify({data: [{url: playUrl}]}), {headers})
      }
    }
    
    if (url.pathname === '/api/music/lyric') {
      const id = url.searchParams.get('id')
      
      try {
        const api = 'https://api.vkeys.cn/v2/music/tencent/lyric?id=' + id
        const res = await fetch(api)
        const data = await res.json()
        
        if (data.code === 200 && data.data && data.data.lrc) {
          return new Response(JSON.stringify({lrc: {lyric: data.data.lrc}}), {headers})
        }
        
        return new Response(JSON.stringify({lrc: {lyric: ''}}), {headers})
      } catch (e) {
        return new Response(JSON.stringify({lrc: {lyric: ''}}), {headers})
      }
    }
    
    return new Response(JSON.stringify({status: 'ok'}), {headers})
  }
}

function parseTime(timeStr) {
  const match = timeStr.match(/(\d+)分(\d+)秒/)
  if (match) {
    return (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000
  }
  return 0
}


