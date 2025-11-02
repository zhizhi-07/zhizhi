/**
 * Input 组件 - 统一的输入框样式
 * 
 * 用于替代重复的输入框样式代码
 */

import { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const Input = ({ 
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props 
}: InputProps) => {
  const baseStyles = 'px-4 py-2.5 rounded-xl border transition-all duration-200 outline-none'
  const stateStyles = error 
    ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200' 
    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
  const widthStyles = fullWidth ? 'w-full' : ''
  const iconPadding = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : ''
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input 
          className={`${baseStyles} ${stateStyles} ${widthStyles} ${iconPadding} ${className}`}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

export default Input

