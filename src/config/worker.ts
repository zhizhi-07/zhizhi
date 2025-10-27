/**
 * Cloudflare Worker API 配置
 * 用于前端调用Worker代理的各种API
 */

// 从环境变量获取Worker URL，如果没有配置则使用默认值
const WORKER_URL = import.meta.env.VITE_WORKER_URL || '';

// 检查是否配置了Worker URL
const hasWorkerUrl = !!WORKER_URL;

if (!hasWorkerUrl) {
  console.warn('⚠️ 未配置 VITE_WORKER_URL，请在 .env 文件中配置 Cloudflare Worker URL');
  console.warn('💡 参考：CLOUDFLARE-WORKER-部署指南.md');
}

/**
 * Worker API 接口
 */
export const WorkerAPI = {
  // Worker基础URL
  baseUrl: WORKER_URL,
  
  // 是否已配置
  isConfigured: hasWorkerUrl,
  
  /**
   * 音乐搜索
   */
  musicSearch: (keyword: string) => {
    return `${WORKER_URL}/api/music/search?keyword=${encodeURIComponent(keyword)}`;
  },
  
  /**
   * 音乐详情
   */
  musicDetail: (id: string) => {
    return `${WORKER_URL}/api/music/detail?id=${id}`;
  },
  
  /**
   * 音乐播放URL
   */
  musicUrl: (id: string) => {
    return `${WORKER_URL}/api/music/url?id=${id}`;
  },
  
  /**
   * AI聊天（POST请求）
   */
  aiChat: () => {
    return `${WORKER_URL}/api/ai/chat`;
  },
  
  /**
   * 图片代理
   */
  imageProxy: (url: string) => {
    return `${WORKER_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
  },
  
  /**
   * 小红书API
   */
  xiaohongshu: (id: string) => {
    return `${WORKER_URL}/api/xiaohongshu?id=${id}`;
  },
  
  /**
   * 通用代理
   */
  proxy: (url: string) => {
    return `${WORKER_URL}/api/proxy?url=${encodeURIComponent(url)}`;
  }
};

/**
 * 使用Worker API的fetch封装
 */
export const workerFetch = async (endpoint: string, options?: RequestInit) => {
  if (!hasWorkerUrl) {
    throw new Error('未配置 Worker URL，请在 .env 文件中设置 VITE_WORKER_URL');
  }
  
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`Worker API 请求失败: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('Worker API 调用失败:', error);
    throw error;
  }
};

export default WorkerAPI;
