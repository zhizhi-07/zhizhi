/**
 * Card 组件 - 统一的卡片样式
 * 
 * 用于替代重复的卡片样式代码
 */

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'flat'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const Card = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  onClick 
}: CardProps) => {
  const baseStyles = 'rounded-2xl transition-all duration-300'
  
  const variantStyles = {
    default: 'bg-white shadow-md border border-gray-200/50',
    glass: 'bg-white/90 backdrop-blur-md shadow-lg border border-gray-200/50',
    elevated: 'bg-white shadow-xl hover:shadow-2xl',
    outlined: 'bg-transparent border-2 border-gray-300',
    flat: 'bg-gray-50'
  }
  
  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const interactiveStyles = onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
  
  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${interactiveStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card

