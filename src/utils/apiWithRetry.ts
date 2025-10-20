// API 调用增强版 - 支持重试、超时、错误处理

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  onRetry?: (attempt: number, error: Error) => void
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 延迟函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 超时包装
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('请求超时')), timeoutMs)
    )
  ])
}

// 带重试的 API 调用
export const apiCallWithRetry = async <T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000,
    onRetry
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 第一次尝试或重试
      if (attempt > 0) {
        const waitTime = retryDelay * Math.pow(2, attempt - 1) // 指数退避
        console.log(`🔄 重试第 ${attempt} 次，等待 ${waitTime}ms...`)
        await delay(waitTime)
        onRetry?.(attempt, lastError!)
      }

      // 执行 API 调用，带超时
      const result = await withTimeout(apiCall(), timeout)
      
      // 成功
      if (attempt > 0) {
        console.log(`✅ 重试成功！`)
      }
      
      return result
    } catch (error) {
      lastError = error as Error
      
      // 最后一次尝试失败
      if (attempt === maxRetries) {
        console.error(`❌ API 调用失败，已重试 ${maxRetries} 次`)
        throw new ApiError(
          `API 调用失败: ${lastError.message}`,
          undefined,
          lastError
        )
      }
      
      // 记录错误但继续重试
      console.warn(`⚠️ 第 ${attempt + 1} 次尝试失败:`, lastError.message)
    }
  }

  // 理论上不会到这里
  throw lastError!
}

// 批量 API 调用（并发控制）
export const batchApiCalls = async <T>(
  apiCalls: (() => Promise<T>)[],
  concurrency: number = 3
): Promise<T[]> => {
  const results: T[] = []
  const executing: Promise<void>[] = []

  for (const [index, apiCall] of apiCalls.entries()) {
    const promise = apiCall().then(result => {
      results[index] = result
    })

    executing.push(promise)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      executing.splice(executing.findIndex(p => p === promise), 1)
    }
  }

  await Promise.all(executing)
  return results
}

// API 缓存
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl: number

  constructor(ttl: number = 5 * 60 * 1000) { // 默认5分钟
    this.ttl = ttl
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear(): void {
    this.cache.clear()
  }

  delete(key: string): void {
    this.cache.delete(key)
  }
}

export const apiCache = new ApiCache()

// 带缓存的 API 调用
export const apiCallWithCache = async <T>(
  cacheKey: string,
  apiCall: () => Promise<T>,
  options: RetryOptions & { useCache?: boolean } = {}
): Promise<T> => {
  const { useCache = true, ...retryOptions } = options

  // 检查缓存
  if (useCache) {
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`📦 使用缓存:`, cacheKey)
      return cached
    }
  }

  // 调用 API
  const result = await apiCallWithRetry(apiCall, retryOptions)

  // 保存到缓存
  if (useCache) {
    apiCache.set(cacheKey, result)
  }

  return result
}

// 网络状态检查
export const checkNetworkStatus = (): boolean => {
  return navigator.onLine
}

// 等待网络恢复
export const waitForNetwork = (timeout: number = 30000): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve()
      return
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline)
      reject(new Error('等待网络超时'))
    }, timeout)

    const handleOnline = () => {
      clearTimeout(timeoutId)
      window.removeEventListener('online', handleOnline)
      resolve()
    }

    window.addEventListener('online', handleOnline)
  })
}

// 智能 API 调用（自动处理网络问题）
export const smartApiCall = async <T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  // 检查网络状态
  if (!checkNetworkStatus()) {
    console.warn('⚠️ 网络已断开，等待网络恢复...')
    try {
      await waitForNetwork(10000) // 等待10秒
      console.log('✅ 网络已恢复')
    } catch {
      throw new ApiError('网络连接失败，请检查网络设置')
    }
  }

  // 执行 API 调用
  return apiCallWithRetry(apiCall, options)
}

export { ApiError }
