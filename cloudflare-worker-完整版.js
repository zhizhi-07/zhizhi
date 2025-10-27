/**
 * Cloudflare Worker - 完整版
 * 功能1：Gemini API 反代（10个Key轮询）
 * 功能2：音乐API代理（解决CORS）
 */

// ==================== Gemini Keys ====================
const GEMINI_KEYS = [
  'AIzaSyBl5MSzflWp6TCKo_U00114Cg89i94Wi54',
  'AIzaSyAa6toT9ndAXelAZfsG2hR0YK_-Ci0OSd4',
  'AIzaSyDV3agQoqV0LVHT67P-76LBXWcbU67WDfI',
  'AIzaSyBrj3M-GEBoCoIWA14-Pf11hohz2dwAOMQ',
  'AIzaSyBDwuqa8HS_Pg25GmyUwlRNEjgPMCJzcaU',
  'AIzaSyAsn5_s4PjEj2NvtcGN6uEn4dL8vi7lvPA',
  'AIzaSyDyJ8-QTx6DoDjBMrhlWopSXvu2CSfvurE',
  'AIzaSyA0G9DoemmvjLp4qFALDgAa8HHZH9AB4aw',
  'AIzaSyAlh-w8IFa0vEow2ZOcIhIF9suir7rAl1g',
  'AIzaSyCIKZrjF9zYhvI7-ZHTRd36ih6U2SgLEq4',
];

const ACCESS_PASSWORD = '';

let currentKeyIndex = 0;
const keyStatus = GEMINI_KEYS.map(() => ({ 
  failures: 0, 
  lastFailTime: 0,
  lastUseTime: 0,
  totalRequests: 0,
  successRequests: 0
}));

// ==================== Gemini相关函数 ====================

function getNextKey() {
  const now = Date.now();
  const MIN_INTERVAL = 2000;
  let bestIndex = -1;
  let longestIdleTime = 0;
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const index = (currentKeyIndex + i) % GEMINI_KEYS.length;
    const status = keyStatus[index];
    
    if (status.failures > 3) {
      const timeSinceLastFail = now - status.lastFailTime;
      if (timeSinceLastFail < 120000) {
        continue;
      } else {
        status.failures = 0;
      }
    }
    
    const idleTime = now - status.lastUseTime;
    
    if (idleTime >= MIN_INTERVAL) {
      if (idleTime > longestIdleTime) {
        longestIdleTime = idleTime;
        bestIndex = index;
      }
    }
  }
  
  if (bestIndex !== -1) {
    currentKeyIndex = (bestIndex + 1) % GEMINI_KEYS.length;
    keyStatus[bestIndex].lastUseTime = now;
    return { key: GEMINI_KEYS[bestIndex], index: bestIndex };
  }
  
  let maxIdleIndex = 0;
  let maxIdleTime = 0;
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const idleTime = now - keyStatus[i].lastUseTime;
    if (idleTime > maxIdleTime && keyStatus[i].failures <= 3) {
      maxIdleTime = idleTime;
      maxIdleIndex = i;
    }
  }
  
  keyStatus[maxIdleIndex].lastUseTime = now;
  currentKeyIndex = (maxIdleIndex + 1) % GEMINI_KEYS.length;
  return { key: GEMINI_KEYS[maxIdleIndex], index: maxIdleIndex };
}

function recordKeyResult(index, success) {
  const status = keyStatus[index];
  status.totalRequests++;
  
  if (success) {
    status.successRequests++;
    status.failures = Math.max(0, status.failures - 1);
  } else {
    status.failures++;
    status.lastFailTime = Date.now();
  }
}

async function proxyToGemini(request, url, apiKey) {
  const params = new URLSearchParams(url.search);
  params.set('key', apiKey);
  
  const targetUrl = `https://generativelanguage.googleapis.com${url.pathname}?${params.toString()}`;

  const headers = new Headers(request.headers);
  headers.delete('Host');
  headers.delete('X-Access-Password');
  headers.delete('x-goog-api-key');

  return await fetch(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
  });
}

// ==================== 音乐API相关函数 ====================

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

// ==================== 主函数 ====================

export default {
  async fetch(request, env, ctx) {
    // CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Access-Password, x-goog-api-key',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    const url = new URL(request.url);

    // ========== 音乐API路由 ==========
    if (url.pathname.startsWith('/api/music/')) {
      if (url.pathname === '/api/music/search') {
        return handleMusicSearch(url);
      } else if (url.pathname === '/api/music/url') {
        return handleMusicUrl(url);
      } else if (url.pathname === '/api/music/lyric') {
        return handleMusicLyric(url);
      }
    }

    // ========== 健康检查 ==========
    if (url.pathname === '/health' || url.pathname === '/') {
      const now = Date.now();
      const stats = keyStatus.map((s, i) => ({
        key: `Key ${i + 1}`,
        total: s.totalRequests,
        success: s.successRequests,
        failures: s.failures,
        successRate: s.totalRequests > 0 
          ? ((s.successRequests / s.totalRequests) * 100).toFixed(2) + '%'
          : '0%',
        idleTime: s.lastUseTime > 0 ? `${Math.floor((now - s.lastUseTime) / 1000)}s` : 'never used',
        status: s.failures > 3 ? '🔴 冷却中' : '🟢 可用'
      }));
      
      return jsonResponse({
        status: 'ok',
        services: {
          gemini: 'Gemini API 反代',
          music: '音乐API代理'
        },
        endpoints: {
          gemini: '/v1beta/..., /v1/...',
          music: [
            '/api/music/search?keyword=歌曲名',
            '/api/music/url?id=歌曲ID',
            '/api/music/lyric?id=歌曲ID'
          ]
        },
        totalKeys: GEMINI_KEYS.length,
        timestamp: new Date().toISOString(),
        stats: stats
      });
    }

    // ========== Gemini API 反代 ==========
    if (url.pathname.startsWith('/v1beta/') || url.pathname.startsWith('/v1/')) {
      // 验证密码
      if (ACCESS_PASSWORD) {
        const password = request.headers.get('X-Access-Password');
        if (password !== ACCESS_PASSWORD) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }
      }

      // 尝试多个Key
      const maxRetries = Math.min(3, GEMINI_KEYS.length);
      let lastError = null;

      for (let i = 0; i < maxRetries; i++) {
        const { key, index } = getNextKey();

        try {
          const response = await proxyToGemini(request, url, key);
          
          if (response.ok) {
            recordKeyResult(index, true);
            return addCorsHeaders(response);
          }
          
          if (response.status >= 400 && response.status < 500) {
            recordKeyResult(index, false);
            return addCorsHeaders(response);
          }
          
          recordKeyResult(index, false);
          lastError = await response.text();
          
        } catch (error) {
          recordKeyResult(index, false);
          lastError = error.message;
        }
      }

      return jsonResponse({
        error: 'All API keys failed',
        lastError: lastError
      }, 503);
    }

    // 未知路径
    return jsonResponse({ 
      error: 'Invalid path',
      availablePaths: {
        gemini: '/v1beta/..., /v1/...',
        music: '/api/music/search, /api/music/url, /api/music/lyric',
        health: '/health'
      }
    }, 400);
  }
};

// ==================== 工具函数 ====================

function addCorsHeaders(response) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Access-Password, x-goog-api-key');
  return newResponse;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

