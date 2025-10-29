import { AIPhoneContent } from '../../utils/aiPhoneGenerator'

interface WechatAppProps {
  content: AIPhoneContent
}

const WechatApp = ({ content }: WechatAppProps) => {
  return (
    <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
      {/* 标题栏 */}
      <div className="px-6 py-4 border-b border-white/30 bg-white/20">
        <h2 className="text-lg font-semibold text-gray-800">微信</h2>
      </div>
      
      {/* 聊天列表 */}
      <div className="flex-1 overflow-y-auto">
        {content.wechatChats.map((chat, index) => (
          <div 
            key={index}
            className="px-4 py-3 border-b border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400/30 to-green-500/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-medium text-gray-700">{chat.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800 truncate">{chat.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{chat.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 truncate flex-1">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default WechatApp
