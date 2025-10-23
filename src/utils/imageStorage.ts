// 使用 IndexedDB 存储大图片，避免 localStorage 配额限制

const DB_NAME = 'ZhizhiImageDB'
const DB_VERSION = 1
const STORE_NAME = 'images'

// 打开数据库
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

// 保存图片到 IndexedDB
export const saveImage = async (key: string, imageData: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(imageData, key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 从 IndexedDB 读取图片
export const getImage = async (key: string): Promise<string | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)
    
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

// 删除图片
export const deleteImage = async (key: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 获取所有图片的键
export const getAllKeys = async (): Promise<string[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAllKeys()
    
    request.onsuccess = () => resolve(request.result as string[])
    request.onerror = () => reject(request.error)
  })
}

// 清空所有图片
export const clearAllImages = async (): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
