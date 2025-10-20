interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

const Skeleton = ({ 
  className = '', 
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg'
  }
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  )
}

// 预设骨架屏组件
export const MessageSkeleton = () => (
  <div className="flex gap-2 mb-3 px-4">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1 space-y-2">
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={16} />
    </div>
  </div>
)

export const ChatListSkeleton = () => (
  <div className="space-y-2 p-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex gap-3 p-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton width="40%" height={16} />
            <Skeleton width="20%" height={12} />
          </div>
          <Skeleton width="70%" height={14} />
        </div>
      </div>
    ))}
  </div>
)

export const MomentSkeleton = () => (
  <div className="space-y-4 p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-3">
        <div className="flex gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="30%" height={16} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="80%" height={14} />
          </div>
        </div>
        <Skeleton variant="rounded" width="100%" height={200} />
      </div>
    ))}
  </div>
)

export default Skeleton
