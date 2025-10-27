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
      const api = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=txt.yqq.song&searchid=${Math.random()}&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=1&n=30&w=${encodeURIComponent(keyword)}&g_tk=5381&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq.json&needNewCode=0`
      
      try {
        const res = await fetch(api)
        const qqData = await res.json()
        
        // 调试：返回原始QQ音乐数据，看看到底返回了什么
        return new Response(JSON.stringify({
          debug: true,
          keyword: keyword,
          qqApiUrl: api,
          qqResponse: qqData,
          songCount: qqData.data?.song?.list?.length || 0
        }), { headers })
        
      } catch (e) {
        return new Response(JSON.stringify({ 
          error: e.message,
          keyword: keyword 
        }), { headers })
      }
    }
    
    // 播放链接
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id')
      const playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
      return new Response(JSON.stringify({ 
        data: [{ id: parseInt(id) || 0, url: playUrl, br: 320000 }] 
      }), { headers })
    }
    
    return new Response(JSON.stringify({ status: 'ok' }), { headers })
  }
}


