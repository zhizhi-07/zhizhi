import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface BackgroundContextType {
  background: string
  setBackground: (bg: string) => void
  getBackgroundStyle: () => React.CSSProperties
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined)

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [background, setBackgroundState] = useState<string>('')

  // 初始加载背景
  useEffect(() => {
    const loadBackground = () => {
      const bg = localStorage.getItem('chatBackground') || ''
      console.log('🎨 全局背景加载:', bg)
      setBackgroundState(bg)
    }

    loadBackground()

    // 监听 storage 事件
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatBackground') {
        console.log('🎨 背景变化:', e.newValue)
        setBackgroundState(e.newValue || '')
      }
    }

    // 监听自定义事件
    const handleCustomChange = () => {
      loadBackground()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('chatBackgroundChanged', handleCustomChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('chatBackgroundChanged', handleCustomChange)
    }
  }, [])

  // 设置背景
  const setBackground = (bg: string) => {
    localStorage.setItem('chatBackground', bg)
    setBackgroundState(bg)
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new Event('chatBackgroundChanged'))
    console.log('🎨 设置背景:', bg)
  }

  // 获取背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!background) {
      return {
        background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
      }
    }

    if (background.startsWith('http') || background.startsWith('data:image')) {
      return {
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }

    if (background.startsWith('#') || background.startsWith('rgb')) {
      return {
        backgroundColor: background
      }
    }

    return {
      background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
    }
  }

  return (
    <BackgroundContext.Provider value={{ background, setBackground, getBackgroundStyle }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export const useBackground = () => {
  const context = useContext(BackgroundContext)
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider')
  }
  return context
}
