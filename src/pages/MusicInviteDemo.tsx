import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import MusicInviteCard from '../components/MusicInviteCard'

type MessageType = {
  id: number
  timestamp: number
} & (
  | {
      type: 'received' | 'sent'
      content: string
    }
  | {
      type: 'musicInvite'
      inviterName: string
      songTitle: string
      songArtist: string
      songCover?: string
      status: 'pending' | 'accepted' | 'rejected'
    }
)

const MusicInviteDemo = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [messages, setMessages] = useState<MessageType[]>([
    {
      id: 1,
      type: 'received',
      content: '嘿！我正在听这首歌，超好听的！',
      timestamp: Date.now() - 60000
    },
    {
      id: 2,
      type: 'musicInvite',
      inviterName: '汐汐',
      songTitle: '别哭了我爱你',
      songArtist: '周杰伦',
      timestamp: Date.now() - 30000,
      status: 'pending'
    },
    {
      id: 3,
      type: 'received',
      content: '一起听吧～',
      timestamp: Date.now() - 20000
    }
  ])

  const handleAccept = (id: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id && msg.type === 'musicInvite') {
        return { ...msg, status: 'accepted' as const }
      }
      return msg
    }))
    // TODO: 跳转到一起听页面
    console.log('接受邀请，跳转到一起听')
  }

  const handleReject = (id: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id && msg.type === 'musicInvite') {
        return { ...msg, status: 'rejected' as const }
      }
      return msg
    }))
    console.log('拒绝邀请')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {showStatusBar && <StatusBar />}
      
      {/* 顶部导航栏 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <button
          onClick={() => navigate('/music-player', { replace: true })}
          className="w-10 h-10 flex items-center justify-center ios-button"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h1 className="text-lg font-medium text-gray-900">一起听邀请卡片示例</h1>
        
        <div className="w-10" />
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex mb-4 ${message.type === 'received' || message.type === 'musicInvite' ? 'justify-start' : 'justify-end'}`}
          >
            {message.type === 'musicInvite' ? (
              <div className="flex items-end gap-2">
                {/* 头像 */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-sm font-medium">
                  汐
                </div>
                
                {/* 邀请卡片 */}
                <MusicInviteCard
                  inviterName={message.inviterName}
                  songTitle={message.songTitle}
                  songArtist={message.songArtist}
                  songCover={message.songCover}
                  status={message.status}
                  onAccept={() => handleAccept(message.id)}
                  onReject={() => handleReject(message.id)}
                />
              </div>
            ) : (
              <div className="flex items-end gap-2">
                {message.type === 'received' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-sm font-medium">
                    汐
                  </div>
                )}
                
                <div
                  className="message-bubble px-3 py-2 max-w-[70%]"
                  style={{
                    backgroundColor: message.type === 'received' ? '#FFFFFF' : '#95EC69',
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    color: '#111827',
                    fontSize: '14px'
                  }}
                >
                  {message.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部说明 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <div className="text-sm text-gray-600 text-center">
          这是"一起听"邀请卡片的示例展示
        </div>
        <div className="text-xs text-gray-400 text-center mt-1">
          点击"接受"或"拒绝"查看效果
        </div>
      </div>
    </div>
  )
}

export default MusicInviteDemo
