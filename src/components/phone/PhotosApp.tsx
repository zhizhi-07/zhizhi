import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface PhotosAppProps {
  content: AIPhoneContent
}

const PhotosApp = ({ content }: PhotosAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-white/20">
        <h2 className="text-lg font-semibold text-gray-800">相册</h2>
        <p className="text-xs text-gray-500 mt-1">{content.photos.length} 张照片</p>
      </div>
      
      {/* 照片列表 */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
        {content.photos.map((photo, index) => (
          <div 
            key={index}
            className="bg-gradient-to-br from-pink-100/60 to-purple-100/40 backdrop-blur-md rounded-2xl p-3 border border-pink-200/50 shadow-sm aspect-square flex flex-col justify-between"
          >
            <div className="flex-1 flex items-center justify-center text-4xl">
              📷
            </div>
            <div>
              <p className="text-xs font-medium text-gray-800">{photo.description}</p>
              {photo.location && (
                <p className="text-xs text-gray-500 mt-1">📍 {photo.location}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{photo.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PhotosApp
