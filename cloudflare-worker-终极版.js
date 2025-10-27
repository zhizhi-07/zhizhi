/**
 * 使用MetingJS的免费API
 * 这个是稳定的公开服务
 */

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    const url = new URL(request.url);
    
    // 搜索
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword');
      if (!keyword) return json({ error: '缺少关键词' }, 400);

      try {
        // 使用公开的Meting API
        const api = `https://api.i-meto.com/meting/api?server=netease&type=search&id=${encodeURIComponent(keyword)}`;
        const res = await fetch(api);
        const songs = await res.json();
        
        // 转换为网易云格式
        const result = {
          result: {
            songs: songs.map(s => ({
              id: parseInt(s.id),
              name: s.name,
              artists: [{ name: s.artist }],
              album: { name: s.album, picUrl: s.pic },
              duration: s.time * 1000,
              fee: 0
            }))
          }
        };
        
        return json(result);
      } catch (e) {
        return json({ error: '搜索失败' }, 500);
      }
    }
    
    // 播放链接
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: '缺少ID' }, 400);

      try {
        const api = `https://api.i-meto.com/meting/api?server=netease&type=url&id=${id}`;
        const res = await fetch(api);
        const data = await res.json();
        
        // 转换格式
        const result = {
          data: data.map(d => ({
            id: parseInt(d.id),
            url: d.url,
            br: 320000
          }))
        };
        
        return json(result);
      } catch (e) {
        return json({ error: '获取失败' }, 500);
      }
    }
    
    // 歌词
    if (url.pathname === '/api/music/lyric') {
      const id = url.searchParams.get('id');
      if (!id) return json({ error: '缺少ID' }, 400);

      try {
        const api = `https://api.i-meto.com/meting/api?server=netease&type=lyric&id=${id}`;
        const res = await fetch(api);
        const data = await res.json();
        
        const result = {
          lrc: { lyric: data.lyric || '' }
        };
        
        return json(result);
      } catch (e) {
        return json({ error: '获取失败' }, 500);
      }
    }
    
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ status: 'ok', service: 'Meting音乐API' });
    }

    return json({ error: '未知路径' }, 404);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

