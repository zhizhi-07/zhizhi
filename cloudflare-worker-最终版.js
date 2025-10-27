/**
 * 使用开源网易云音乐API服务
 * 这些是已经部署好的公开服务，直接能用
 */

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return cors();
    }

    const url = new URL(request.url);
    
    // 搜索歌曲
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword');
      if (!keyword) return jsonResponse({ error: '缺少关键词' }, 400);

      const api = `https://netease-cloud-music-api-psi-pink.vercel.app/search?keywords=${encodeURIComponent(keyword)}&limit=30`;
      
      try {
        const res = await fetch(api);
        const data = await res.json();
        return jsonResponse(data);
      } catch (e) {
        return jsonResponse({ error: '搜索失败' }, 500);
      }
    }
    
    // 获取播放链接
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id');
      if (!id) return jsonResponse({ error: '缺少ID' }, 400);

      const api = `https://netease-cloud-music-api-psi-pink.vercel.app/song/url?id=${id}`;
      
      try {
        const res = await fetch(api);
        const data = await res.json();
        return jsonResponse(data);
      } catch (e) {
        return jsonResponse({ error: '获取失败' }, 500);
      }
    }
    
    // 获取歌词
    if (url.pathname === '/api/music/lyric') {
      const id = url.searchParams.get('id');
      if (!id) return jsonResponse({ error: '缺少ID' }, 400);

      const api = `https://netease-cloud-music-api-psi-pink.vercel.app/lyric?id=${id}`;
      
      try {
        const res = await fetch(api);
        const data = await res.json();
        return jsonResponse(data);
      } catch (e) {
        return jsonResponse({ error: '获取失败' }, 500);
      }
    }
    
    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        service: '音乐API代理',
        note: '使用开源网易云API服务'
      });
    }

    return jsonResponse({ error: '未知路径' }, 404);
  }
};

function cors() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

