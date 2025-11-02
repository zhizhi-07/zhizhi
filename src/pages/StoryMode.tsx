import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { BackIcon, SendIcon } from '../components/Icons'
import { useUser, useCharacter } from '../context/ContactsContext'
import { callAI } from '../utils/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ParsedSegment {
  type: 'dialogue' | 'narration' | 'thought' | 'action'
  content: string
  speaker?: string
}

const StoryMode = () => {
  const navigate = useNavigate()
  const { currentUser } = useUser()
  const { characters } = useCharacter()
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 解析AI回复内容
  const parseContent = (content: string): ParsedSegment[] => {
    const segments: ParsedSegment[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // 匹配对话："xxx" 或 角色名："xxx"
      const dialogueMatch = trimmed.match(/^([^：:"]+)?[：:]?"(.+?)"$/)
      if (dialogueMatch) {
        segments.push({
          type: 'dialogue',
          speaker: dialogueMatch[1]?.trim() || '未知',
          content: dialogueMatch[2]
        })
        continue
      }

      // 匹配心理活动：(xxx) 或 [xxx]
      if (trimmed.match(/^[\(\[].+[\)\]]$/)) {
        segments.push({
          type: 'thought',
          content: trimmed.replace(/[\(\[\)\]]/g, '')
        })
        continue
      }

      // 匹配动作：*xxx*
      const actionMatch = trimmed.match(/^\*(.+?)\*$/)
      if (actionMatch) {
        segments.push({
          type: 'action',
          content: actionMatch[1]
        })
        continue
      }

      // 默认为旁白
      segments.push({
        type: 'narration',
        content: trimmed
      })
    }

    return segments
  }

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsGenerating(true)

    try {
      // 构建上下文
      const context = messages.slice(-5).map(m => 
        `${m.role === 'user' ? currentUser?.name || '你' : selectedCharacter?.name || 'AI'}: ${m.content}`
      ).join('\n')

      // 构建角色设定
      const characterInfo = selectedCharacter ? `
角色名字：${selectedCharacter.name}
设定：${selectedCharacter.description || ''}
系统提示词：${selectedCharacter.systemPrompt || ''}
关系：你们正在线下见面` : '你是一个小说风格的AI助手'

      const prompt = `${characterInfo}

场景：你们在咖啡店见面，请用小说的形式回复。

格式要求：
- 对话用引号：${selectedCharacter?.name || 'AI'}："你好"
- 心理活动用括号：(${selectedCharacter?.name || '他'}想...)
- 动作用星号：*点了点头*
- 场景描写直接写

对话历史：
${context}

${currentUser?.name || '你'}: ${inputText}

请以${selectedCharacter?.name || 'AI'}的身份，用小说形式回复（100-200字）：`

      const response = await callAI(prompt)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('发送失败:', error)
      alert('发送失败，请检查API配置')
    } finally {
      setIsGenerating(false)
    }
  }

  // 处理回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 如果还没选择角色，显示角色选择界面
  if (!selectedCharacter) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col">
        {/* 状态栏 + 导航栏 */}
        <div className="glass-card border-b border-white/30">
          <StatusBar />
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <BackIcon size={24} className="text-blue-500" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">选择见面对象</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* 角色列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {characters.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400 text-lg mb-4">还没有角色</p>
                <button
                  onClick={() => navigate('/create-character')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl active:scale-95 transition-transform"
                >
                  创建角色
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {characters.map(char => (
                <div
                  key={char.id}
                  onClick={() => setSelectedCharacter(char)}
                  className="glass-card rounded-2xl p-4 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400">
                    {char.avatar ? (
                      <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                        {char.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="text-center font-semibold text-gray-900 mb-1">{char.name}</h3>
                  <p className="text-center text-xs text-gray-500 line-clamp-2">{char.description || '未设置'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-white flex flex-col">
      {/* 状态栏 + 导航栏 */}
      <div className="glass-card border-b border-white/30">
        <StatusBar />
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedCharacter(null)
              setMessages([])
            }}
            className="w-10 h-10 flex items-center justify-center active:scale-95 transition-transform"
          >
            <BackIcon size={24} className="text-blue-500" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">与 {selectedCharacter.name} 见面</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">📖 开始你的故事</p>
              <p className="text-gray-400 text-sm">输入任何内容，AI会以小说形式回复</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="animate-fadeIn">
            {message.role === 'user' ? (
              // 用户消息 - 简单展示
              <div className="flex justify-end">
                <div className="glass-card rounded-2xl px-4 py-2 max-w-[80%] shadow-lg border border-white/30">
                  <p className="text-gray-800">{message.content}</p>
                </div>
              </div>
            ) : (
              // AI消息 - 纯文字展示
              <div className="max-w-2xl">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="glass-card rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="text-sm text-gray-600 ml-2">正在创作...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="glass-card border-t border-white/30 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入任何内容，开始你的故事..."
            disabled={isGenerating}
            className="flex-1 bg-white/50 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            rows={1}
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isGenerating}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shadow-lg"
          >
            <SendIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default StoryMode
