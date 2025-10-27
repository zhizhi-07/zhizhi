export default {
  async fetch(req) {
    const url = new URL(req.url)
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    }
    
    if (req.method === 'OPTIONS') {
      return new Response(null, {headers: {...headers, 'Access-Control-Allow-Methods': 'GET'}})
    }
    
    // 搜索接口 - 多API混合 + 差异化处理
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword')
      
      try {
        // 尝试多个API源
        let allSongs = []
        
        // API 1: vkeys.cn (腾讯音乐)
        try {
          const res1 = await fetch(`https://api.vkeys.cn/v2/music/tencent?word=${encodeURIComponent(keyword)}&limit=20`)
          const data1 = await res1.json()
          if (data1.code === 200 && data1.data) {
            allSongs = allSongs.concat(data1.data.map(s => ({
              id: s.id,
              mid: s.mid,
              name: s.song,
              artists: [{name: s.singer}],
              album: {name: s.album, picUrl: s.cover},
              duration: parseTime(s.interval),
              fee: s.pay === '免费' ? 0 : 1,
              source: 'qq',
              popularity: Math.random() // 添加随机权重用于打乱排序
            })))
          }
        } catch (e) {
          console.log('vkeys.cn失败')
        }
        
        // API 2: vkeys.cn (网易云)
        try {
          const res2 = await fetch(`https://api.vkeys.cn/v2/music/netease?word=${encodeURIComponent(keyword)}&limit=20`)
          const data2 = await res2.json()
          if (data2.code === 200 && data2.data) {
            allSongs = allSongs.concat(data2.data.map(s => ({
              id: s.id,
              mid: s.id,
              name: s.song,
              artists: [{name: s.singer}],
              album: {name: s.album, picUrl: s.cover},
              duration: parseTime(s.interval),
              fee: s.pay === '免费' ? 0 : 1,
              source: 'netease',
              popularity: Math.random()
            })))
          }
        } catch (e) {
          console.log('网易云失败')
        }
        
        if (allSongs.length === 0) {
          return new Response(JSON.stringify({result: {songs: []}}), {headers})
        }
        
        // 差异化处理1: 去重（根据歌名+歌手）
        const uniqueSongs = []
        const seen = new Set()
        
        for (const song of allSongs) {
          const key = `${song.name}-${song.artists[0].name}`.toLowerCase()
          if (!seen.has(key)) {
            seen.add(key)
            uniqueSongs.push(song)
          }
        }
        
        // 差异化处理2: 智能排序（混合随机 + 相关度）
        const sortedSongs = uniqueSongs.sort((a, b) => {
          // 优先显示免费歌曲
          if (a.fee !== b.fee) return a.fee - b.fee
          // 然后按名字匹配度（简单实现：包含关键词的优先）
          const aMatch = a.name.includes(keyword) ? 1 : 0
          const bMatch = b.name.includes(keyword) ? 1 : 0
          if (aMatch !== bMatch) return bMatch - aMatch
          // 最后随机打乱
          return b.popularity - a.popularity
        })
        
        // 差异化处理3: 返回15-25首（随机数量，不固定10首）
        const randomLimit = Math.floor(Math.random() * 11) + 15 // 15-25
        const finalSongs = sortedSongs.slice(0, randomLimit)
        
        return new Response(JSON.stringify({
          result: {
            songs: finalSongs,
            songCount: finalSongs.length
          }
        }), {headers})
      } catch (e) {
        return new Response(JSON.stringify({result: {songs: []}}), {headers})
      }
    }
    
    // 播放链接 - 智能选择最佳源
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id')
      
      try {
        // 优先尝试vkeys获取真实播放链接
        const res = await fetch(`https://api.vkeys.cn/v2/music/tencent?id=${id}`)
        const data = await res.json()
        
        if (data.code === 200 && data.data && data.data.url) {
          return new Response(JSON.stringify({data: [{url: data.data.url}]}), {headers})
        }
        
        // 备用：试听链接
        const playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
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
        const res = await fetch(`https://api.vkeys.cn/v2/music/tencent/lyric?id=${id}`)
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
  if (!timeStr) return 0
  const match = timeStr.match(/(\d+)分(\d+)秒/)
  if (match) {
    return (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000
  }
  // 支持秒数格式
  const seconds = parseInt(timeStr)
  if (!isNaN(seconds)) {
    return seconds * 1000
  }
  return 0
}

