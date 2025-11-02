// Service Worker for PWA - 优化版
const CACHE_NAME = 'zhizhi-v10'
const RUNTIME_CACHE = 'zhizhi-runtime-v10'
const IMAGE_CACHE = 'zhizhi-images-v10'

// 静态资源缓存列表
const STATIC_ASSETS = [
  '/',
  '/index.html'
]

// 缓存策略配置
const CACHE_STRATEGIES = {
  static: /\.(js|css|woff2?|ttf|eot)$/,
  images: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
  api: /\/api\//
}

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 缓存静态资源')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] 删除旧缓存:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 拦截请求 - 智能缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return
  }

  // 跳过chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // 图片资源 - Cache First策略
  if (CACHE_STRATEGIES.images.test(url.pathname)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          return response || fetch(request).then((fetchResponse) => {
            // 只缓存成功的响应
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone())
            }
            return fetchResponse
          })
        })
      })
    )
    return
  }

  // 静态资源 - Cache First策略
  if (CACHE_STRATEGIES.static.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          if (fetchResponse.ok) {
            return caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, fetchResponse.clone())
              return fetchResponse
            })
          }
          return fetchResponse
        })
      })
    )
    return
  }

  // API请求 - Network First策略
  if (CACHE_STRATEGIES.api.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
        })
    )
    return
  }

  // 默认策略 - Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone()
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})
