import { useBackground } from '../context/BackgroundContext'
import { useState, useEffect } from 'react'

interface GlobalBackgroundProps {
  applyToAll?: boolean  // 是否应用到所有页面（包括聊天）
}

/**
 * 全局背景组件
 * - 默认应用到主界面（微信、通讯录、发现、我）
 * - 如果 applyToAll 为 true，则检查用户设置决定是否显示
 */
const GlobalBackground = ({ applyToAll = false }: GlobalBackgroundProps) => {
  const { background, getBackgroundStyle } = useBackground()
  const [applyToAllPages, setApplyToAllPages] = useState(() => {
    return localStorage.getItem('apply_background_to_all_pages') === 'true'
  })
  
  // 监听设置变化
  useEffect(() => {
    const handleStorageChange = () => {
      setApplyToAllPages(localStorage.getItem('apply_background_to_all_pages') === 'true')
    }
    
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])
  
  // 如果是小程序等页面，需要检查用户是否勾选了"应用到所有界面"
  if (applyToAll && !applyToAllPages) {
    return (
      <div 
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)' }}
      />
    )
  }
  
  // 主界面或勾选后的小程序显示背景
  return (
    <div 
      className="absolute inset-0 z-0"
      style={background ? getBackgroundStyle() : {
        background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
      }}
    />
  )
}

export default GlobalBackground
