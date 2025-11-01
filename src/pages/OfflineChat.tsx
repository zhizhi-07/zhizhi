/**
 * 线下聊天主页面
 * SillyTavern风格的完整实现
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { useUser } from '../context/UserContext'
import { BackIcon, SendIcon } from '../components/Icons'
import { callAI } from '../utils/api'
import { calculateContextTokens, formatTokenCount } from '../utils/tokenCounter'
import { lorebookManager } from '../utils/lorebookSystem'

// 组件导入
import CharacterSelector from '../components/offline/CharacterSelector'
import PresetSelector from '../components/offline/PresetSelector'
import MessageBubble from '../components/offline/MessageBubble'

// 类型和工具导入
import type { ChatMessage, ChatSession, TokenStats } from '../types/offline'
import type { STPreset, PromptEntry } from './PresetManager'
import {
  createUserMessage,
  createAssistantMessage,
  addSwipeToMessage,
  swipeLeft as swipeMessageLeft,
  swipeRight as swipeMessageRight,
  updateMessageContent,
  createChatSession,
  saveSession
} from '../utils/offlineChatHelpers'

const OfflineChat = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { showStatusBar } = useSettings()
  const { characters } = useCharacter()
  const { currentUser } = useUser()
  
  // ==================== 状态管理 ====================
  
  // 角色相关
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null)
  const [showCharacterSelect, setShowCharacterSelect] = useState(true)
  
  // 会话相关
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hiddenContext, setHiddenContext] = useState<ChatMessage[]>([]) // 隐藏的上下文（线上聊天记录）
  
  // 输入和加载
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // 预设相关
  const [currentPreset, setCurrentPreset] = useState<STPreset | null>(null)
  const [showPresetSelect, setShowPresetSelect] = useState(false)
  const [presets, setPresets] = useState<STPreset[]>([])
  
  // 字数设置
  const [customMaxTokens, setCustomMaxTokens] = useState<number | null>(null)
  const [showTokensAdjust, setShowTokensAdjust] = useState(false)
  
  // Token统计
  const [tokenStats, setTokenStats] = useState<TokenStats>({
    total: 0,
    remaining: 0,
    percentage: 0,
    systemPrompt: 0,
    lorebook: 0,
    messages: 0
  })
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // ==================== 初始化 ====================
  
  // 加载预设列表
  useEffect(() => {
    const savedPresets = localStorage.getItem('chat_presets')
    if (savedPresets) {
      const parsedPresets = JSON.parse(savedPresets)
      setPresets(parsedPresets)
      
      // 加载当前预设
      const currentPresetId = localStorage.getItem('current_offline_preset')
      const preset = currentPresetId
        ? parsedPresets.find((p: STPreset) => p.id === currentPresetId)
        : parsedPresets.find((p: STPreset) => p.id === 'offline_default') || parsedPresets[0]
      
      setCurrentPreset(preset || parsedPresets[0])
      
      // 如果没有保存过当前预设，默认使用offline_default
      if (!currentPresetId && preset) {
        localStorage.setItem('current_offline_preset', preset.id)
      }
    } else {
      // 如果没有预设，提示用户
      console.warn('⚠️ 没有找到预设，请前往预设管理页面创建预设')
    }
  }, [])
  
  // 检查URL参数中的角色ID和继承标记
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const charId = params.get('character')
    const inherit = params.get('inherit') === 'true'
    
    if (charId && characters.length > 0) {
      const char = characters.find(c => c.id === charId)
      if (char) {
        // 如果是从线上继承过来的
        if (inherit) {
          const inheritData = localStorage.getItem('offline_chat_inherit')
          if (inheritData) {
            try {
              const data = JSON.parse(inheritData)
              // 验证数据有效性（不超过5分钟）
              if (Date.now() - data.timestamp < 5 * 60 * 1000) {
                // 转换线上消息格式为线下格式
                const convertedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
                  id: `msg_${msg.id}_${Math.random()}`,
                  role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
                  content: msg.content || '',
                  timestamp: msg.timestamp || Date.now()
                }))
                
                console.log('📥 从线上继承对话历史:', convertedMessages.length, '条消息（隐藏显示）')
                
                // 设置角色，消息列表为空，但保存隐藏上下文
                setSelectedCharacter(char)
                setMessages([])  // UI上不显示历史消息
                setHiddenContext(convertedMessages)  // 保存为隐藏上下文，AI可见
                setShowCharacterSelect(false)
                
                // 创建会话
                if (currentPreset) {
                  const session = createChatSession(char.id, currentPreset.id)
                  session.messages = []  // 会话中也不保存历史消息
                  setCurrentSession(session)
                  saveSession(session)
                }
                
                // 清除继承数据
                localStorage.removeItem('offline_chat_inherit')
              }
            } catch (error) {
              console.error('解析继承数据失败:', error)
            }
          }
        } else {
          // 正常选择角色流程
          handleCharacterSelected(char)
        }
      }
    }
  }, [location, characters, currentPreset])
  
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
  
  // 保存会话（自动保存）
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      const updatedSession = {
        ...currentSession,
        messages
      }
      saveSession(updatedSession)
      setCurrentSession(updatedSession)
    }
  }, [messages])
  
  // ==================== 角色选择 ====================
  
  // 选择角色后，直接开始聊天（无开场白）
  const handleCharacterSelected = (character: any) => {
    setSelectedCharacter(character)
    setShowCharacterSelect(false)
    startChat(character)
  }
  
  // 开始聊天
  const startChat = (character: any) => {
    if (!currentPreset) {
      alert('请先选择预设')
      return
    }
    
    // 创建新会话（无开场白）
    const session = createChatSession(character.id, currentPreset.id)
    setMessages([])
    setCurrentSession(session)
    saveSession(session)
  }
  
  // ==================== 预设管理 ====================
  
  // 选择预设
  const handlePresetSelected = (preset: STPreset) => {
    setCurrentPreset(preset)
    localStorage.setItem('current_offline_preset', preset.id)
    setShowPresetSelect(false)
    
    // 如果当前有会话，更新会话的预设ID
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        presetId: preset.id
      }
      setCurrentSession(updatedSession)
      saveSession(updatedSession)
    }
  }
  
  // 跳转到预设管理页面
  const handleManagePresets = () => {
    navigate('/preset-manager')
  }
  
  // ==================== 构建系统提示词 ====================
  
  // 从预设构建系统提示词（只使用我们的预设）
  const buildSystemPrompt = (): string => {
    if (!currentPreset || !selectedCharacter) return ''
    
    let prompt = ''
    
    // 使用预设的prompts
    const systemPrompts = currentPreset.prompts
      ?.filter((p: PromptEntry) => p.enabled !== false && p.role === 'system')
      ?.sort((a: PromptEntry, b: PromptEntry) => (a.injection_position || 0) - (b.injection_position || 0))
    
    if (systemPrompts && systemPrompts.length > 0) {
      for (const promptEntry of systemPrompts) {
        let content = promptEntry.content
        
        // 替换占位符
        content = content.replace(/{{char}}/gi, selectedCharacter.name)
        content = content.replace(/{{user}}/gi, currentUser?.name || currentUser?.nickname || 'User')
        
        // 替换角色信息
        if (selectedCharacter.personality) {
          content = content.replace(/{{personality}}/gi, selectedCharacter.personality)
        } else if (selectedCharacter.description) {
          content = content.replace(/{{personality}}/gi, selectedCharacter.description)
        }
        
        // 替换场景
        if (selectedCharacter.scenario) {
          content = content.replace(/{{scenario}}/gi, selectedCharacter.scenario)
        }
        
        if (selectedCharacter.description) {
          content = content.replace(/{{description}}/gi, selectedCharacter.description)
        }
        
        prompt += content + '\n\n'
      }
    } else {
      // 兜底：简单提示词
      prompt = `你是 ${selectedCharacter.name}，正在和 ${currentUser?.name || 'User'} 面对面交流。\n\n`
      
      if (selectedCharacter.description) {
        prompt += selectedCharacter.description + '\n\n'
      }
      
      prompt += `用第一人称回应，对话自然真实，可以用 *动作* 描述动作。`
    }
    
    return prompt.trim()
  }
  
  // ==================== 消息发送 ====================
  
  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !currentPreset) return
    
    const userMessage = createUserMessage(inputValue)
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    
    try {
      await generateAIResponse([...messages, userMessage])
    } catch (error) {
      console.error('AI调用失败:', error)
      alert('消息发送失败，请检查网络或API配置')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 生成AI回复
  const generateAIResponse = async (currentMessages: ChatMessage[]) => {
    if (!currentPreset) return
    
    // 构建系统提示词
    const systemPrompt = buildSystemPrompt()
    
    // 合并隐藏上下文和当前消息（隐藏上下文在前，当前消息在后）
    const allMessages = [...hiddenContext, ...currentMessages]
    
    // 获取世界书上下文
    const messageTexts = allMessages.map(m => m.content)
    const lorebookContext = lorebookManager.buildContext(
      selectedCharacter?.id || 'global',
      messageTexts.join('\n'),
      currentPreset.openai_max_context || 8000
    )
    
    // 完整的系统提示词
    const fullSystemPrompt = systemPrompt +
      (lorebookContext ? `\n\n[World Info]\n${lorebookContext}` : '')
    
    // 如果有隐藏上下文，在系统提示词中说明
    const contextNote = hiddenContext.length > 0 
      ? `\n\n[前情提要: 你和用户之前在线上已经聊过 ${hiddenContext.length} 条消息，现在切换到了线下场景继续对话]`
      : ''
    
    const finalSystemPrompt = fullSystemPrompt + contextNote
    
    // 计算Token
    const stats = calculateContextTokens(
      finalSystemPrompt,
      lorebookContext,
      messageTexts,
      currentPreset.openai_max_context || 8000
    )
    setTokenStats(stats)
    
    // 构建API消息（只取最近的消息避免超出上下文）
    const maxMessages = 20
    const recentMessages = allMessages.slice(-maxMessages)
    
    const apiMessages = [
      { role: 'system' as const, content: finalSystemPrompt },
      ...recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ]
    
    // 调用AI（优先使用自定义字数，否则用预设的maxTokens）
    // 注意：temperature等参数使用用户在设置中配置的全局值
    const maxTokens = customMaxTokens || currentPreset.openai_max_tokens
    const aiResponse = await callAI(apiMessages, 1, maxTokens)
    
    // 创建AI消息
    const aiMessage = createAssistantMessage(aiResponse)
    setMessages(prev => [...prev, aiMessage])
  }
  
  // ==================== 消息操作 ====================
  
  // 编辑消息
  const handleEditMessage = (messageId: string, newContent: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? updateMessageContent(msg, newContent)
          : msg
      )
    )
  }
  
  // 删除消息
  const handleDeleteMessage = (messageId: string) => {
    if (!confirm('确定要删除这条消息吗？')) return
    
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }
  
  // 重新生成AI回复
  const handleRegenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1 || messageIndex === 0) return
    
    // 删除当前消息
    const messagesBeforeThis = messages.slice(0, messageIndex)
    setMessages(messagesBeforeThis)
    setIsLoading(true)
    
    try {
      await generateAIResponse(messagesBeforeThis)
    } catch (error) {
      console.error('重新生成失败:', error)
      alert('重新生成失败')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Swipe左（上一个回复）
  const handleSwipeLeft = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const swiped = swipeMessageLeft(msg)
          return swiped || msg
        }
        return msg
      })
    )
  }
  
  // Swipe右（下一个回复）
  const handleSwipeRight = (messageId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          const swiped = swipeMessageRight(msg)
          return swiped || msg
        }
        return msg
      })
    )
  }
  
  // ==================== 其他功能 ====================
  
  // 清空对话
  const handleClearChat = () => {
    if (!confirm('确定要清空所有对话吗？')) return
    
    setMessages([])
    setTokenStats({
      total: 0,
      remaining: 0,
      percentage: 0,
      systemPrompt: 0,
      lorebook: 0,
      messages: 0
    })
  }
  
  // 返回到角色选择
  const handleBackToCharacterSelect = () => {
    if (messages.length > 0) {
      if (!confirm('确定要返回角色选择吗？当前对话将被保存。')) return
    }
    
    setShowCharacterSelect(true)
    setSelectedCharacter(null)
    setCurrentSession(null)
    setMessages([])
  }
  
  // 按键处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // ==================== 渲染 ====================
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="glass-effect sticky top-0 z-40">
        {showStatusBar && <StatusBar />}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <button
            onClick={() => navigate('/desktop', { replace: true })}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <BackIcon size={24} />
          </button>
          
          <div className="flex flex-col items-center flex-1 mx-4">
            <button
              onClick={() => setShowCharacterSelect(true)}
              className="text-base font-semibold text-gray-900 hover:text-blue-500 transition-colors"
            >
              {selectedCharacter?.name || '线下模式'}
            </button>
            {currentPreset && (
              <button
                onClick={() => setShowPresetSelect(true)}
                className="text-[10px] text-gray-500 hover:text-blue-500 transition-colors"
              >
                {currentPreset.name}
              </button>
            )}
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
            
            {/* 字数调整按钮 */}
            <button
              onClick={() => setShowTokensAdjust(true)}
              className="text-xs px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
              title="调整回复字数"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {customMaxTokens ? `${customMaxTokens}字` : '字数'}
            </button>
            
            {/* 清空按钮 */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-xs px-2 py-1 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              >
                清空
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 线上对话延续提示 */}
        {hiddenContext.length > 0 && (
          <div className="flex justify-center mb-4">
            <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl max-w-md">
              <div className="text-xs text-blue-700 text-center">
                💬 已延续线上对话记忆（{hiddenContext.length}条消息）
              </div>
              <div className="text-[10px] text-blue-500 text-center mt-1">
                AI会记住你们之前的对话内容
              </div>
            </div>
          </div>
        )}
        
        {messages.length === 0 && hiddenContext.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
            <p className="text-sm">
              {selectedCharacter ? `开始与 ${selectedCharacter.name} 对话` : '请先选择角色'}
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            characterName={selectedCharacter?.name}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onRegenerate={handleRegenerateMessage}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
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
      {selectedCharacter && (
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
      )}
      
      {/* 弹窗 */}
      {showCharacterSelect && (
        <CharacterSelector
          characters={characters}
          onSelect={handleCharacterSelected}
          onCancel={() => navigate(-1)}
        />
      )}
      
      {showPresetSelect && (
        <PresetSelector
          presets={presets}
          currentPreset={currentPreset}
          onSelect={handlePresetSelected}
          onCancel={() => setShowPresetSelect(false)}
          onManagePresets={handleManagePresets}
        />
      )}
      
      {/* 字数调整弹窗 */}
      {showTokensAdjust && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          onClick={() => setShowTokensAdjust(false)}
        >
          <div 
            className="glass-card w-full max-w-lg p-6 rounded-t-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">回复字数设置</h3>
              <button
                onClick={() => setShowTokensAdjust(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 当前设置 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">
                  当前设置：
                  <span className="font-semibold text-gray-900 ml-2">
                    {customMaxTokens || currentPreset?.openai_max_tokens || 800} tokens
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  约 {Math.round((customMaxTokens || currentPreset?.openai_max_tokens || 800) * 0.6)} - {Math.round((customMaxTokens || currentPreset?.openai_max_tokens || 800) * 0.8)} 字
                </div>
              </div>
              
              {/* 滑块 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  调整回复长度
                </label>
                <input
                  type="range"
                  min="100"
                  max="3000"
                  step="100"
                  value={customMaxTokens || currentPreset?.openai_max_tokens || 800}
                  onChange={(e) => setCustomMaxTokens(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>简短</span>
                  <span>适中</span>
                  <span>详细</span>
                </div>
              </div>
              
              {/* 快捷选项 */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '极简', value: 200 },
                  { label: '简短', value: 500 },
                  { label: '适中', value: 1000 },
                  { label: '详细', value: 2000 }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCustomMaxTokens(option.value)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                      (customMaxTokens || currentPreset?.openai_max_tokens || 800) === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              {/* 重置按钮 */}
              {customMaxTokens && (
                <button
                  onClick={() => setCustomMaxTokens(null)}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  重置为预设默认值（{currentPreset?.openai_max_tokens}）
                </button>
              )}
              
              {/* 说明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="text-xs text-blue-800">
                  💡 <span className="font-medium">提示：</span>
                </div>
                <ul className="text-xs text-blue-700 mt-1 space-y-1 ml-4">
                  <li>• 数值越大，AI回复越详细</li>
                  <li>• 1000 tokens ≈ 600-800字</li>
                  <li>• 日常对话建议500-1000</li>
                  <li>• 需要细节时可增加到1500-2000</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setShowTokensAdjust(false)}
              className="w-full mt-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OfflineChat
