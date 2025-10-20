import LoadingDots from './LoadingDots'

interface TypingIndicatorProps {
  avatar?: string
  name?: string
  isCustomAvatar?: boolean
}

const TypingIndicator = ({ avatar, name, isCustomAvatar }: TypingIndicatorProps) => {
  return (
    <div className="flex gap-2 mb-3 animate-slide-in-left">
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
        {isCustomAvatar && avatar ? (
          <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-br from-blue-400 to-blue-600">
            {name?.[0] || 'A'}
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
        <LoadingDots size="sm" color="bg-gray-500" />
      </div>
    </div>
  )
}

export default TypingIndicator
