/**
 * 存储监控工具 - 查看 IndexedDB 使用情况
 */

import { getIndexedDBUsage } from './indexedDBStorage'

/**
 * 打印存储使用情况到控制台
 */
export async function logStorageUsage(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 存储空间使用情况')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const usage = await getIndexedDBUsage()
  
  console.log(`💾 已使用: ${usage.used} MB`)
  console.log(`📦 总配额: ${usage.quota} MB`)
  console.log(`📈 使用率: ${usage.percentage}%`)
  
  // 警告检查
  if (usage.percentage > 80) {
    console.warn('⚠️  警告：存储使用率超过 80%！')
  } else if (usage.percentage > 50) {
    console.log('⚡ 存储使用正常')
  } else {
    console.log('✅ 存储空间充足')
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // localStorage 使用情况
  let localStorageSize = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      localStorageSize += localStorage[key].length + key.length
    }
  }
  
  const localStorageMB = (localStorageSize / 1024 / 1024).toFixed(2)
  console.log(`💿 localStorage: ${localStorageMB} MB`)
  
  // 通常 localStorage 限制是 5-10MB
  const localStorageLimit = 5
  const localStoragePercent = (parseFloat(localStorageMB) / localStorageLimit * 100).toFixed(1)
  console.log(`📊 localStorage 使用率: ~${localStoragePercent}%`)
  
  if (parseFloat(localStorageMB) > 4) {
    console.warn('⚠️  localStorage 接近限制！建议使用 IndexedDB')
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

/**
 * 在开发环境中自动监控存储
 */
export function enableStorageMonitor(): void {
  if (import.meta.env.DEV) {
    // 初始检查
    setTimeout(() => {
      logStorageUsage()
    }, 2000)
    
    // 定期检查（每5分钟）
    setInterval(() => {
      logStorageUsage()
    }, 5 * 60 * 1000)
  }
}

// 暴露到全局方便调试
if (typeof window !== 'undefined') {
  (window as any).checkStorage = logStorageUsage
}
