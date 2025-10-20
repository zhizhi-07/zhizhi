// 性能监控工具

interface PerformanceMetrics {
  LCP?: number  // Largest Contentful Paint
  FID?: number  // First Input Delay
  CLS?: number  // Cumulative Layout Shift
  FCP?: number  // First Contentful Paint
  TTFB?: number // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initObservers()
  }

  private initObservers() {
    // LCP Observer
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime
          if (this.metrics.LCP) {
            this.log('LCP', this.metrics.LCP)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // FID Observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.metrics.FID = entry.processingStart - entry.startTime
            if (this.metrics.FID) {
              this.log('FID', this.metrics.FID)
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // CLS Observer
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              this.metrics.CLS = clsValue
              if (this.metrics.CLS) {
                this.log('CLS', this.metrics.CLS)
              }
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported')
      }
    }

    // Navigation Timing
    if ('performance' in window && 'timing' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing
          this.metrics.TTFB = timing.responseStart - timing.requestStart
          this.metrics.FCP = timing.domContentLoadedEventEnd - timing.navigationStart
          
          if (this.metrics.TTFB) {
            this.log('TTFB', this.metrics.TTFB)
          }
          if (this.metrics.FCP) {
            this.log('FCP', this.metrics.FCP)
          }
          
          this.reportMetrics()
        }, 0)
      })
    }
  }

  private log(metric: string, value: number) {
    if (import.meta.env.DEV) {
      console.log(`📊 ${metric}:`, `${value.toFixed(2)}ms`)
    }
  }

  private reportMetrics() {
    if (import.meta.env.DEV) {
      console.table(this.metrics)
      
      // 评分
      const scores = {
        LCP: this.metrics.LCP ? (this.metrics.LCP < 2500 ? '✅ 优秀' : this.metrics.LCP < 4000 ? '⚠️ 需要改进' : '❌ 差') : '-',
        FID: this.metrics.FID ? (this.metrics.FID < 100 ? '✅ 优秀' : this.metrics.FID < 300 ? '⚠️ 需要改进' : '❌ 差') : '-',
        CLS: this.metrics.CLS ? (this.metrics.CLS < 0.1 ? '✅ 优秀' : this.metrics.CLS < 0.25 ? '⚠️ 需要改进' : '❌ 差') : '-',
      }
      
      console.log('📈 性能评分:')
      console.table(scores)
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 单例模式
let performanceMonitor: PerformanceMonitor | null = null

export const initPerformanceMonitor = () => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

export const getPerformanceMetrics = () => {
  return performanceMonitor?.getMetrics() || {}
}

// API 请求性能监控
export const measureApiCall = async <T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now()
  
  try {
    const result = await apiCall()
    const duration = performance.now() - startTime
    
    if (import.meta.env.DEV) {
      console.log(`🌐 API [${name}]:`, `${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    if (import.meta.env.DEV) {
      console.error(`❌ API [${name}] 失败:`, `${duration.toFixed(2)}ms`, error)
    }
    
    throw error
  }
}

// 组件渲染性能监控
export const measureRender = (componentName: string) => {
  const startTime = performance.now()
  
  return () => {
    const duration = performance.now() - startTime
    
    if (import.meta.env.DEV && duration > 16) { // 超过一帧的时间
      console.warn(`⚠️ 组件 [${componentName}] 渲染耗时:`, `${duration.toFixed(2)}ms`)
    }
  }
}
