import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface MapsAppProps {
  content: AIPhoneContent
}

const MapsApp = ({ content }: MapsAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 搜索栏 */}
      <div className="px-4 py-3 border-b border-white/30 bg-white/20">
        <div className="bg-white/50 rounded-full px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
          <span>🔍</span>
          <span>搜索地点</span>
        </div>
      </div>
      
      {/* 历史记录 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">搜索历史</h3>
        <div className="space-y-2">
          {content.mapHistory.map((location, index) => (
            <div 
              key={index}
              className="bg-white/50 backdrop-blur-md rounded-xl p-4 border border-green-200/50 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400/30 to-green-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📍</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{location.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{location.address}</div>
                  <div className="text-xs text-gray-400 mt-1">{location.time}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MapsApp
