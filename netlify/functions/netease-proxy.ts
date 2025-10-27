/**
 * Netlify Function - 网易云音乐代理
 * 直接在服务器端调用网易云API，避免CORS和认证问题
 */

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // CORS 头部
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const action = params.action;

    // 1. 搜索音乐
    if (action === 'search') {
      const keyword = params.keyword;
      if (!keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '缺少搜索关键词' }),
        };
      }

      // 直接代理网易云官方API
      const searchUrl = `https://music.163.com/api/search/get/web`;
      const params = new URLSearchParams({
        s: keyword,
        type: '1',
        offset: '0',
        limit: '30'
      });
      
      const response = await fetch(`${searchUrl}?${params}`, {
        headers: {
          'Referer': 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': '_ntes_nnid=; _ntes_nuid=',
        },
      });

      const data = await response.json();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    // 2. 获取歌曲播放URL
    if (action === 'url') {
      const id = params.id;
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '缺少歌曲ID' }),
        };
      }

      const urlApi = `https://music.163.com/api/song/enhance/player/url`;
      const params = new URLSearchParams({
        id: id,
        ids: `[${id}]`,
        br: '320000'
      });
      
      const response = await fetch(`${urlApi}?${params}`, {
        headers: {
          'Referer': 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const data = await response.json();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    // 3. 获取歌词
    if (action === 'lyric') {
      const id = params.id;
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: '缺少歌曲ID' }),
        };
      }

      const lyricUrl = `https://music.163.com/api/song/lyric`;
      const params = new URLSearchParams({
        id: id,
        lv: '-1',
        tv: '-1'
      });
      
      const response = await fetch(`${lyricUrl}?${params}`, {
        headers: {
          'Referer': 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const data = await response.json();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: '未知的action参数' }),
    };

  } catch (error) {
    console.error('音乐API错误:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: '服务器错误',
        message: error instanceof Error ? error.message : '未知错误'
      }),
    };
  }
};

export { handler };
