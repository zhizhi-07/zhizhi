/**
 * 企业级 AI API 反代 - Gemini 专用版
 * 功能：10个Key自动轮询、失败切换、负载均衡
 * 部署：Cloudflare Workers（完全免费）
 */

// ==================== 你的 10 个 Gemini Keys ====================
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

// 访问密码（可选，留空则不需要密码）
const ACCESS_PASSWORD = '';  // 例如：'my-secret-pass'

// ==================== 核心代码 ====================

let currentKeyIndex = 0;
const keyStatus = GEMINI_KEYS.map(() => ({ 
  failures: 0, 
  lastFailTime: 0,
  lastUseTime: 0,  // 最后使用时间
  totalRequests: 0,
  successRequests: 0
}));

// 获取下一个可用的 Key（带速率控制）
function getNextKey() {
  const now = Date.now();
  const MIN_INTERVAL = 2000; // 同一个 Key 最少间隔 2 秒（避免 429）
  let attempts = 0;
  let bestIndex = -1;
  let longestIdleTime = 0;
  
  // 找到空闲时间最长的 Key
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const index = (currentKeyIndex + i) % GEMINI_KEYS.length;
    const status = keyStatus[index];
    
    // 如果这个 Key 失败太多，跳过（冷却 2 分钟）
    if (status.failures > 3) {
      const timeSinceLastFail = now - status.lastFailTime;
      if (timeSinceLastFail < 120000) { // 2分钟
        continue;
      } else {
        // 冷却时间过了，重置失败计数
        status.failures = 0;
      }
    }
    
    // 检查距离上次使用的时间
    const idleTime = now - status.lastUseTime;
    
    // 如果这个 Key 已经空闲超过最小间隔，优先选择
    if (idleTime >= MIN_INTERVAL) {
      if (idleTime > longestIdleTime) {
        longestIdleTime = idleTime;
        bestIndex = index;
      }
    }
  }
  
  // 如果找到了合适的 Key
  if (bestIndex !== -1) {
    currentKeyIndex = (bestIndex + 1) % GEMINI_KEYS.length;
    keyStatus[bestIndex].lastUseTime = now;
    return { key: GEMINI_KEYS[bestIndex], index: bestIndex };
  }
  
  // 如果所有 Key 都在冷却中，选择空闲时间最长的
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

// 记录 Key 使用结果
function recordKeyResult(index, success) {
  const status = keyStatus[index];
  status.totalRequests++;
  
  if (success) {
    status.successRequests++;
    status.failures = Math.max(0, status.failures - 1); // 成功后减少失败计数
  } else {
    status.failures++;
    status.lastFailTime = Date.now();
  }
}

// 主函数
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

    // 验证密码（如果设置了）
    if (ACCESS_PASSWORD) {
      const password = request.headers.get('X-Access-Password');
      if (password !== ACCESS_PASSWORD) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }
    }

    // 健康检查
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
        service: 'Gemini API Proxy (优化版)',
        totalKeys: GEMINI_KEYS.length,
        timestamp: new Date().toISOString(),
        rateLimit: '每个Key最少间隔2秒',
        stats: stats,
        usage: {
          total: stats.reduce((sum, s) => sum + s.total, 0),
          success: stats.reduce((sum, s) => sum + s.success, 0),
        }
      });
    }

    // 只处理 Gemini API 请求
    if (!url.pathname.startsWith('/v1beta/') && !url.pathname.startsWith('/v1/')) {
      return jsonResponse({ 
        error: 'Invalid path',
        tip: 'Use /v1beta/models/gemini-pro:generateContent or similar Gemini API endpoints'
      }, 400);
    }

    // 尝试多个 Key（最多 3 次）
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
        
        // 客户端错误（400），不重试
        if (response.status >= 400 && response.status < 500) {
          recordKeyResult(index, false);
          return addCorsHeaders(response);
        }
        
        // 服务端错误，记录并重试
        recordKeyResult(index, false);
        lastError = await response.text();
        console.log(`Key ${index + 1} failed (${response.status}):`, lastError);
        
      } catch (error) {
        recordKeyResult(index, false);
        lastError = error.message;
        console.log(`Key ${index + 1} error:`, error.message);
      }
    }

    // 所有 Key 都失败
    return jsonResponse({
      error: 'All API keys failed',
      lastError: lastError,
      tip: 'All keys are temporarily unavailable. Please try again later.'
    }, 503);
  }
};

// 代理到 Gemini API
async function proxyToGemini(request, url, apiKey) {
  // 构建目标 URL（Gemini 使用 URL 参数传递 Key）
  const params = new URLSearchParams(url.search);
  params.set('key', apiKey);
  
  const targetUrl = `https://generativelanguage.googleapis.com${url.pathname}?${params.toString()}`;

  // 复制请求头
  const headers = new Headers(request.headers);
  headers.delete('Host');
  headers.delete('X-Access-Password');
  headers.delete('x-goog-api-key'); // 删除可能存在的旧 key

  // 发送请求
  return await fetch(targetUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
  });
}

// 添加 CORS 头
function addCorsHeaders(response) {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Access-Password, x-goog-api-key');
  return newResponse;
}

// JSON 响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
