interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const LoadingDots = ({ size = 'md', color = 'bg-gray-400' }: LoadingDotsProps) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  }

  return (
    <div className={`flex items-center ${gapClasses[size]}`}>
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  )
}

export default LoadingDots
