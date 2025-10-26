import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SendIcon } from '../components/Icons'
import { useMusicPlayer } from '../context/MusicPlayerContext'
import { useApi } from '../context/ApiContext'

interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: number
  avatar?: string
}

const MusicTogetherChat = () => {
  const navigate = useNavigate()
  const musicPlayer = useMusicPlayer()
  const { currentApi } = useApi()
  const [showChat, setShowChat] = useState(true)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 获取当前歌曲信息
  const currentSong = musicPlayer.currentSong
  const currentLyrics = currentSong?.lyrics || ''
  
  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 欢迎消息
  useEffect(() => {
    if (currentSong && messages.length === 0) {
      setMessages([{
        id: Date.now(),
        type: 'ai',
        content: `嘿！我们正在一起听《${currentSong.title}》~ 这首歌怎么样？想聊点什么吗？🎵`,
        timestamp: Date.now(),
        avatar: '🎵'
      }])
    }
  }, [currentSong, messages.length])

  // 构建AI上下文
  const buildAiContext = () => {
    if (!currentSong) return ''
    
    // 解析歌词获取元数据和歌词内容
    const lyricsLines = currentLyrics.split('\n')
    let metadata = ''
    let songLyrics = ''
    
    lyricsLines.forEach(line => {
      const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
      if (match) {
        const text = match[4].trim()
        if (text.includes('作词') || text.includes('作曲') || text.includes('编曲')) {
          metadata += text + '\n'
        } else if (text) {
          songLyrics += text + '\n'
        }
      }
    })

    return `当前正在播放的歌曲信息：
歌曲名：${currentSong.title}
歌手：${currentSong.artist}
专辑：${currentSong.album}
${metadata ? `制作信息：\n${metadata}` : ''}
${songLyrics ? `歌词：\n${songLyrics.substring(0, 500)}${songLyrics.length > 500 ? '...' : ''}` : ''}

你是一个热爱音乐的AI助手，正在和用户一起听歌。请基于当前歌曲的信息与用户聊天，可以谈论歌词含义、情感表达、音乐风格、歌手故事等。回复要自然、有趣，像朋友聊天一样。`
  }

  // 发送消息
  const handleSend = async () => {
    const text = inputText.trim()
    if (!text && !isAiTyping) {
      // 无文字时，触发AI主动回复
      await triggerAiReply()
      return
    }

    if (!text) return

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // 获取AI回复
    await getAiReply(text)
  }

  // 触发AI主动回复
  const triggerAiReply = async () => {
    if (isAiTyping) return
    
    setIsAiTyping(true)
    
    try {
      const context = buildAiContext()
      const prompt = `${context}\n\n请主动说点什么，可以评论这首歌、分享感受，或者询问用户的想法。`
      
      if (!currentApi) {
        throw new Error('未配置API')
      }

      const response = await fetch(currentApi.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApi.apiKey}`
        },
        body: JSON.stringify({
          model: currentApi.model,
          messages: [{
            role: 'system',
            content: prompt
          }],
          temperature: 0.8
        })
      })

      const data = await response.json()
      const aiContent = data.choices?.[0]?.message?.content || '听着这首歌，感觉真好~ 🎵'

      const aiMessage: Message = {
        id: Date.now(),
        type: 'ai',
        content: aiContent,
        timestamp: Date.now(),
        avatar: '🎵'
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI回复失败:', error)
      const errorMessage: Message = {
        id: Date.now(),
        type: 'ai',
        content: '哎呀，我正在沉浸在音乐中...稍等一下~',
        timestamp: Date.now(),
        avatar: '🎵'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAiTyping(false)
    }
  }

  // 获取AI回复
  const getAiReply = async (userMessage: string) => {
    setIsAiTyping(true)
    
    try {
      const context = buildAiContext()
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      if (!currentApi) {
        throw new Error('未配置API')
      }

      const response = await fetch(currentApi.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApi.apiKey}`
        },
        body: JSON.stringify({
          model: currentApi.model,
          messages: [
            {
              role: 'system',
              content: context
            },
            ...conversationHistory,
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.8
        })
      })

      const data = await response.json()
      const aiContent = data.choices?.[0]?.message?.content || '嗯...让我想想~'

      const aiMessage: Message = {
        id: Date.now(),
        type: 'ai',
        content: aiContent,
        timestamp: Date.now(),
        avatar: '🎵'
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI回复失败:', error)
    } finally {
      setIsAiTyping(false)
    }
  }

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 关闭半屏
  const handleClose = () => {
    setShowChat(false)
    setTimeout(() => navigate(-1), 300)
  }

  if (!showChat) return null

  return (
    <>
      {/* 半透明背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* 半屏聊天界面 */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 flex flex-col"
        style={{ 
          height: '70vh',
          transform: showChat ? 'translateY(0)' : 'translateY(100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部拖动条 + 标题 */}
        <div className="flex flex-col items-center pt-3 pb-2 border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-3" />
          <div className="text-center px-4 pb-2">
            <div className="text-sm font-medium text-gray-900">一起听</div>
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {currentSong?.title} - {currentSong?.artist}
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-end gap-2 mb-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* 头像 */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                  : 'bg-gradient-to-br from-red-400 to-pink-500 text-white'
              }`}>
                {message.type === 'user' ? '我' : '🎵'}
              </div>

              {/* 消息气泡 - 使用单聊样式 */}
              <div style={{ maxWidth: '70%', display: 'inline-block' }}>
                <div
                  className="message-bubble px-3 py-2"
                  style={{
                    backgroundColor: message.type === 'user' ? '#95EC69' : '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    color: '#111827',
                    fontSize: '14px',
                    maxWidth: '100%',
                    overflowWrap: 'break-word'
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isAiTyping && (
            <div className="flex items-end gap-2 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                🎵
              </div>
              <div className="bg-white px-4 py-3 rounded-lg shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入框 */}
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="说点什么..."
              className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-0"
            />
            
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                disabled={isAiTyping}
                className="w-10 h-10 flex items-center justify-center ios-button bg-wechat-green text-white rounded-full shadow-lg disabled:opacity-50 transition-all duration-200"
              >
                <SendIcon size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSend}
                disabled={isAiTyping}
                className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 disabled:opacity-50 transition-all duration-200"
              >
                <SendIcon size={22} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}


export default MusicTogetherChat
