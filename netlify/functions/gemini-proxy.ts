import { Handler } from '@netlify/functions';

/**
 * Netlify Function - Gemini API 反代
 * 10个Key自动轮询、失败切换、负载均衡
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

// Key 状态管理
let currentKeyIndex = 0;
const keyStatus = GEMINI_KEYS.map(() => ({
  failures: 0,
  lastFailTime: 0,
  lastUseTime: 0,
  totalRequests: 0,
  successRequests: 0
}));

// 获取下一个可用的 Key（带速率控制）
function getNextKey() {
  const now = Date.now();
  const MIN_INTERVAL = 2000; // 同一个 Key 最少间隔 2 秒
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

// 记录 Key 使用结果
function recordKeyResult(index: number, success: boolean) {
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

export const handler: Handler = async (event) => {
  // CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // CORS 预检
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  const path = event.path.replace('/.netlify/functions/gemini-proxy', '');

  // 健康检查
  if (path === '/health' || path === '' || path === '/') {
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'ok',
        service: 'Gemini API Proxy (Netlify)',
        totalKeys: GEMINI_KEYS.length,
        timestamp: new Date().toISOString(),
        rateLimit: '每个Key最少间隔2秒',
        stats,
        usage: {
          total: stats.reduce((sum, s) => sum + s.total, 0),
          success: stats.reduce((sum, s) => sum + s.success, 0),
        }
      }, null, 2),
    };
  }

  // 只处理 Gemini API 请求
  if (!path.startsWith('/v1beta/') && !path.startsWith('/v1/')) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Invalid path',
        tip: 'Use /v1beta/models/gemini-xxx:generateContent'
      }),
    };
  }

  // 尝试多个 Key（最多 3 次）
  const maxRetries = Math.min(3, GEMINI_KEYS.length);
  let lastError: any = null;

  for (let i = 0; i < maxRetries; i++) {
    const { key, index } = getNextKey();

    try {
      const targetUrl = `https://generativelanguage.googleapis.com${path}?key=${key}`;

      const response = await fetch(targetUrl, {
        method: event.httpMethod,
        headers: {
          'Content-Type': 'application/json',
        },
        body: event.body || undefined,
      });

      const data = await response.text();

      if (response.ok) {
        recordKeyResult(index, true);
        return {
          statusCode: 200,
          headers,
          body: data,
        };
      }

      // 客户端错误（400），不重试
      if (response.status >= 400 && response.status < 500) {
        recordKeyResult(index, false);
        return {
          statusCode: response.status,
          headers,
          body: data,
        };
      }

      // 服务端错误，记录并重试
      recordKeyResult(index, false);
      lastError = { status: response.status, message: data };
      console.log(`Key ${index + 1} failed (${response.status}):`, data);

    } catch (error: any) {
      recordKeyResult(index, false);
      lastError = { message: error.message };
      console.log(`Key ${index + 1} error:`, error.message);
    }
  }

  // 所有 Key 都失败
  return {
    statusCode: 503,
    headers,
    body: JSON.stringify({
      error: 'All API keys failed',
      lastError,
      tip: 'All keys are temporarily unavailable. Please try again later.'
    }),
  };
};
