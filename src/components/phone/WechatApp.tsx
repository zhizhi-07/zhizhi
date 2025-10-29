import { useState } from 'react'
import { AIPhoneContent } from '../../utils/aiPhoneGenerator'
import { ChevronLeftIcon } from '../Icons'

interface WechatAppProps {
  content: AIPhoneContent
}

const WechatApp = ({ content }: WechatAppProps) => {
  const [selectedChat, setSelectedChat] = useState<number | null>(null)

  if (selectedChat !== null) {
    const chat = content.wechatChats[selectedChat]
    return (
      <div className="w-full h-full bg-white/30 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
        {/* 聊天详情标题栏 */}
        <div className="px-4 py-3 border-b border-white/30 bg-white/20 flex items-center gap-3">
          <button
            onClick={() => setSelectedChat(null)}
            className="w-8 h-8 rounded-full hover:bg-white/30 flex items-center justify-center"
          >
            <ChevronLeftIcon size={20} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400/30 to-green-500/30 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">{chat.name[0]}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-800">{chat.name}</h2>
          </div>
        </div>
        
        {/* 聊天消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chat.messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.isSelf ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${message.isSelf ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.isSelf 
                    ? 'bg-green-500/80 text-white' 
                    : 'bg-white/70 text-gray-800'
                } shadow-sm`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className={`text-xs text-gray-500 mt-1 px-2 ${message.isSelf ? 'text-right' : 'text-left'}`}>
                  {message.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

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
            onClick={() => setSelectedChat(index)}
            className="px-4 py-3 border-b border-white/20 hover:bg-white/20 transition-colors cursor-pointer active:bg-white/30"
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
