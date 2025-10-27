/**
 * Cloudflare Worker - 音乐API代理
 * 解决CORS跨域问题，支持网易云音乐搜索
 * 部署地址：https://zhizhi-api.2373922440jhj.workers.dev
 */

export default {
  async fetch(request) {
    // CORS 预检
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
    
    // 路由处理
    if (url.pathname === '/api/music/search') {
      return handleMusicSearch(url);
    } else if (url.pathname === '/api/music/url') {
      return handleMusicUrl(url);
    } else if (url.pathname === '/api/music/lyric') {
      return handleMusicLyric(url);
    } else if (url.pathname === '/' || url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        service: '音乐API代理',
        endpoints: [
          '/api/music/search?keyword=歌曲名',
          '/api/music/url?id=歌曲ID',
          '/api/music/lyric?id=歌曲ID'
        ]
      });
    }

    return jsonResponse({ error: '未知的路径' }, 404);
  }
};

// 搜索歌曲
async function handleMusicSearch(url) {
  const keyword = url.searchParams.get('keyword');
  
  if (!keyword) {
    return jsonResponse({ error: '缺少关键词参数' }, 400);
  }

  try {
    const apiUrl = 'https://music.163.com/api/search/get/web';
    const params = new URLSearchParams({
      s: keyword,
      type: '1',
      offset: '0',
      limit: '30'
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = await response.json();
    return jsonResponse(data);

  } catch (error) {
    return jsonResponse({ 
      error: '搜索失败',
      message: error.message 
    }, 500);
  }
}

// 获取播放URL
async function handleMusicUrl(url) {
  const id = url.searchParams.get('id');
  
  if (!id) {
    return jsonResponse({ error: '缺少歌曲ID参数' }, 400);
  }

  try {
    const apiUrl = 'https://music.163.com/api/song/enhance/player/url';
    const params = new URLSearchParams({
      id: id,
      ids: `[${id}]`,
      br: '320000'
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = await response.json();
    return jsonResponse(data);

  } catch (error) {
    return jsonResponse({ 
      error: '获取播放链接失败',
      message: error.message 
    }, 500);
  }
}

// 获取歌词
async function handleMusicLyric(url) {
  const id = url.searchParams.get('id');
  
  if (!id) {
    return jsonResponse({ error: '缺少歌曲ID参数' }, 400);
  }

  try {
    const apiUrl = 'https://music.163.com/api/song/lyric';
    const params = new URLSearchParams({
      id: id,
      lv: '-1',
      tv: '-1'
    });

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = await response.json();
    return jsonResponse(data);

  } catch (error) {
    return jsonResponse({ 
      error: '获取歌词失败',
      message: error.message 
    }, 500);
  }
}

// JSON 响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

