/**
 * 高效的localStorage监听工具
 * 替代低效的setInterval轮询，减少CPU占用和内存泄漏
 */

type StorageCallback = (value: string | null) => void

class StorageObserver {
  private observers: Map<string, Set<StorageCallback>> = new Map()
  private cache: Map<string, string | null> = new Map()
  private checkInterval: number | null = null
  private readonly CHECK_INTERVAL_MS = 1000 // 统一使用1秒检查一次，而不是多个500ms

  constructor() {
    // 监听跨标签页的storage事件
    window.addEventListener('storage', this.handleStorageEvent)
  }

  private handleStorageEvent = (e: StorageEvent) => {
    if (e.key && this.observers.has(e.key)) {
      this.cache.set(e.key, e.newValue)
      this.notifyObservers(e.key, e.newValue)
    }
  }

  private notifyObservers(key: string, value: string | null) {
    const callbacks = this.observers.get(key)
    if (callbacks) {
      callbacks.forEach(callback => callback(value))
    }
  }

  private startPolling() {
    if (this.checkInterval !== null) return

    // 使用单个定时器统一检查所有key，而不是每个key一个定时器
    this.checkInterval = window.setInterval(() => {
      this.observers.forEach((_, key) => {
        const currentValue = localStorage.getItem(key)
        const cachedValue = this.cache.get(key)

        // 只在值真正改变时才通知
        if (currentValue !== cachedValue) {
          this.cache.set(key, currentValue)
          this.notifyObservers(key, currentValue)
        }
      })
    }, this.CHECK_INTERVAL_MS)
  }

  private stopPolling() {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * 监听localStorage的某个key
   * @param key localStorage的key
   * @param callback 值变化时的回调
   * @returns 取消监听的函数
   */
  observe(key: string, callback: StorageCallback): () => void {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set())
      // 初始化缓存
      this.cache.set(key, localStorage.getItem(key))
    }

    this.observers.get(key)!.add(callback)

    // 如果这是第一个观察者，启动轮询
    if (this.observers.size === 1) {
      this.startPolling()
    }

    // 立即触发一次回调，确保初始状态正确
    callback(localStorage.getItem(key))

    // 返回取消监听的函数
    return () => {
      const callbacks = this.observers.get(key)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.observers.delete(key)
          this.cache.delete(key)
        }
      }

      // 如果没有观察者了，停止轮询
      if (this.observers.size === 0) {
        this.stopPolling()
      }
    }
  }

  /**
   * 触发一个自定义的storage事件（用于同一页面内的通知）
   */
  trigger(key: string) {
    const value = localStorage.getItem(key)
    this.cache.set(key, value)
    this.notifyObservers(key, value)
  }

  /**
   * 清理所有监听器
   */
  destroy() {
    window.removeEventListener('storage', this.handleStorageEvent)
    this.stopPolling()
    this.observers.clear()
    this.cache.clear()
  }
}

// 单例模式
export const storageObserver = new StorageObserver()

/**
 * React Hook: 监听localStorage的某个key
 */
export function useLocalStorage(key: string, defaultValue: string | null = null): string | null {
  const [value, setValue] = React.useState<string | null>(() => {
    return localStorage.getItem(key) ?? defaultValue
  })

  React.useEffect(() => {
    return storageObserver.observe(key, setValue)
  }, [key])

  return value
}

// 为了避免循环依赖，这里不导入React
// 使用者需要自己导入React
import * as React from 'react'
