/**
 * 统一存储层 - 解决 Context + localStorage + IndexedDB 混用问题
 * 
 * 提供统一的 API 来管理所有存储操作
 * 自动选择最佳存储方式（内存 → localStorage → IndexedDB）
 */

import { storage } from '../storage'
import { indexedDBStorage, STORES } from '../indexedDBStorage'

export type StorageType = 'memory' | 'localStorage' | 'indexedDB'

export interface StorageConfig {
  // 存储类型优先级
  priority?: StorageType[]
  // 是否启用内存缓存
  enableCache?: boolean
  // 缓存过期时间（毫秒）
  cacheExpiry?: number
}

// 默认配置
const DEFAULT_CONFIG: StorageConfig = {
  priority: ['memory', 'localStorage', 'indexedDB'],
  enableCache: true,
  cacheExpiry: 5 * 60 * 1000 // 5分钟
}

// 内存缓存
const memoryCache = new Map<string, { value: any; expiry: number }>()

/**
 * 统一存储类
 */
class UnifiedStorage {
  private config: StorageConfig

  constructor(config: StorageConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * 获取数据
   */
  async get<T = any>(key: string): Promise<T | null> {
    // 1. 尝试从内存缓存获取
    if (this.config.enableCache) {
      const cached = memoryCache.get(key)
      if (cached && cached.expiry > Date.now()) {
        return cached.value as T
      }
    }

    // 2. 按优先级尝试各种存储方式
    for (const type of this.config.priority!) {
      try {
        let value: T | null = null

        switch (type) {
          case 'localStorage':
            const localValue = storage.getItem(key)
            if (localValue !== null) {
              value = JSON.parse(localValue) as T
            }
            break

          case 'indexedDB':
            value = await indexedDBStorage.getIndexedDBItem<T>(STORES.GENERAL, key)
            break

          case 'memory':
            // 已在上面处理
            continue
        }

        if (value !== null) {
          // 更新内存缓存
          if (this.config.enableCache) {
            this.setCache(key, value)
          }
          return value
        }
      } catch (error) {
        console.warn(`Failed to get from ${type}:`, error)
      }
    }

    return null
  }

  /**
   * 保存数据
   */
  async set<T = any>(key: string, value: T, storageType?: StorageType): Promise<void> {
    // 更新内存缓存
    if (this.config.enableCache) {
      this.setCache(key, value)
    }

    // 确定存储类型
    const type = storageType || this.config.priority![1] // 默认使用 localStorage

    try {
      switch (type) {
        case 'localStorage':
          storage.setItem(key, JSON.stringify(value))
          break

        case 'indexedDB':
          await indexedDBStorage.setIndexedDBItem(STORES.GENERAL, key, value)
          break

        case 'memory':
          // 仅内存缓存，不持久化
          break
      }
    } catch (error) {
      console.error(`Failed to set to ${type}:`, error)
      throw error
    }
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    // 清除内存缓存
    memoryCache.delete(key)

    // 从所有存储中删除
    const promises: Promise<void>[] = []

    if (this.config.priority!.includes('localStorage')) {
      promises.push(Promise.resolve(storage.removeItem(key)))
    }

    if (this.config.priority!.includes('indexedDB')) {
      promises.push(indexedDBStorage.setIndexedDBItem(STORES.GENERAL, key, null))
    }

    await Promise.allSettled(promises)
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    // 清除内存缓存
    memoryCache.clear()

    // 清空 localStorage
    if (this.config.priority!.includes('localStorage')) {
      localStorage.clear()
    }

    // 清空 IndexedDB（需要具体实现）
    if (this.config.priority!.includes('indexedDB')) {
      console.warn('IndexedDB clear not implemented')
    }
  }

  /**
   * 设置内存缓存
   */
  private setCache(key: string, value: any): void {
    memoryCache.set(key, {
      value,
      expiry: Date.now() + (this.config.cacheExpiry || 0)
    })
  }

  /**
   * 清除过期缓存
   */
  clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, cached] of memoryCache.entries()) {
      if (cached.expiry <= now) {
        memoryCache.delete(key)
      }
    }
  }
}

// 导出单例
export const unifiedStorage = new UnifiedStorage()

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    unifiedStorage.clearExpiredCache()
  }, 60 * 1000) // 每分钟清理一次
}

/**
 * 便捷方法
 */
export const getStorageItem = <T = any>(key: string) => unifiedStorage.get<T>(key)
export const setStorageItem = <T = any>(key: string, value: T, type?: StorageType) => unifiedStorage.set(key, value, type)
export const removeStorageItem = (key: string) => unifiedStorage.remove(key)
export const clearStorage = () => unifiedStorage.clear()

