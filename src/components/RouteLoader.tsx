import { Suspense, lazy, ComponentType } from 'react'
import { ChatListSkeleton } from './Skeleton'

// 路由懒加载包装器
export const lazyLoad = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc)

  return (props: any) => (
    <Suspense fallback={fallback || <ChatListSkeleton />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// 预加载函数
export const preloadRoute = (importFunc: () => Promise<any>) => {
  importFunc()
}

// 路由预加载 Hook
export const useRoutePreload = (routes: Record<string, () => Promise<any>>) => {
  const preload = (routeName: string) => {
    const route = routes[routeName]
    if (route) {
      preloadRoute(route)
    }
  }

  return { preload }
}

// 通用加载组件
export const RouteLoader = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<ChatListSkeleton />}>
    {children}
  </Suspense>
)

export default RouteLoader
