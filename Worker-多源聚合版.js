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
    
    // 搜索接口 - 多API源聚合
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword')
      let allSongs = []
      
      // API源列表（按优先级排序）
      const apiSources = [
        {
          name: 'vkeys-qq',
          fetch: async () => {
            const res = await fetch(`https://api.vkeys.cn/v2/music/tencent?word=${encodeURIComponent(keyword)}&limit=50`, {signal: AbortSignal.timeout(5000)})
            const data = await res.json()
            if (data.code === 200 && data.data) {
              return data.data.map(s => ({
                id: s.id,
                mid: s.mid,
                name: s.song,
                artists: [{name: s.singer}],
                album: {name: s.album, picUrl: s.cover},
                duration: parseTime(s.interval),
                fee: s.pay === '免费' ? 0 : 1,
                source: 'qq'
              }))
            }
            return []
          }
        },
        {
          name: 'vkeys-netease',
          fetch: async () => {
            const res = await fetch(`https://api.vkeys.cn/v2/music/netease?word=${encodeURIComponent(keyword)}&limit=50`, {signal: AbortSignal.timeout(5000)})
            const data = await res.json()
            if (data.code === 200 && data.data) {
              return data.data.map(s => ({
                id: s.id,
                mid: s.id,
                name: s.song,
                artists: [{name: s.singer}],
                album: {name: s.album, picUrl: s.cover},
                duration: parseTime(s.interval),
                fee: s.pay === '免费' ? 0 : 1,
                source: 'netease'
              }))
            }
            return []
          }
        },
        {
          name: 'apiopen',
          fetch: async () => {
            const res = await fetch(`https://api.apiopen.top/searchMusic?name=${encodeURIComponent(keyword)}`, {signal: AbortSignal.timeout(5000)})
            const data = await res.json()
            if (data.code === 200 && data.result) {
              return data.result.map(s => ({
                id: s.songid,
                mid: s.songid,
                name: s.title,
                artists: [{name: s.author}],
                album: {name: '', picUrl: s.pic},
                duration: 0,
                fee: 0,
                source: 'netease'
              }))
            }
            return []
          }
        },
        {
          name: 'netease-direct',
          fetch: async () => {
            const res = await fetch(`https://music.163.com/api/search/get/web?s=${encodeURIComponent(keyword)}&type=1&limit=50`, {signal: AbortSignal.timeout(5000)})
            const data = await res.json()
            if (data.result && data.result.songs) {
              return data.result.songs.map(s => ({
                id: s.id,
                mid: s.id,
                name: s.name,
                artists: s.artists.map(a => ({name: a.name})),
                album: {name: s.album.name, picUrl: s.album.picUrl ? s.album.picUrl.replace('http://', 'https://') : ''},
                duration: s.duration,
                fee: s.fee || 0,
                source: 'netease'
              }))
            }
            return []
          }
        }
      ]
      
      // 并行请求所有API源
      const results = await Promise.allSettled(
        apiSources.map(source => 
          source.fetch().catch(e => {
            console.log(`${source.name} 失败:`, e.message)
            return []
          })
        )
      )
      
      // 合并所有成功的结果
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          console.log(`${apiSources[index].name} 成功获取 ${result.value.length} 首`)
          allSongs = allSongs.concat(result.value.map(song => ({
            ...song,
            popularity: Math.random() // 随机权重用于排序
          })))
        }
      })
      
      if (allSongs.length === 0) {
        return new Response(JSON.stringify({result: {songs: []}}), {headers})
      }
      
      // 去重（根据歌名+歌手）
      const uniqueSongs = []
      const seen = new Set()
      
      for (const song of allSongs) {
        const artistName = song.artists[0]?.name || ''
        const key = `${song.name}-${artistName}`.toLowerCase()
        if (!seen.has(key)) {
          seen.add(key)
          uniqueSongs.push(song)
        }
      }
      
      // 智能排序
      const sortedSongs = uniqueSongs.sort((a, b) => {
        // 1. 免费歌曲优先
        if (a.fee !== b.fee) return a.fee - b.fee
        // 2. 完全匹配关键词的优先
        const aExact = a.name === keyword ? 1 : 0
        const bExact = b.name === keyword ? 1 : 0
        if (aExact !== bExact) return bExact - aExact
        // 3. 包含关键词的优先
        const aMatch = a.name.includes(keyword) ? 1 : 0
        const bMatch = b.name.includes(keyword) ? 1 : 0
        if (aMatch !== bMatch) return bMatch - aMatch
        // 4. 随机打乱
        return b.popularity - a.popularity
      })
      
      // 返回40-50首歌曲（增加数量）
      let finalSongs
      if (sortedSongs.length < 40) {
        finalSongs = sortedSongs
      } else {
        const randomLimit = Math.floor(Math.random() * 11) + 40 // 40-50首
        finalSongs = sortedSongs.slice(0, Math.min(randomLimit, sortedSongs.length))
      }
      
      return new Response(JSON.stringify({
        result: {
          songs: finalSongs,
          songCount: finalSongs.length
        }
      }), {headers})
    }
    
    // 播放链接 - 多源尝试
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id')
      
      // 尝试多个播放源
      const playSources = [
        async () => {
          const res = await fetch(`https://api.vkeys.cn/v2/music/tencent?id=${id}`, {signal: AbortSignal.timeout(5000)})
          const data = await res.json()
          if (data.code === 200 && data.data && data.data.url) {
            // 强制转换为HTTPS，避免混合内容警告
            return data.data.url.replace('http://', 'https://')
          }
          return null
        },
        async () => {
          const res = await fetch(`https://api.apiopen.top/musicDetails?id=${id}`, {signal: AbortSignal.timeout(5000)})
          const data = await res.json()
          if (data.code === 200 && data.result && data.result.url) {
            // 强制转换为HTTPS
            return data.result.url.replace('http://', 'https://')
          }
          return null
        },
        async () => {
          // 备用：QQ音乐试听链接
          return `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
        }
      ]
      
      for (const source of playSources) {
        try {
          const playUrl = await source()
          if (playUrl) {
            return new Response(JSON.stringify({data: [{url: playUrl}]}), {headers})
          }
        } catch (e) {
          // 静默失败，不输出日志
        }
      }
      
      // 最终备用
      const fallbackUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`
      return new Response(JSON.stringify({data: [{url: fallbackUrl}]}), {headers})
    }
    
    // 歌词接口 - 多源尝试，智能兼容数字ID和字符串mid
    if (url.pathname === '/api/music/lyric') {
      const id = url.searchParams.get('id')
      
      const lyricSources = [
        async () => {
          // 尝试使用数字ID（vkeys要求数字ID）
          const res = await fetch(`https://api.vkeys.cn/v2/music/tencent/lyric?id=${id}`, {signal: AbortSignal.timeout(5000)})
          const data = await res.json()
          if (data.code === 200 && data.data && data.data.lrc) {
            return data.data.lrc
          }
          return null
        },
        async () => {
          // 网易云API（也需要数字ID）
          const res = await fetch(`https://music.163.com/api/song/lyric?id=${id}&lv=-1&tv=-1`, {signal: AbortSignal.timeout(5000)})
          const data = await res.json()
          if (data.lrc && data.lrc.lyric) {
            return data.lrc.lyric
          }
          return null
        }
      ]
      
      for (const source of lyricSources) {
        try {
          const lyric = await source()
          if (lyric) {
            return new Response(JSON.stringify({lrc: {lyric: lyric}}), {headers})
          }
        } catch (e) {
          console.log('歌词源失败:', e.message)
        }
      }
      
      return new Response(JSON.stringify({lrc: {lyric: ''}}), {headers})
    }
    
    return new Response(JSON.stringify({
      status: 'ok',
      service: 'ZhiZhi Music API',
      version: '2.0-Multi-Source'
    }), {headers})
  }
}

function parseTime(timeStr) {
  if (!timeStr) return 0
  const match = timeStr.match(/(\d+)分(\d+)秒/)
  if (match) {
    return (parseInt(match[1]) * 60 + parseInt(match[2])) * 1000
  }
  const seconds = parseInt(timeStr)
  if (!isNaN(seconds)) {
    return seconds * 1000
  }
  return 0
}

