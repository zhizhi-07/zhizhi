import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { BackIcon, SendIcon } from '../components/Icons'
import { callAI } from '../utils/api'
import { calculateContextTokens, formatTokenCount } from '../utils/tokenCounter'
import { lorebookManager } from '../utils/lorebookSystem'

interface Message {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

const OfflineChat = () => {
  const navigate = useNavigate()
  const { showStatusBar } = useSettings()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Token计数
  const [tokenStats, setTokenStats] = useState({ 
    total: 0, 
    remaining: 0, 
    percentage: 0, 
    systemPrompt: 0, 
    lorebook: 0, 
    messages: 0 
  })
  
  // 系统提示词（从预设加载）
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.')
  const [presetName, setPresetName] = useState('默认助手')
  
  // 加载当前预设（采样参数）
  const [samplingPreset, setSamplingPreset] = useState<any>(null)
  
  useEffect(() => {
    const currentSamplingPreset = localStorage.getItem('current_sampling_preset')
    if (currentSamplingPreset) {
      const preset = JSON.parse(currentSamplingPreset)
      setSamplingPreset(preset)
      setPresetName(preset.name)
    } else {
      // 默认预设
      setSamplingPreset({
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxTokens: 2000
      })
    }
  }, [])
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [inputValue])
  
  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    
    try {
      // 构建API消息
      const recentMessages = [...messages, userMessage].slice(-20)
      const messageTexts = recentMessages.map(m => m.content)
      
      // 获取世界书上下文（如果需要）
      const lorebookContext = lorebookManager.buildContext(
        'global', 
        messageTexts.join('\n'), 
        2000
      )
      
      const fullSystemPrompt = systemPrompt + 
        (lorebookContext ? `\n\n[World Info]\n${lorebookContext}` : '')
      
      // 计算Token统计
      const stats = calculateContextTokens(
        fullSystemPrompt,
        lorebookContext,
        messageTexts,
        8000
      )
      setTokenStats(stats)
      
      // 构建消息数组
      const apiMessages = [
        { role: 'system' as const, content: fullSystemPrompt },
        ...recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ]
      
      // 调用AI
      const aiResponse = await callAI(apiMessages)
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now()
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI调用失败:', error)
      alert('消息发送失败，请检查网络或API配置')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 清空对话
  const handleClear = () => {
    if (confirm('确定要清空所有对话吗？')) {
      setMessages([])
      setTokenStats({ total: 0, remaining: 0, percentage: 0, systemPrompt: 0, lorebook: 0, messages: 0 })
    }
  }
  
  // 按键处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect sticky top-0 z-50">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <button
            onClick={() => navigate(-1)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <BackIcon size={24} />
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-base font-semibold text-gray-900">线下模式</h1>
            <p className="text-[10px] text-gray-500">{presetName}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Token计数器 */}
            {tokenStats.total > 0 && (
              <div 
                className="text-[10px] px-2 py-1 rounded-md flex items-center gap-1"
                style={{
                  backgroundColor: tokenStats.percentage > 80 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                  color: tokenStats.percentage > 80 ? '#ef4444' : '#6b7280'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <span className="font-medium">{formatTokenCount(tokenStats.total)}</span>
              </div>
            )}
            
            {/* 清空按钮 */}
            <button
              onClick={handleClear}
              className="text-xs px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              清空
            </button>
          </div>
        </div>
      </div>
      
      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            <p className="text-sm">开始对话</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-white border border-gray-200'
                    : 'bg-white border border-gray-200'
                }`}
                style={{
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
              >
                <div className="text-[10px] text-gray-400 mb-1">
                  {message.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
                <span className="text-sm text-gray-500">思考中...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Shift+Enter换行)"
              className="w-full bg-transparent outline-none resize-none text-sm text-gray-800 placeholder-gray-400"
              style={{ maxHeight: '120px', minHeight: '24px' }}
              rows={1}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              backgroundColor: inputValue.trim() && !isLoading ? '#3b82f6' : '#e5e7eb',
              color: inputValue.trim() && !isLoading ? '#ffffff' : '#9ca3af'
            }}
          >
            <SendIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default OfflineChat
