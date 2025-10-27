/**
 * Cloudflare Worker - API代理服务
 * 用于代理各种API请求，解决CORS和网络限制问题
 */

// CORS 头部配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理 CORS 预检请求
function handleOptions() {
  return new Response(null, {
    headers: corsHeaders
  });
}

// 添加 CORS 头部
function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.keys(corsHeaders).forEach(key => {
    newHeaders.set(key, corsHeaders[key]);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理 CORS 预检
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }
    
    try {
      // 1. 音乐搜索API代理 - 使用网易云音乐官方API
      if (url.pathname.startsWith('/api/music/search')) {
        const keyword = url.searchParams.get('keyword');
        if (!keyword) {
          return new Response(JSON.stringify({ error: '缺少关键词' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // 使用网易云音乐官方API（与本地开发环境一致）
        const params = new URLSearchParams({
          s: keyword,
          type: '1',
          offset: '0',
          limit: '30'
        });
        
        const musicUrl = `https://music.163.com/api/search/get/web?${params}`;
        const musicResponse = await fetch(musicUrl, {
          headers: {
            'Referer': 'https://music.163.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        return addCorsHeaders(musicResponse);
      }
      
      // 2. 音乐播放URL - 使用网易云音乐官方API
      if (url.pathname.startsWith('/api/music/url')) {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(JSON.stringify({ error: '缺少歌曲ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const params = new URLSearchParams({
          id: id,
          ids: `[${id}]`,
          br: '320000'
        });
        
        const musicUrl = `https://music.163.com/api/song/enhance/player/url?${params}`;
        const musicResponse = await fetch(musicUrl, {
          headers: {
            'Referer': 'https://music.163.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        return addCorsHeaders(musicResponse);
      }
      
      // 3. 音乐歌词 - 使用网易云音乐官方API
      if (url.pathname.startsWith('/api/music/lyric')) {
        const id = url.searchParams.get('id');
        if (!id) {
          return new Response(JSON.stringify({ error: '缺少歌曲ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const params = new URLSearchParams({
          id: id,
          lv: '-1',
          tv: '-1'
        });
        
        const musicUrl = `https://music.163.com/api/song/lyric?${params}`;
        const musicResponse = await fetch(musicUrl, {
          headers: {
            'Referer': 'https://music.163.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        return addCorsHeaders(musicResponse);
      }
      
      // 4. AI聊天API代理（通用）
      if (url.pathname.startsWith('/api/ai/chat')) {
        const body = await request.json();
        
        // 这里可以代理到你的AI服务
        // 示例：OpenAI, Claude, 通义千问等
        const apiKey = env.AI_API_KEY || body.apiKey;
        const apiUrl = body.apiUrl || 'https://api.openai.com/v1/chat/completions';
        
        const aiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: body.model || 'gpt-3.5-turbo',
            messages: body.messages,
            stream: body.stream || false
          })
        });
        
        return addCorsHeaders(aiResponse);
      }
      
      // 5. 图片代理（用于显示小红书等图片）
      if (url.pathname.startsWith('/api/image-proxy')) {
        const imageUrl = url.searchParams.get('url');
        if (!imageUrl) {
          return new Response('Missing image URL', { status: 400 });
        }
        
        const imageResponse = await fetch(decodeURIComponent(imageUrl));
        return addCorsHeaders(imageResponse);
      }
      
      // 6. 小红书API代理
      if (url.pathname.startsWith('/api/xiaohongshu')) {
        const noteId = url.searchParams.get('id');
        // 这里可以集成小红书API
        return new Response(JSON.stringify({
          success: true,
          message: '小红书API接口，需要配置真实API'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // 7. 通用代理（代理任意URL）
      if (url.pathname.startsWith('/api/proxy')) {
        const targetUrl = url.searchParams.get('url');
        if (!targetUrl) {
          return new Response('Missing target URL', { status: 400 });
        }
        
        const proxyResponse = await fetch(decodeURIComponent(targetUrl), {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' ? request.body : undefined
        });
        
        return addCorsHeaders(proxyResponse);
      }
      
      // 默认响应
      return new Response(JSON.stringify({
        success: true,
        message: 'Cloudflare Worker API 运行中',
        endpoints: [
          '/api/music/search?keyword=xxx',
          '/api/music/detail?id=xxx',
          '/api/music/url?id=xxx',
          '/api/ai/chat',
          '/api/image-proxy?url=xxx',
          '/api/xiaohongshu?id=xxx',
          '/api/proxy?url=xxx'
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: error.message,
        stack: error.stack
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
