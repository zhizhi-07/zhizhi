/**
 * Cloudflare Worker - QQ音乐API
 * 只使用QQ音乐，不用网易云
 */

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);
    
    // 搜索歌曲
    if (url.pathname === '/api/music/search') {
      const keyword = url.searchParams.get('keyword');
      if (!keyword) {
        return jsonResponse({ error: '缺少关键词' }, 400);
      }

      try {
        const qqUrl = 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp';
        const params = new URLSearchParams({
          ct: '24',
          qqmusic_ver: '1298',
          new_json: '1',
          remoteplace: 'txt.yqq.song',
          searchid: Math.random().toString(),
          t: '0',
          aggr: '1',
          cr: '1',
          catZhida: '1',
          lossless: '0',
          flag_qc: '0',
          p: '1',
          n: '30',
          w: keyword,
          g_tk: '5381',
          loginUin: '0',
          hostUin: '0',
          format: 'json',
          inCharset: 'utf8',
          outCharset: 'utf-8',
          notice: '0',
          platform: 'yqq.json',
          needNewCode: '0'
        });
        
        const response = await fetch(`${qqUrl}?${params}`, {
          headers: {
            'Referer': 'https://y.qq.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const data = await response.json();
        return jsonResponse(data);
      } catch (error) {
        return jsonResponse({ error: '搜索失败' }, 500);
      }
    }
    
    // 获取播放链接
    if (url.pathname === '/api/music/url') {
      const id = url.searchParams.get('id');
      if (!id) {
        return jsonResponse({ error: '缺少ID' }, 400);
      }

      // QQ音乐试听链接
      const playUrl = `https://ws.stream.qqmusic.qq.com/C400${id}.m4a?guid=0&vkey=&uin=0&fromtag=120032`;
      return jsonResponse({ 
        data: [{ url: playUrl }] 
      });
    }
    
    // 健康检查
    if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'QQ音乐API'
      });
    }

    return jsonResponse({ error: '未知路径' }, 404);
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

