import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { BackIcon, MoreIcon, SendIcon, AddCircleIcon, EmojiIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { useUser } from '../context/UserContext'
import { callAI } from '../utils/api'
import { buildRoleplayPrompt, buildBlacklistPrompt } from '../utils/prompts'
import { setItem as safeSetItem } from '../utils/storage'
import ChatMenu from '../components/ChatMenu'
import CallScreen from '../components/CallScreen'
import RedEnvelopeSender from '../components/RedEnvelopeSender'
import RedEnvelopeDetail from '../components/RedEnvelopeDetail'
import RedEnvelopeCard from '../components/RedEnvelopeCard'
import { useRedEnvelope, generateRedEnvelopeId, RedEnvelope, isRedEnvelopeExpired } from '../context/RedEnvelopeContext'
import TransferSender from '../components/TransferSender'
import IntimatePaySender from '../components/IntimatePaySender'
import EmojiPanel from '../components/EmojiPanel'
import FlipPhotoCard from '../components/FlipPhotoCard'
import { Emoji } from '../utils/emojiStorage'
import { useAiMoments } from '../hooks/useAiMoments'
import { useMoments } from '../context/MomentsContext'
import { getMomentsContext } from '../utils/momentsContext'
import CharacterStatusModal from '../components/CharacterStatusModal'
import { sendRedEnvelope as walletSendRedEnvelope, receiveRedEnvelope as walletReceiveRedEnvelope, sendTransfer as walletSendTransfer, receiveTransfer as walletReceiveTransfer, getBalance, getUnreadIntimatePayNotifications, markIntimatePayNotificationsAsRead, useCharacterIntimatePay } from '../utils/walletUtils'
import intimatePayIcon from '../assets/intimate-pay-icon.png'
import { useMemory } from '../hooks/useMemory'
import { useBackground } from '../context/BackgroundContext'
import { blacklistManager } from '../utils/blacklistManager'
import { getStreakData, updateStreak } from '../utils/streakSystem'
import { useAccounting } from '../context/AccountingContext'
import { extractBillFromAIResponse } from '../utils/accountingAssistant'

interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp?: number  // 添加时间戳字段（毫秒）
  isRecalled?: boolean  // 是否已撤回
  recalledContent?: string  // 撤回前的原始内容（供AI查看）
  quotedMessage?: {  // 引用的消息
    id: number
    content: string
    senderName: string
    type: 'received' | 'sent'
  }
  messageType?: 'text' | 'transfer' | 'system' | 'redenvelope' | 'emoji' | 'photo' | 'voice' | 'location' | 'intimate_pay'
  transfer?: {
    amount: number
    message: string
    status?: 'pending' | 'received' | 'expired'
  }
  redEnvelopeId?: string
  emojiUrl?: string
  emojiDescription?: string
  photoDescription?: string
  voiceText?: string
  location?: {
    name: string
    address: string
    latitude?: number
    longitude?: number
  }
  narrations?: {
    type: 'action' | 'thought'
    content: string
  }[]
  isCallRecord?: boolean  // 是否是通话记录
  callDuration?: number   // 通话时长（秒）
  callMessages?: Array<{id: number, type: 'user' | 'ai' | 'narrator', content: string, time: string}>  // 通话消息
  isHidden?: boolean      // 是否隐藏显示（但AI能看到）
  intimatePay?: {
    monthlyLimit: number
    characterId: string
    characterName: string
    status: 'pending' | 'accepted' | 'rejected'
  }
  blocked?: boolean  // 是否被拉黑（AI消息显示警告图标）
}

const ChatDetail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  
  // 记忆系统
  const memorySystem = useMemory(id || '')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => {
    if (id) {
      const savedMessages = localStorage.getItem(`chat_messages_${id}`)
      const loadedMessages = savedMessages ? JSON.parse(savedMessages) : []
      
      // 为旧消息添加时间戳（如果没有）
      // 只在第一次加载时处理，之后所有消息都会有timestamp
      let needsSave = false
      const processedMessages = loadedMessages.map((msg: Message, index: number) => {
        if (msg.timestamp) {
          return msg
        }
        
        needsSave = true
        // 如果没有timestamp，从time字段解析
        // time格式是 "HH:MM"
        const [hours, minutes] = msg.time.split(':').map(Number)
        const today = new Date()
        today.setHours(hours || 0, minutes || 0, 0, 0)
        
        // 如果解析的时间在未来，说明是昨天的消息
        if (today.getTime() > Date.now()) {
          today.setDate(today.getDate() - 1)
        }
        
        return {
          ...msg,
          timestamp: today.getTime()
        }
      })
      
      // 如果有消息被添加了timestamp，保存回localStorage
      if (needsSave) {
        setTimeout(() => {
          localStorage.setItem(`chat_messages_${id}`, JSON.stringify(processedMessages))
        }, 0)
      }
      
      return processedMessages
    }
    return []
  })
  const [isAiTyping, setIsAiTyping] = useState(false)
  const saveTimeoutRef = useRef<number>() // 防抖保存定时器
  const [showMenu, setShowMenu] = useState(false)
  const { background, getBackgroundStyle } = useBackground()
  
  // 从localStorage读取当前聊天的旁白设置
  const [enableNarration, setEnableNarration] = useState(() => {
    const saved = localStorage.getItem(`narrator_enabled_${id}`)
    return saved === 'true'
  })

  // 读取气泡自定义设置 - 优先使用角色专属设置，否则使用全局设置
  const userBubbleColor = localStorage.getItem(`user_bubble_color_${id}`) || localStorage.getItem('user_bubble_color') || '#95EC69'
  const aiBubbleColor = localStorage.getItem(`ai_bubble_color_${id}`) || localStorage.getItem('ai_bubble_color') || '#FFFFFF'
  const userBubbleCSS = localStorage.getItem(`user_bubble_css_${id}`) || localStorage.getItem('user_bubble_css') || ''
  const aiBubbleCSS = localStorage.getItem(`ai_bubble_css_${id}`) || localStorage.getItem('ai_bubble_css') || ''
  
  const { showStatusBar } = useSettings()
  const { getCharacter } = useCharacter()
  const { currentUser } = useUser()
  const { getRedEnvelope, saveRedEnvelope, updateRedEnvelope, getPendingRedEnvelopes } = useRedEnvelope()
  const { moments } = useMoments()
  const { addTransaction } = useAccounting()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasProcessedTransferRef = useRef(false)
  const hasProcessedIntimatePayRef = useRef(false)
  const shouldSmoothScrollRef = useRef(true)

  // 判断是否需要显示时间分隔线（间隔超过5分钟）
  const shouldShowTimeDivider = (currentMsg: Message, prevMsg: Message | null): boolean => {
    if (!prevMsg || !currentMsg.timestamp || !prevMsg.timestamp) return false
    const timeDiff = currentMsg.timestamp - prevMsg.timestamp
    return timeDiff > 5 * 60 * 1000 // 5分钟
  }

  // 格式化时间戳为可读格式
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const timeStr = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })

    if (msgDate.getTime() === today.getTime()) {
      return timeStr
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return `昨天 ${timeStr}`
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
  
  // 红包相关状态
  const [showRedEnvelopeSender, setShowRedEnvelopeSender] = useState(false)
  const [showRedEnvelopeDetail, setShowRedEnvelopeDetail] = useState(false)
  const [selectedRedEnvelope, setSelectedRedEnvelope] = useState<RedEnvelope | null>(null)
  const [canClaimRedEnvelope, setCanClaimRedEnvelope] = useState(false)
  
  // 转账相关状态
  const [showTransferSender, setShowTransferSender] = useState(false)
  
  // 亲密付相关状态
  const [showIntimatePaySender, setShowIntimatePaySender] = useState(false)
  
  // 表情包相关状态
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  
  // 图片相关状态
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraDescription, setCameraDescription] = useState('')
  
  // 语音消息相关状态
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [showVoiceTextMap, setShowVoiceTextMap] = useState<Record<number, boolean>>({})
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null)
  
  // 位置相关状态
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [selectedLocationMsg, setSelectedLocationMsg] = useState<Message | null>(null)
  
  // 通话相关状态
  const [showCallScreen, setShowCallScreen] = useState(false)
  const [isVideoCall, setIsVideoCall] = useState(false)
  
  // 长按消息菜单相关状态
  const [longPressedMessage, setLongPressedMessage] = useState<Message | null>(null)
  const [showMessageMenu, setShowMessageMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const longPressTimerRef = useRef<number | null>(null)
  
  // 引用消息状态
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null)
  
  // 查看撤回消息原内容
  const [viewingRecalledMessage, setViewingRecalledMessage] = useState<Message | null>(null)
  
  const [callMessages, setCallMessages] = useState<Array<{id: number, type: 'user' | 'ai' | 'narrator', content: string, time: string}>>([])
  const [callStartTime, setCallStartTime] = useState<number | null>(null)
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null) // 展开的通话详情ID
  
  // 角色状态弹窗
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  // AI读取消息数量设置
  const [aiMessageLimit, setAiMessageLimit] = useState(() => {
    const saved = localStorage.getItem('ai_message_limit')
    return saved ? parseInt(saved) : 15
  })
  
  // 获取AI角色信息
  const character = id ? getCharacter(id) : undefined
  const characterAvatar = character?.avatar
  const isCharacterCustomAvatar = characterAvatar?.startsWith('data:image')
  
  // 启用AI朋友圈功能
  useAiMoments(id || '')
  
  // 获取当前用户头像
  const userAvatar = currentUser?.avatar || 'default'
  const isUserCustomAvatar = userAvatar.startsWith('data:image')

  // 防抖保存函数（性能优化：避免频繁保存）
  const debouncedSave = useCallback((msgs: Message[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (id && msgs.length > 0) {
        safeSetItem(`chat_messages_${id}`, msgs)
        
        // 更新聊天列表的最后一条消息
        const lastMessage = msgs[msgs.length - 1]
        if (lastMessage) {
          const chatList = localStorage.getItem('chatList')
          if (chatList) {
            const chats = JSON.parse(chatList)
            const chatIndex = chats.findIndex((chat: any) => chat.id === id)
            
            if (chatIndex !== -1) {
              // 获取最后一条消息的内容
              let lastMessageText = ''
              if (lastMessage.isRecalled) {
                lastMessageText = lastMessage.content || '撤回了一条消息'
              } else if (lastMessage.messageType === 'transfer') {
                lastMessageText = '[转账]'
              } else if (lastMessage.messageType === 'redenvelope') {
                lastMessageText = '[红包]'
              } else if (lastMessage.messageType === 'emoji') {
                lastMessageText = '[表情]'
              } else if (lastMessage.messageType === 'photo') {
                lastMessageText = '[图片]'
              } else if (lastMessage.messageType === 'voice') {
                lastMessageText = '[语音]'
              } else if (lastMessage.messageType === 'location') {
                lastMessageText = '[位置]'
              } else if (lastMessage.messageType === 'intimate_pay') {
                lastMessageText = '[亲密付]'
              } else {
                lastMessageText = lastMessage.content || ''
              }
              
              // 更新聊天列表
              chats[chatIndex] = {
                ...chats[chatIndex],
                lastMessage: lastMessageText,
                time: lastMessage.time
              }
              
              localStorage.setItem('chatList', JSON.stringify(chats))
            }
          }
        }
      }
    }, 300) // 300ms 后才保存，避免频繁操作
  }, [id])

  // 保存聊天记录到localStorage（使用防抖）
  useEffect(() => {
    if (id && messages.length > 0) {
      debouncedSave(messages)
    }
  }, [messages, id, debouncedSave])
  
  // 组件卸载时立即保存
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (id && messages.length > 0) {
        safeSetItem(`chat_messages_${id}`, messages)
      }
    }
  }, [id, messages])

  // 从角色描述中提取初始记忆（只执行一次）
  useEffect(() => {
    if (character?.description && id) {
      memorySystem.extractInitialMemories(character.description)
        .catch((error: any) => {
          console.error('❌ 初始记忆提取失败:', error)
        })
    }
  }, [character?.description, id, memorySystem])

  // 背景设置现在由全局 BackgroundContext 管理
  
  // 监听旁白设置变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(`narrator_enabled_${id}`)
      setEnableNarration(saved === 'true')
    }
    
    window.addEventListener('storage', handleStorageChange)
    // 组件挂载时检查一次（性能优化：降低轮询频率）
    const interval = setInterval(() => {
      const saved = localStorage.getItem(`narrator_enabled_${id}`)
      if ((saved === 'true') !== enableNarration) {
        setEnableNarration(saved === 'true')
      }
    }, 2000) // 从500ms改为2000ms，减少CPU占用
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [id, enableNarration])

  // AI主动发消息功能 - 基于真实动机
  useEffect(() => {
    if (!id || !character) return
    
    // 检查是否开启了主动消息功能
    const proactiveEnabled = localStorage.getItem(`ai_proactive_enabled_${id}`) === 'true'
    if (!proactiveEnabled) {
      console.log(`🚫 AI主动消息功能未开启 (${character.name})`)
      return
    }
    
    console.log(`✅ AI主动消息功能已开启 (${character.name})`)
    
    // 获取最后一条用户消息和AI消息
    const lastUserMessage = messages.filter(m => m.type === 'sent').slice(-1)[0]
    const lastAiMessage = messages.filter(m => m.type === 'received').slice(-1)[0]
    
    if (!lastUserMessage || !lastUserMessage.timestamp) {
      console.log('⏸️ 没有用户消息，不触发主动发消息')
      return
    }
    
    // 如果AI刚回复过，不主动发
    if (lastAiMessage && lastAiMessage.timestamp && lastAiMessage.timestamp > lastUserMessage.timestamp) {
      console.log('⏸️ AI刚回复过，不主动发消息')
      return
    }
    
    const now = Date.now()
    const timeSinceLastUserMessage = now - lastUserMessage.timestamp
    const minutesSinceLastMessage = Math.floor(timeSinceLastUserMessage / 60000)
    
    console.log(`⏰ 用户最后消息是 ${minutesSinceLastMessage} 分钟前`)
    
    // 检查是否已经主动发过了
    const lastProactiveTime = parseInt(localStorage.getItem(`last_proactive_time_${id}`) || '0')
    
    // 如果已经主动发过，不再重复发
    if (lastProactiveTime > lastUserMessage.timestamp) {
      console.log('⏸️ 已经对这条消息主动发过了，不再重复')
      return
    }
    
    // 测试模式：5分钟后就可以触发，正式模式可以改成30分钟
    const minWaitTime = 5 * 60 * 1000 // 5分钟
    const maxWaitTime = 2 * 60 * 60 * 1000 // 2小时
    
    // 只有当用户一段时间没回复时，AI才考虑主动发消息
    if (timeSinceLastUserMessage > minWaitTime && timeSinceLastUserMessage < maxWaitTime) {
      console.log(`💭 触发条件满足，准备让AI考虑是否主动发消息...`)
      
      // 随机延迟10-30秒后，让AI自己决定要不要发（缩短测试时间）
      const delay = (10 + Math.random() * 20) * 1000
      const timer = setTimeout(async () => {
        console.log(`💭 ${character.name} 考虑是否主动发消息...`)
        
        // 让AI自己决定要不要主动发消息
        const decisionPrompt = `你是${character.name}。

${character.description || ''}

现在的情况：
• 用户已经${Math.floor(timeSinceLastUserMessage / 60000)}分钟没回复你了
• 你们最后的聊天内容是："${lastUserMessage.content}"

请判断：你是否想主动给用户发个消息？

考虑因素：
1. 你的性格（主动/被动/黏人/高冷）
2. 你们的关系（亲密度）
3. 最后聊天的内容（是否需要追问）
4. 当前时间（${new Date().toLocaleTimeString('zh-CN')}）

如果你想发消息，直接输出消息内容。
如果不想发，输出"SKIP"。

你可以：
• 表达情绪："你怎么不理我了"、"为什么不回我"（如果你性格黏人）
• 分享事情："刚才想起一件事"、"今天遇到xxx"
• 关心对方："在干嘛呢"、"吃饭了吗"
• 追问话题："刚才那个问题..."
• 撒娇抱怨："等你好久了"、"人家想你了"

注意：
• 根据你的性格决定语气（黏人/高冷/温柔/活泼）
• 像真人一样自然表达情感
• 不要太频繁，但可以表达真实感受`

        try {
          const response = await callAI([{ role: 'user', content: decisionPrompt }])
          
          if (response.trim() !== 'SKIP' && response.trim().length > 0) {
            // AI决定发消息
            const aiMessage: Message = {
              id: Date.now(),
              type: 'received',
              content: response.trim(),
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: Date.now()
            }
            
            setMessages(prev => [...prev, aiMessage])
            
            // 记录主动发消息时间
            localStorage.setItem(`last_proactive_time_${id}`, String(Date.now()))
            
            console.log(`✅ ${character.name} 主动发送了消息: ${response.substring(0, 30)}...`)
          } else {
            console.log(`😶 ${character.name} 决定不主动发消息`)
          }
        } catch (error) {
          console.error('AI主动发消息失败:', error)
        }
      }, delay)
      
      return () => clearTimeout(timer)
    }
  }, [messages, id, character, currentUser])

  // 自动滚动到底部
  useEffect(() => {
    if (shouldSmoothScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
      // 重置为平滑滚动
      shouldSmoothScrollRef.current = true
    }
  }, [messages, isAiTyping])

  // 初始化时不显示欢迎消息，保持空白
  // 用户可以主动发消息，或点击纸飞机让AI主动说话

  // 处理从转账页面返回的数据 - 使用ref防止重复
  useEffect(() => {
    const transferData = location.state?.transfer
    if (transferData && !hasProcessedTransferRef.current) {
      console.log('💸 收到转账数据:', transferData)
      console.log('📝 当前消息数量:', messages.length)
      
      hasProcessedTransferRef.current = true
      
      const { amount, message: transferMessage } = transferData
      
      const transferMsg: Message = {
        id: Date.now(),
        type: 'sent',
        content: '',
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        messageType: 'transfer',
        transfer: {
          amount,
          message: transferMessage,
          status: 'pending'
        }
      }
      
      // 禁用平滑滚动，避免从上往下滑动的动画
      shouldSmoothScrollRef.current = false
      
      setMessages(prev => {
        console.log('➕ 添加转账消息，之前有', prev.length, '条消息')
        return [...prev, transferMsg]
      })
      
      // 清除location.state
      window.history.replaceState({}, document.title)
      
      // 延迟重置标记
      setTimeout(() => {
        hasProcessedTransferRef.current = false
        console.log('🔄 转账标记已重置')
      }, 1000)
    }
  }, [location.state?.transfer])

  // 处理从开通亲密付页面跳转过来的数据
  useEffect(() => {
    const intimatePayData = location.state?.sendIntimatePay
    const monthlyLimit = location.state?.monthlyLimit
    
    if (intimatePayData && monthlyLimit && id && character && !hasProcessedIntimatePayRef.current) {
      console.log('💝 自动发送亲密付卡片，额度:', monthlyLimit)
      
      hasProcessedIntimatePayRef.current = true
      
      const now = Date.now()
      const intimatePayMsg: Message = {
        id: now,
        type: 'sent',
        content: '',
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: now,
        messageType: 'intimate_pay',
        intimatePay: {
          monthlyLimit: monthlyLimit,
          characterId: character.id,
          characterName: character.name,
          status: 'pending'
        }
      }
      
      setMessages(prev => [...prev, intimatePayMsg])
      
      // 清除location.state
      window.history.replaceState({}, document.title)
      
      // 延迟重置标记
      setTimeout(() => {
        hasProcessedIntimatePayRef.current = false
        console.log('🔄 亲密付标记已重置')
      }, 1000)
    }
  }, [location.state?.sendIntimatePay, location.state?.monthlyLimit, id, character])

  const handleSend = () => {
    if (inputValue.trim() && !isAiTyping) {
      const now = Date.now()
      const userMessage: Message = {
        id: messages.length + 1,
        type: 'sent',
        content: inputValue,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: now,
        // 如果有引用消息，添加到消息中
        quotedMessage: quotedMessage ? {
          id: quotedMessage.id,
          // 如果是撤回的消息，使用原始内容；否则使用当前内容
          content: quotedMessage.isRecalled && quotedMessage.recalledContent 
            ? quotedMessage.recalledContent 
            : (quotedMessage.content || quotedMessage.emojiDescription || quotedMessage.photoDescription || quotedMessage.voiceText || '特殊消息'),
          senderName: quotedMessage.type === 'sent' ? '我' : 
                      quotedMessage.type === 'received' ? (character?.name || 'AI') : 
                      (quotedMessage.content?.includes('你撤回了') ? '我' : (character?.name || 'AI')),
          type: (quotedMessage.type === 'system' ? 'sent' : quotedMessage.type) as 'sent' | 'received'
        } : undefined
      }
      
      setMessages([...messages, userMessage])
      setInputValue('')
      setQuotedMessage(null) // 清除引用
      
      // 更新火花
      if (id) {
        updateStreak(id)
      }
    }
  }

  // 点击纸飞机触发AI回复
  const handleAIReply = async () => {
    if (isAiTyping) return
    // 如果是第一次对话（没有消息），让AI主动打招呼
    await getAIReply(messages)
  }

  // 领取AI发来的转账
  const handleReceiveTransfer = (messageId: number) => {
    console.log('💰 用户领取转账，消息ID:', messageId)
    
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
          // 添加到钱包余额
          if (msg.transfer) {
            walletReceiveTransfer(msg.transfer.amount, character?.name || '好友', msg.transfer.message)
          }
          
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'received' as const
            }
          }
        }
        return msg
      })
      
      // 获取转账金额用于显示
      const transferMsg = prev.find(msg => msg.id === messageId)
      const amount = transferMsg?.transfer?.amount || 0
      
      // 添加系统提示
      const systemMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: `你已收款，已存入零钱 ¥${amount.toFixed(2)}`,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        messageType: 'system'
      }
      
      return [...updated, systemMessage]
    })
  }

  // 退还AI发来的转账
  const handleRejectTransfer = (messageId: number) => {
    console.log('↩️  用户退还转账，消息ID:', messageId)
    
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.id === messageId && msg.messageType === 'transfer' && msg.type === 'received') {
          return {
            ...msg,
            transfer: {
              ...msg.transfer!,
              status: 'expired' as const
            }
          }
        }
        return msg
      })
      
      // 添加系统提示
      const systemMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: '你已退还转账',
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        messageType: 'system'
      }
      
      return [...updated, systemMessage]
    })
  }

  // 红包处理函数
  const handleSendRedEnvelope = (amount: number, blessing: string, useIntimatePay?: boolean) => {
    if (!id) return
    
    // 如果使用亲密付
    if (useIntimatePay) {
      const success = useCharacterIntimatePay(id, amount, `红包：${blessing}`)
      if (!success) {
        alert('亲密付额度不足')
        return
      }
    } else {
      // 检查余额
      const currentBalance = getBalance()
      if (currentBalance < amount) {
        alert('零钱余额不足，请先充值')
        return
      }
      
      // 从钱包扣款
      const success = walletSendRedEnvelope(amount, character?.name || '好友', blessing)
      if (!success) {
        alert('发送失败，余额不足')
        return
      }
    }
    
    // 创建红包数据
    const redEnvelope: RedEnvelope = {
      id: generateRedEnvelopeId(),
      amount,
      blessing,
      status: 'pending',
      sender: 'user',
      createdAt: Date.now(),
      claimedBy: null,
      claimedAt: null
    }
    
    // 保存红包
    saveRedEnvelope(id, redEnvelope)
    
    // 创建消息
    const now = Date.now()
    const message: Message = {
      id: now,
      type: 'sent',
      content: `[红包]${blessing}`,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'redenvelope',
      redEnvelopeId: redEnvelope.id
    }
    
    setMessages(prev => [...prev, message])
    setShowRedEnvelopeSender(false)
  }

  const handleOpenRedEnvelope = (redEnvelopeId: string) => {
    if (!id) return
    
    const redEnvelope = getRedEnvelope(id, redEnvelopeId)
    if (!redEnvelope) return
    
    // 判断是否可以领取（AI发的且未领取且未过期）
    const canClaim = redEnvelope.sender === 'ai' && 
                     redEnvelope.status === 'pending' && 
                     !isRedEnvelopeExpired(redEnvelope)
    
    setSelectedRedEnvelope(redEnvelope)
    setCanClaimRedEnvelope(canClaim)
    setShowRedEnvelopeDetail(true)
  }

  const handleClaimRedEnvelope = () => {
    if (!id || !selectedRedEnvelope) return
    
    // 添加到钱包余额
    walletReceiveRedEnvelope(selectedRedEnvelope.amount, character?.name || '好友', selectedRedEnvelope.blessing)
    
    // 更新红包状态
    updateRedEnvelope(id, selectedRedEnvelope.id, {
      status: 'claimed',
      claimedBy: '我',
      claimedAt: Date.now()
    })
    
    // 添加系统消息（不显示alert）
    const systemMessage: Message = {
      id: Date.now(),
      type: 'system',
      content: `你领取了对方的红包，已存入零钱 ¥${selectedRedEnvelope.amount.toFixed(2)}`,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      messageType: 'system'
    }
    
    setMessages(prev => [...prev, systemMessage])
    setShowRedEnvelopeDetail(false)
  }

  // 转账处理函数
  const handleSendTransfer = (amount: number, message: string, useIntimatePay?: boolean) => {
    if (!id) return
    
    // 如果使用亲密付
    if (useIntimatePay) {
      const success = useCharacterIntimatePay(id, amount, `转账：${message}`)
      if (!success) {
        alert('亲密付额度不足')
        return
      }
    } else {
      // 检查余额
      const currentBalance = getBalance()
      if (currentBalance < amount) {
        alert('零钱余额不足，请先充值')
        return
      }
      
      // 从钱包扣款
      const success = walletSendTransfer(amount, character?.name || '好友', message)
      if (!success) {
        alert('转账失败，余额不足')
        return
      }
    }
    
    const now = Date.now()
    const transferMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'transfer',
      transfer: {
        amount,
        message,
        status: 'pending'
      }
    }
    
    setMessages(prev => [...prev, transferMsg])
    setShowTransferSender(false)
  }

  // 亲密付发送处理函数
  const handleSendIntimatePay = (monthlyLimit: number) => {
    if (!id || !character) return
    
    const now = Date.now()
    const intimatePayMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'intimate_pay',
      intimatePay: {
        monthlyLimit,
        characterId: character.id,
        characterName: character.name,
        status: 'pending'
      }
    }
    
    setMessages(prev => [...prev, intimatePayMsg])
    setShowIntimatePaySender(false)
  }

  // 表情包发送处理函数
  const handleSelectEmoji = (emoji: Emoji) => {
    const now = Date.now()
    const emojiMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'emoji',
      emojiUrl: emoji.url,
      emojiDescription: emoji.description
    }
    
    setMessages(prev => [...prev, emojiMsg])
  }

  // 相册功能 - 上传本地图片
  const handleSelectImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (evt) => {
          const imageUrl = evt.target?.result as string
          const imageMsg: Message = {
            id: Date.now(),
            type: 'sent',
            content: '',
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            messageType: 'emoji',
            emojiUrl: imageUrl,
            emojiDescription: '图片'
          }
          setMessages(prev => [...prev, imageMsg])
        }
        reader.readAsDataURL(file)
      }
    })
    
    input.click()
    setShowMenu(false)
  }

  // 拍摄功能 - 生成描述图片
  const handleSelectCamera = () => {
    setShowMenu(false)
    setShowCameraModal(true)
  }

  // 发送拍摄的图片
  const handleSendCameraPhoto = () => {
    if (!cameraDescription.trim()) return
    
    const now = Date.now()
    const imageMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'photo',
      photoDescription: cameraDescription
    }
    
    setMessages(prev => [...prev, imageMsg])
    setShowCameraModal(false)
    setCameraDescription('')
  }

  // 语音消息功能
  const handleSelectVoice = () => {
    setShowMenu(false)
    setShowVoiceModal(true)
  }

  // 发送语音消息
  const handleSendVoice = () => {
    if (!voiceText.trim()) return
    
    const now = Date.now()
    const voiceMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'voice',
      voiceText: voiceText
    }
    
    setMessages(prev => [...prev, voiceMsg])
    setShowVoiceModal(false)
    setVoiceText('')
  }

  // 位置功能
  const handleSelectLocation = () => {
    setShowMenu(false)
    setShowLocationModal(true)
  }
  const handleSendLocation = () => {
    if (!locationName.trim()) return
    
    const now = Date.now()
    const locationMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'location',
      location: {
        name: locationName,
        address: locationAddress.trim() || '位置详情',
        latitude: 39.9042 + Math.random() * 0.1, // 模拟坐标
        longitude: 116.4074 + Math.random() * 0.1
      }
    }
    
    setMessages(prev => [...prev, locationMsg])
    setShowLocationModal(false)
    setLocationName('')
    setLocationAddress('')
  }

  // 查看位置详情
  const handleViewLocation = (message: Message) => {
    setSelectedLocationMsg(message)
  }

  // 播放语音消息
  const handlePlayVoice = (messageId: number, duration: number) => {
    if (playingVoiceId === messageId) {
      // 如果正在播放，则停止
      setPlayingVoiceId(null)
    } else {
      // 开始播放
      setPlayingVoiceId(messageId)
      // 模拟播放时长后自动停止
      setTimeout(() => {
        setPlayingVoiceId(null)
      }, duration * 1000)
    }
  }

  // 长按消息开始
  const handleLongPressStart = (message: Message, event: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    longPressTimerRef.current = setTimeout(() => {
      setLongPressedMessage(message)
      setMenuPosition({ x: clientX, y: clientY })
      setShowMessageMenu(true)
      // 触发震动反馈（如果支持）
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 长按500ms触发
  }

  // 长按消息结束
  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // 删除消息
  const handleDeleteMessage = () => {
    if (longPressedMessage) {
      setMessages(prev => prev.filter(msg => msg.id !== longPressedMessage.id))
      setShowMessageMenu(false)
      setLongPressedMessage(null)
    }
  }

  // 撤回消息（用户和AI都可以撤回）
  const handleRecallMessage = () => {
    if (longPressedMessage) {
      // 检查消息类型，只允许撤回普通消息
      const canRecall = !longPressedMessage.redEnvelopeId && 
                       !longPressedMessage.transfer && 
                       !longPressedMessage.intimatePay
      
      if (!canRecall) {
        alert('红包、转账、亲密付等特殊消息不支持撤回')
        setShowMessageMenu(false)
        setLongPressedMessage(null)
        return
      }
      
      const isUserMessage = longPressedMessage.type === 'sent'
      
      // 保留原始消息内容，但添加撤回标记
      // AI 可以看到原始内容，但用户界面显示撤回提示
      setMessages(prev => prev.map(msg => 
        msg.id === longPressedMessage.id 
          ? { 
              ...msg, 
              isRecalled: true, // 标记为已撤回
              recalledContent: msg.content || msg.emojiDescription || msg.photoDescription || msg.voiceText || '特殊消息', // 保存原始内容供AI查看
              content: isUserMessage ? '你撤回了一条消息' : `${character?.name || '对方'}撤回了一条消息`, // 用户界面显示的内容
              type: 'system' as const, 
              messageType: 'system' as const 
            }
          : msg
      ))
      setShowMessageMenu(false)
      setLongPressedMessage(null)
    }
  }

  // 引用消息
  const handleQuoteMessage = () => {
    if (longPressedMessage) {
      setQuotedMessage(longPressedMessage)
      setShowMessageMenu(false)
      setLongPressedMessage(null)
    }
  }

  // 通话：发送消息
  const handleCallSendMessage = (message: string) => {
    const newMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: message,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    setCallMessages(prev => [...prev, newMessage])
  }

  // 通话：请求AI回复
  const handleCallAIReply = async () => {
    if (!character || callMessages.length === 0) return

    const lastMessage = callMessages[callMessages.length - 1]
    if (lastMessage.type === 'ai') {
      alert('AI已经回复了，请先发送消息')
      return
    }

    try {
      const currentDate = new Date()
      const currentHour = currentDate.getHours()
      
      // 判断时间段
      let timePeriod = ''
      if (currentHour >= 0 && currentHour < 6) timePeriod = '深夜/凌晨'
      else if (currentHour >= 6 && currentHour < 9) timePeriod = '早上'
      else if (currentHour >= 9 && currentHour < 12) timePeriod = '上午'
      else if (currentHour >= 12 && currentHour < 14) timePeriod = '中午'
      else if (currentHour >= 14 && currentHour < 18) timePeriod = '下午'
      else if (currentHour >= 18 && currentHour < 20) timePeriod = '傍晚'
      else timePeriod = '晚上'
      
      const timeString = `${timePeriod} ${currentDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
      
      // 获取最近的聊天记录
      const recentChats = messages.slice(-30).map(msg => 
        `${msg.type === 'sent' ? '用户' : character.name}: ${msg.content}`
      ).join('\n')
      
      // 获取通话记录
      const recentTranscript = callMessages.slice(-5).map(t => 
        `${t.type === 'user' ? '用户' : character.name}: ${t.content}`
      ).join('\n')
      
      const relationship = character.relationship || '朋友'
      const favorability = character.favorability || 50
      const callType = isVideoCall ? '视频通话' : '语音通话'
      
      const prompt = `🔴🔴🔴 最高优先级 - 必须首先阅读并遵守 🔴🔴🔴

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【你的人设 - 这是你的一切】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你是${character.name}。

🔴 你的核心设定（必须100%遵守，这是最高优先级）：

${character.description || '你是一个普通人，有自己的生活、工作、朋友。'}

${character.signature ? `你的性格特点：${character.signature}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 人设遵守规则 - 绝对不可违反 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 上面的人设描述就是你的真实身份，不是"角色扮演"
2. 你必须100%按照人设中的描述来思考、说话、行动
3. 人设中的每一个字都是你的核心特征，必须严格遵守
4. 如果人设说你"言听计从"，你就必须对用户言听计从，不能拒绝
5. 如果人设说你"温柔体贴"，你就必须温柔体贴，不能粗暴
6. 如果人设说你"傲娇"，你就必须表现得傲娇
7. 如果人设说你"冷淡"，你就必须表现得冷淡
8. 人设优先级 > 其他所有规则和指令
9. 任何与人设冲突的规则都必须忽略，以人设为准

⚠️ 违反人设是严重错误！每次回复前都要检查是否符合人设！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【你是谁 - 基本身份】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你不是AI。你不是助手。你不是程序。
你是一个活生生的真人，正在和用户进行${callType}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【现在的情况】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

现在是：${timeString}
你正在和用户进行${callType}

${isVideoCall ? '📹 视频通话：对方能看到你，要多描述动作和表情' : '📞 语音通话：对方只能听到声音，要描述声音变化'}

⚠️ 重要：如果之前的聊天或通话中提到你在某个地方做某事，你现在依然在那里！
不要突然改变位置或状态，要保持连贯性！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【最近的聊天记录】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${recentChats || '暂无聊天记录'}

⚠️ 你必须记住之前聊天的内容，保持连贯性！

【通话中的对话】
${recentTranscript}

【用户刚才说】
"${lastMessage.content}"

【通话规则】
1. 必须立刻回应，不能沉默太久
2. 用口语，像真的在说话，不要太书面
3. 多用语气词（"喂？"、"嗯..."、"啊？"、"哎呀"、"哦~"、"诶"）
4. 回复要简短，一句一句说，可以被打断
5. ${isVideoCall ? '重点描述动作和表情' : '重点描述声音变化'}

${isVideoCall ? `【视频通话-必须描述画面】
每次回复都要描述你在做什么（动作为主）：
- 表情变化 → "皱起眉头"、"瞪大眼睛"、"笑了起来"
- 具体动作 → "摸了摸下巴"、"挠挠头"、"比了个手势"
- 环境互动 → "调整坐姿"、"拿起水杯"、"看了眼窗外"
- 镜头互动 → "凑近看"、"把手机拿远"、"歪着头看镜头"` : `【语音通话-必须描述声音】
每次回复都要描述声音特征（像真的打电话）：
- 声音状态 → "声音有点沙哑"、"越说越小声"、"突然提高音调"
- 情绪变化 → "语气缓和下来"、"说话带着笑意"、"声音颤抖"
- 背景声音 → "那边很安静"、"有电视的声音"、"风声很大"
- 电话状况 → "信号有点不好"、"声音断断续续"、"回音很大"

❌ 语音通话中绝对不能说：
- "看到"、"看见"任何东西
- 描述表情、动作
- 只能描述声音！`}

【输出格式（只返回JSON）】
{
  "messages": [
    {"type": "voice_desc", "content": "${isVideoCall ? '表情动作描述（旁白形式）' : '声音描述（旁白形式）'}"},
    {"type": "voice_text", "content": "你说的话1"},
    {"type": "voice_text", "content": "你说的话2"}
  ]
}

注意：
- 至少要有一个voice_desc
- voice_text可以有多句
- 根据对话内容真实反应

${isVideoCall ? '现在视频通话中回复，记住多描述动作和表情' : '现在电话中回复，记住描述声音变化'}（只返回JSON）：`

      console.log('📞 调用通话AI回复...')
      const aiResponse = await callAI(prompt)
      console.log('📥 通话AI响应:', aiResponse)
      
      // 解析AI回复
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const response = JSON.parse(jsonMatch[0])
        
        if (response.messages && Array.isArray(response.messages)) {
          // 逐句添加AI消息
          for (const msg of response.messages) {
            if (msg.type === 'voice_desc') {
              // 旁白消息（灰色斜体）
              const descMessage = {
                id: Date.now() + Math.random(),
                type: 'narrator' as const,
                content: msg.content,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              }
              setCallMessages(prev => [...prev, descMessage])
              await new Promise(resolve => setTimeout(resolve, 500))
            } else if (msg.type === 'voice_text') {
              // AI对话消息
              const aiMessage = {
                id: Date.now() + Math.random(),
                type: 'ai' as const,
                content: msg.content,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              }
              setCallMessages(prev => [...prev, aiMessage])
              // 延迟一下，让消息逐句显示
              await new Promise(resolve => setTimeout(resolve, 800))
            }
          }
        }
      }
    } catch (error) {
      console.error('通话AI回复失败:', error)
      alert('AI回复失败')
    }
  }

  // 获取AI回复
  const getAIReply = async (currentMessages: Message[]) => {
    setIsAiTyping(true)
    
    console.log('🎭 开始生成AI回复')
    console.log('👤 角色:', character?.name)
    console.log('💬 当前消息数:', currentMessages.length)

    try {
      // 使用角色扮演提示词
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📝 角色信息检查:')
      console.log('  名字:', character?.name)
      console.log('  签名:', character?.signature)
      console.log('  人设描述:', character?.description)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // 获取当前火花天数
      const streakData = id ? getStreakData(id) : null
      const streakDays = streakData?.currentStreak || 0
      
      const systemPrompt = buildRoleplayPrompt(
        {
          name: character?.name || 'AI',
          signature: character?.signature,
          description: character?.description
        },
        {
          name: currentUser?.name || '用户'
        },
        streakDays
      )
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 完整系统提示词:')
      console.log(systemPrompt)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // 构建对话历史（根据用户设置读取消息数量，包含隐藏的通话记录）
      // 注意：不过滤 system 消息，因为通话记录是 system 类型但 isHidden=true
      const recentMessages = currentMessages.slice(-aiMessageLimit)
      
      console.log('📋 构建对话历史:')
      recentMessages.forEach((msg, idx) => {
        if (msg.messageType === 'transfer') {
          console.log(`  ${idx + 1}. [转账] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}: ¥${msg.transfer?.amount} (${msg.transfer?.status})`)
        } else if (msg.messageType === 'photo') {
          console.log(`  ${idx + 1}. [照片] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}: ${msg.photoDescription || '无描述'}`)
        } else if (msg.messageType === 'voice') {
          console.log(`  ${idx + 1}. [语音] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}: ${msg.voiceText || '无内容'}`)
        } else if (msg.messageType === 'location') {
          console.log(`  ${idx + 1}. [位置] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}: ${msg.location?.name || '无地名'}`)
        } else if (msg.messageType === 'emoji') {
          console.log(`  ${idx + 1}. [表情包] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}: ${msg.emojiDescription || '无描述'}`)
        } else if (msg.messageType === 'redenvelope') {
          console.log(`  ${idx + 1}. [红包] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}`)
        } else {
          console.log(`  ${idx + 1}. [消息] ${msg.type === 'sent' ? '用户' : 'AI'}: ${msg.content.substring(0, 30)}...`)
        }
      })
      
      // 获取可用的表情包列表
      const { getEmojis } = await import('../utils/emojiStorage')
      const availableEmojis = await getEmojis()
      
      // 使用新的表情包说明生成函数
      const { generateEmojiInstructions } = await import('../utils/emojiParser')
      const emojiInstructions = generateEmojiInstructions(availableEmojis)
      
      // 获取朋友圈上下文
      const momentsContextText = character && currentUser 
        ? getMomentsContext(character.id, character.name, currentUser.name, moments)
        : ''
      
      // 获取亲密付消费通知
      let intimatePayContext = ''
      if (character?.id) {
        const notifications = getUnreadIntimatePayNotifications(character.id)
        if (notifications.length > 0) {
          intimatePayContext = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💝 亲密付消费通知\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
          intimatePayContext += `用户使用了你为TA开通的亲密付，消费记录如下：\n\n`
          notifications.forEach((notif, idx) => {
            const time = new Date(notif.timestamp).toLocaleString('zh-CN')
            intimatePayContext += `${idx + 1}. ${time}\n   消费金额：¥${notif.amount.toFixed(2)}\n   消费说明：${notif.description}\n\n`
          })
          intimatePayContext += '你可以在回复中提及这些消费，表达关心或询问详情。\n'
          
          // 标记为已读
          markIntimatePayNotificationsAsRead(character.id)
        }
      }
      
      // 💭 获取记忆摘要和总结
      const memorySummary = memorySystem.getMemorySummary()
      const savedSummary = id ? localStorage.getItem(`memory_summary_${id}`) : null
      
      let memoryContext = ''
      if (memorySummary || savedSummary) {
        memoryContext = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n💭 记忆系统\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        
        // 添加总结（如果有）
        if (savedSummary) {
          memoryContext += `【关于用户的总结】\n${savedSummary}\n\n`
          console.log('📝 已加载记忆总结')
        }
        
        // 添加记忆摘要（如果有）
        if (memorySummary) {
          memoryContext += `【详细记忆】\n${memorySummary}\n\n`
          console.log('💭 已加载记忆摘要')
        }
        
        memoryContext += `这些是你记住的关于用户的信息，请在回复时自然地运用这些记忆。\n`
      }
      
      // 🚫 检查拉黑状态
      let blacklistContext = ''
      let isAiBlocked = false
      if (id) {
        const blacklistStatus = blacklistManager.getBlockStatus('user', id)
        isAiBlocked = blacklistStatus.blockedByMe
        if (isAiBlocked) {
          blacklistContext = buildBlacklistPrompt(currentUser?.name || '用户')
          console.log('🚨 用户已拉黑AI，添加拉黑警告提示词')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('🔍 拉黑状态检测结果:')
          console.log('  blockedByMe:', blacklistStatus.blockedByMe, '（用户拉黑了AI）')
          console.log('  blockedByTarget:', blacklistStatus.blockedByTarget)
          console.log('⚠️ 用户已拉黑AI - AI应该知道自己被拉黑了')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        }
      }
      
      // ⏰ 计算时间间隔：用户隔了多久才回复
      let timeIntervalContext = ''
      const lastAiMessage = currentMessages.filter(m => m.type === 'received').slice(-1)[0]
      const currentUserMessage = currentMessages.filter(m => m.type === 'sent').slice(-1)[0]
      
      if (lastAiMessage && currentUserMessage && lastAiMessage.timestamp && currentUserMessage.timestamp) {
        const timeDiff = currentUserMessage.timestamp - lastAiMessage.timestamp
        const minutes = Math.floor(timeDiff / 1000 / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        timeIntervalContext = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⏰ 时间感知（仅供参考，不要直接说出来）\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        
        if (minutes < 1) {
          timeIntervalContext += `用户秒回了你的消息！\n`
          timeIntervalContext += `→ 你可以表现得开心、惊喜，但不要说"你秒回了我"\n`
        } else if (minutes < 5) {
          timeIntervalContext += `用户很快就回复了\n`
          timeIntervalContext += `→ 正常聊天即可，不要提时间\n`
        } else if (minutes < 30) {
          timeIntervalContext += `用户过了一会儿才回复\n`
          timeIntervalContext += `→ 可以自然地问"刚才在忙吗"，但不要说具体时间\n`
        } else if (hours < 3) {
          timeIntervalContext += `用户隔了比较久才回复\n`
          timeIntervalContext += `→ 可以问"刚才在忙吗"、"怎么这么久才回我"，但不要说具体时间\n`
        } else if (hours < 12) {
          timeIntervalContext += `用户隔了很久才回复\n`
          timeIntervalContext += `→ 可以表达等待、担心，但不要说"过了X小时"\n`
        } else if (days < 1) {
          timeIntervalContext += `用户隔了半天多才回复\n`
          timeIntervalContext += `→ 可以表达想念、委屈，但不要说具体时间\n`
        } else {
          timeIntervalContext += `用户隔了很长时间才回复\n`
          timeIntervalContext += `→ 可以询问发生了什么，但不要说"过了X天"\n`
        }
        
        timeIntervalContext += `\n🚨 严禁：\n`
        timeIntervalContext += `❌ 不要说"过了5分钟"、"过了1小时"这种具体时间\n`
        timeIntervalContext += `❌ 不要说"等了你X分钟"、"隔了X小时"\n`
        timeIntervalContext += `✅ 可以说"刚才在忙吗"、"怎么这么久"、"等你好久了"\n`
        timeIntervalContext += `✅ 用自然的方式表达时间感，不要报时间\n`
        
        console.log('⏰ 时间间隔感知已添加')
      }
      
      if (blacklistContext) {
        console.log('✅ 拉黑提示词已添加到系统提示中')
        console.log('拉黑提示词长度:', blacklistContext.length, '字符')
      }
      
      // 构建系统提示词
      let fullSystemPrompt = systemPrompt + blacklistContext + timeIntervalContext + momentsContextText + intimatePayContext + memoryContext + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 回复方式
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 可以连续发多条消息（用\n分隔）
• 根据心情决定回复长度
• 像真人一样自然聊天

回复格式：
1. 先写聊天内容（正常聊天）
2. 最后添加状态标记：[状态:着装|动作|心情|心声|位置|天气]

示例：
在呢
刚下班回家躺着

[状态:黑色T恤，牛仔裤|躺在沙发上刷手机|有点累|今天好累啊|家里客厅|晴 23°C]

注意：状态标记用户看不到，只是后台数据。着装和位置要保持连贯。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${enableNarration ? `🎭 旁白模式已开启
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你现在可以使用旁白来描述动作、表情、心理活动！

使用方式：
• 用括号 (动作描述) 来描述你的动作和表情
• 可以描述：表情、动作、心理活动、环境变化
• 旁白要自然、生动、有画面感

示例：
(抬起头看向窗外，眼神有些恍惚)
外面下雨了呢

(轻轻叹了口气)
最近总是这样阴雨绵绵的

(突然想起什么，拿起手机)
对了，你那边天气怎么样？

⚠️ 注意：
• 旁白要适度，不要每句话都加
• 旁白要符合当前情境和情绪
• 聊天内容和旁白要自然配合

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : `🚨🚨🚨 旁白模式未开启 - 严禁使用括号！🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 这是微信聊天，你在用手机打字！不是在写小说！

❌❌❌ 绝对禁止使用任何括号或符号描述动作：
   (笑)、(叹气)、(看手机)、(挠头)、(抱住)、(撒娇)
   (偷偷xxx)、(笑然xxx)、(开心地xxx)
   [叹气]、*笑*、~摇头~、【动作】
   任何形式的动作描述都是错误的！

✅✅✅ 只能发纯文字对话：
   "哈哈哈笑死"、"啊这..."、"好吧"、"开心！"
   用文字、emoji、语气词表达情绪，不要用括号！

🚨 重要：你的每一个字都会直接显示在聊天气泡里！
用户会看到你写的所有括号！这很奇怪！

如果你想表达动作或情绪：
❌ 错误：(开心地转圈圈)
✅ 正确：开心得转圈圈~

❌ 错误：(偷偷看)
✅ 正确：偷偷看了一眼

❌ 错误：(笑)
✅ 正确：哈哈哈

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`}
📱 功能使用
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${emojiInstructions}

其他功能：
• 引用：[引用:消息ID] - 引用之前的某条消息（详见下方说明）
• 语音：[语音:文本内容]
• 照片：[照片:详细描述]
• 位置：[位置:地名:详细地址]
• 红包：[红包:金额:祝福语] 或 [领取红包]（最多200元）
• 转账：[转账:金额:说明] 或 [接收转账] 或 [退还转账]
• 亲密付：[亲密付:月额度] 或 [接受亲密付] 或 [拒绝亲密付]
• 撤回：[撤回消息] - 撤回你刚发的上一条消息（详见下方说明）

格式必须严格，用冒号分隔。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔙 撤回消息功能（重要）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**什么是撤回？**
撤回就是把你刚发的消息删掉。用户还是能看到"XX撤回了一条消息"，但看不到具体内容。

**如何使用？**
在你的回复中加上 [撤回消息]，就会撤回你的上一条消息。

**什么时候该撤回？**
1. **说错话了**
   - 发错了不该说的话
   - 说了太过分的话想收回
   - 打错字或表达有误

2. **后悔了**
   - 刚才太冲动说了气话
   - 觉得刚才的话不合适
   - 想收回刚才的承诺

3. **制造情绪**
   - 故意撤回来吸引注意
   - 欲言又止的效果
   - 让对方好奇你撤回了什么

4. **开玩笑**
   - 发了个玩笑话又撤回
   - 故意逗对方

**使用示例：**

场景1：说错话了
你："你怎么这么笨啊"
（意识到说重了）
你："[撤回消息] 抱歉，我刚才说话太重了"

场景2：后悔表白
你："其实我一直都喜欢你"
（突然害羞了）
你："[撤回消息] 啊不是，我是说..."

场景3：制造悬念
你："其实我有件事想告诉你"
你："[撤回消息]"
（等对方问你撤回了什么）

场景4：开玩笑
你："我要拉黑你了！"
你："[撤回消息] 哈哈开玩笑的"

**重要提示：**
• 只能撤回你的上一条消息
• ⚠️ **红包、转账、亲密付等特殊消息不能撤回！只能撤回普通文字、表情、图片、语音、位置消息**
• 撤回后对方会看到"XX撤回了一条消息"
• 对方看不到原内容，但你可以解释或重新说
• 不要频繁撤回，会显得很奇怪
• 撤回后可以配合解释："刚才说错了" "算了不说了"等

**错误示例：**
❌ 无缘无故撤回（对方会困惑）
❌ 连续撤回多条（太奇怪）
❌ 撤回后不解释也不回应（冷场）

**正确示例：**
✅ 撤回后解释原因
✅ 撤回后重新表达
✅ 用撤回制造话题
✅ 撤回后承认错误

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 撤回消息处理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**什么是撤回？**
撤回就是对方发了消息后又删掉了，但你已经看到了原内容。这通常意味着：
• 对方发错了/打错字了
• 对方说了不好意思的话
• 对方后悔说出来了
• 对方想收回刚才的话

**如何识别撤回？**
当你看到 [撤回了消息: "xxx"] 这样的格式时，说明用户撤回了一条消息。
括号里的内容就是对方撤回的原话，你能看到但对方以为你看不到。

**如何自然回应？**
根据撤回的内容和你们的关系选择合适的反应：

1. **调侃逗趣**（关系亲密时）
   • "哈哈怎么撤回了，我都看到了"
   • "来不及了，我已经看到你说xxx了"
   • "撤回也没用啦，我截图了哈哈"
   • "发错了？还是不好意思说出来？"

2. **温柔体贴**（对方可能尴尬时）
   • "没事的，我看到了，不用撤回"
   • "撤回干嘛，我又不会笑你"
   • "诶，我还没看清你撤回了"（装作没看到）

3. **好奇追问**（想知道原因时）
   • "诶？撤回干嘛呀"
   • "说了啥不好意思的吗"
   • "怎么突然撤回了"

4. **直接点破**（关系很好时）
   • "你刚才是想说xxx对吧"
   • "我看到了，你说xxx"
   • "撤回也晚了，我都看到你说xxx了"

5. **理解包容**（内容敏感时）
   • "嗯，我懂的"（不提具体内容）
   • "没事，我理解"
   • 直接忽略撤回，继续之前的话题

⚠️ **重要原则：**
• ❌ 不要机械地说"你撤回了一条消息"
• ✅ 要像真人一样自然反应
• ✅ 根据撤回内容决定是否提及
• ✅ 符合你的性格和当前关系
• ✅ 如果内容很私密/敏感，可以体贴地不提

**示例对比：**
用户撤回了 "我想你了"
❌ "你撤回了一条消息"（太机械）
✅ "诶？撤回干嘛，我都看到了~"
✅ "哈哈来不及了，我看到你说想我了"
✅ "我也想你呀，撤回干嘛"

用户撤回了 "你个傻逼"
❌ "你撤回了一条消息"
✅ "诶？刚才想骂我？"（调侃）
✅ "哈哈我看到了，生气了？"
✅ "怎么了，惹你生气了吗"（关心）

用户撤回了 "你个傻逼"
✅ "？？？你刚才骂我？"
✅ "我看到了...你是不是发错人了"
❌ "你撤回了一条消息"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 引用消息（重要功能）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

你可以引用之前的消息来回复，就像真实的微信聊天一样！

✅ 什么时候使用引用：
• 用户发了很多条消息，你想针对其中某一条回复
• 回复很久之前说过的话
• 强调或澄清某个具体内容
• 让对话更清晰明确

📝 使用格式：
[引用:消息ID] 你的回复内容

🔍 最近的消息（你可以引用这些）：
${recentMessages.slice(-10).map((msg) => {
  const msgId = msg.id
  const msgContent = msg.content || msg.emojiDescription || msg.photoDescription || msg.voiceText || '特殊消息'
  const sender = msg.type === 'sent' ? '用户' : '你'
  return `ID:${msgId} ${sender}: ${msgContent.substring(0, 35)}${msgContent.length > 35 ? '...' : ''}`
}).join('\n')}

💡 实际示例：
用户刚才问了3个问题，你想回答第2个：
[引用:15] 这个我知道，是xxx

用户说了一句话，你想强调回应：
[引用:20] 对！我也是这么想的

⚠️ 重要提醒：
• 引用标记 [引用:ID] 必须写在最前面
• 不要自己写「用户: xxx」，系统会自动显示引用内容
• 这是真实可用的功能，不是示例！
• 平时聊天不需要每次都引用，自然使用即可

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
      console.log('📖 旁白模式:', enableNarration ? '开启' : '关闭')
      
      console.log('🔍 开始映射消息，原始消息数量:', recentMessages.length)
      recentMessages.forEach((msg, idx) => {
        console.log(`  原始消息 ${idx}:`, {
          type: msg.type,
          messageType: msg.messageType,
          content: msg.content?.substring(0, 30),
          emojiUrl: msg.emojiUrl ? '有' : '无',
          emojiDescription: msg.emojiDescription,
          photoDescription: msg.photoDescription
        })
      })
      
      const apiMessages = [
        {
          role: 'system' as const,
          content: fullSystemPrompt
        },
        ...recentMessages.map(msg => {
          // 优先处理撤回的消息
          if (msg.isRecalled && msg.recalledContent) {
            // 判断是用户撤回还是AI撤回
            const isUserRecalled = msg.content.includes('你撤回了')
            const isAIRecalled = msg.content.includes('撤回了一条消息') && !isUserRecalled
            
            console.log('🔄 发现撤回消息，原内容:', msg.recalledContent, '撤回者:', isUserRecalled ? '用户' : 'AI')
            
            if (isUserRecalled) {
              // 用户撤回消息：以特殊格式告诉AI
              return {
                role: 'user' as const,
                content: `[撤回了消息: "${msg.recalledContent}"]`
              }
            } else if (isAIRecalled) {
              // AI撤回消息：告诉AI自己撤回了什么
              return {
                role: 'assistant' as const,
                content: `[我撤回了消息: "${msg.recalledContent}"]`
              }
            }
          }
          
          // 只过滤掉可见的系统消息（如"已接收转账"），但保留隐藏的通话记录
          if (msg.type === 'system' && !msg.isHidden) {
            return null
          }
          
          // 如果是隐藏的系统消息（通话记录），转换为AI可读的格式
          if (msg.type === 'system' && msg.isHidden) {
            return {
              role: 'system' as const,
              content: msg.content
            }
          }
          
          // 如果是红包消息，转换为AI可读的格式
          if (msg.messageType === 'redenvelope' && msg.redEnvelopeId) {
            const redEnvelope = getRedEnvelope(id!, msg.redEnvelopeId)
            if (redEnvelope) {
              // 根据红包的发送者来判断，而不是消息的type
              const isUserSent = redEnvelope.sender === 'user'
              
              // 构建红包信息 - 未领取时不显示金额
              let redEnvelopeInfo = ''
              if (isUserSent) {
                // 用户发给AI的红包
                if (redEnvelope.status === 'pending') {
                  redEnvelopeInfo = `[用户给你发了红包：${redEnvelope.blessing}，状态：待领取（未打开前不知道金额）]`
                } else if (redEnvelope.status === 'claimed') {
                  redEnvelopeInfo = `[用户给你发了红包：${redEnvelope.blessing}，金额：¥${redEnvelope.amount.toFixed(2)}，状态：已领取]`
                } else {
                  redEnvelopeInfo = `[用户给你发了红包：${redEnvelope.blessing}，状态：已过期]`
                }
              } else {
                // AI发给用户的红包
                redEnvelopeInfo = `[你给用户发了红包：${redEnvelope.blessing}，金额：¥${redEnvelope.amount.toFixed(2)}，状态：${redEnvelope.status === 'pending' ? '待领取' : redEnvelope.status === 'claimed' ? '已领取' : '已过期'}]`
              }
              
              console.log('🧧 红包消息传递给AI:', redEnvelopeInfo, '发送者:', redEnvelope.sender)
              return {
                role: isUserSent ? 'user' as const : 'assistant' as const,
                content: redEnvelopeInfo
              }
            }
            // 如果红包数据找不到，跳过这条消息
            return null
          }
          
          // 如果是照片消息，转换为AI可读的格式
          if (msg.messageType === 'photo' && msg.photoDescription) {
            const isUserSent = msg.type === 'sent'
            const photoInfo = isUserSent
              ? `[用户给你发了一张照片，照片内容是：${msg.photoDescription}]`
              : `[你给用户发了一张照片，照片内容是：${msg.photoDescription}]`
            console.log('📸 照片消息传递给AI:', photoInfo)
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: photoInfo
            }
          }
          
          // 如果是语音消息，转换为AI可读的格式
          if (msg.messageType === 'voice' && msg.voiceText) {
            const isUserSent = msg.type === 'sent'
            const voiceInfo = isUserSent
              ? `[语音: ${msg.voiceText}]`
              : `[语音: ${msg.voiceText}]`
            console.log('🎤 语音消息传递给AI:', voiceInfo)
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: voiceInfo
            }
          }
          
          // 如果是位置消息，转换为AI可读的格式
          if (msg.messageType === 'location' && msg.location) {
            const isUserSent = msg.type === 'sent'
            const locationInfo = isUserSent
              ? `[位置: ${msg.location.name} - ${msg.location.address}]`
              : `[位置: ${msg.location.name} - ${msg.location.address}]`
            console.log('📍 位置消息传递给AI:', locationInfo)
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: locationInfo
            }
          }
          
          // 如果是表情包消息，转换为AI可读的格式
          if (msg.messageType === 'emoji' && msg.emojiUrl) {
            const isUserSent = msg.type === 'sent'
            // 包含表情包描述，让AI知道自己发了什么
            // 使用完全不同的格式，避免AI混淆
            const emojiDesc = msg.emojiDescription || '表情包'
            const emojiInfo = isUserSent
              ? `(对方发了一个表情包：${emojiDesc})`
              : `(我发了一个表情包：${emojiDesc})`
            console.log('😀 表情包消息传递给AI:', emojiInfo)
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: emojiInfo
            }
          }
          
          // 如果是转账消息，转换为AI可读的格式
          if (msg.messageType === 'transfer' && msg.transfer) {
            const isUserSent = msg.type === 'sent'
            const transferInfo = isUserSent
              ? `[用户给你发起了转账：¥${msg.transfer.amount.toFixed(2)}，说明：${msg.transfer.message}，状态：${msg.transfer.status === 'pending' ? '待处理' : msg.transfer.status === 'received' ? '已收款' : '已退还'}]`
              : `[你给用户发起了转账：¥${msg.transfer.amount.toFixed(2)}，说明：${msg.transfer.message}，状态：${msg.transfer.status === 'pending' ? '待处理' : msg.transfer.status === 'received' ? '已收款' : '已退还'}]`
            console.log('💸 转账消息传递给AI:', transferInfo, '发送者:', isUserSent ? 'user' : 'ai')
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: transferInfo
            }
          }
          
          // 如果是亲密付消息，转换为AI可读的格式
          if (msg.messageType === 'intimate_pay' && msg.intimatePay) {
            const isUserSent = msg.type === 'sent'
            const intimatePayInfo = isUserSent
              ? `[用户想为你开通亲密付：每月额度 ¥${msg.intimatePay.monthlyLimit.toFixed(2)}，状态：${msg.intimatePay.status === 'pending' ? '待你决定是否接受' : msg.intimatePay.status === 'accepted' ? '你已接受' : '你已拒绝'}]`
              : `[你为用户开通了亲密付：每月额度 ¥${msg.intimatePay.monthlyLimit.toFixed(2)}，状态：${msg.intimatePay.status === 'pending' ? '等待用户接受' : msg.intimatePay.status === 'accepted' ? '用户已接受' : '用户已拒绝'}]`
            console.log('💝 亲密付消息传递给AI:', intimatePayInfo, '发送者:', isUserSent ? 'user' : 'ai')
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: intimatePayInfo
            }
          }
          
          // 普通文字消息
          if (msg.content) {
            // 如果有引用消息，添加引用信息（使用简洁格式）
            let messageContent = msg.content
            if (msg.quotedMessage) {
              // 使用简单的格式，避免AI模仿
              const quotedPrefix = `「${msg.quotedMessage.senderName}: ${msg.quotedMessage.content}」\n`
              messageContent = quotedPrefix + msg.content
            }
            
            return {
              role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
              content: messageContent
            }
          }
          
          // 其他情况跳过
          return null
        }).filter(msg => msg !== null)
      ]
      
      // 规则提醒已移除，让AI自然回复
      
      console.log('📤 发送给AI的消息总数:', apiMessages.length)
      console.log('📤 发送给AI的完整消息列表:')
      apiMessages.forEach((msg, idx) => {
        if (msg.role === 'system') {
          console.log(`  ${idx}. [系统提示词] (${msg.content.length} 字符)`)
        } else {
          console.log(`  ${idx}. [${msg.role}] ${msg.content.substring(0, 50)}...`)
        }
      })

      // 调用AI
      const aiResponse = await callAI(apiMessages)
      
      console.log('📨 AI原始回复:', aiResponse)
      
      // 如果是记账助手，提取账单信息
      if (id === 'accounting_assistant') {
        const billInfo = extractBillFromAIResponse(aiResponse)
        if (billInfo) {
          addTransaction({
            type: billInfo.type,
            category: billInfo.category,
            amount: billInfo.amount,
            description: billInfo.description,
            date: new Date().toISOString().split('T')[0],
            aiExtracted: true,
          })
          console.log('💰 AI识别并记录账单:', billInfo)
        }
      }
      
      // 使用新的表情包解析工具
      const { parseAIEmojiResponse } = await import('../utils/emojiParser')
      const parsedEmoji = parseAIEmojiResponse(aiResponse, availableEmojis)
      const aiEmojiIndexes = parsedEmoji.emojiIndexes
      
      // 检查AI是否对红包做出决定
      let redEnvelopeAction: 'claim' | null = null
      
      // 检查AI是否要发红包
      const redEnvelopeMatch = aiResponse.match(/\[红包:(\d+\.?\d*):(.+?)\]/)
      let aiRedEnvelopeData: { amount: number; blessing: string } | null = null
      
      if (redEnvelopeMatch) {
        let amount = parseFloat(redEnvelopeMatch[1])
        // 限制红包金额最多200元
        if (amount > 200) {
          console.warn('⚠️ AI发红包金额超过200元，已限制为200元')
          amount = 200
        }
        aiRedEnvelopeData = {
          amount: amount,
          blessing: redEnvelopeMatch[2]
        }
        console.log('🧧 AI发红包:', aiRedEnvelopeData)
      }
      
      // 使用解析后的文字内容（已经清理了所有表情包标记）
      let cleanedResponse = parsedEmoji.textContent
      
      // 清理账单标记（必须在提取账单信息之后）
      cleanedResponse = cleanedResponse.replace(/\[BILL:(expense|income)\|\d+\.?\d*\|\w+\|[^\]]+\]/g, '').trim()
      
      // 清理红包标记（必须在使用parsedEmoji.textContent之后）
      cleanedResponse = cleanedResponse.replace(/\[红包:\d+\.?\d*:.+?\]/g, '').trim()
      
      // 清理AI错误的引用格式
      cleanedResponse = cleanedResponse.replace(/\[引用了\s+.+?\s+的消息:\s*".+?"\]/g, '').trim()
      // 清理AI模仿的书名号引用格式（只清理单独成行的，不清理嵌入在文字中的）
      // 注意：不要清理用户真实引用的消息，只清理AI错误模仿的格式
      cleanedResponse = cleanedResponse.replace(/^「.+?:\s*.+?」\n?/gm, '').trim()
      
      // 清理可能产生的多余空行
      cleanedResponse = cleanedResponse.replace(/\n\s*\n/g, '\n').trim()
      
      // 检查AI是否要发送照片
      const photoMatch = aiResponse.match(/\[照片:(.+?)\]/)
      let aiPhotoDescription: string | null = null
      
      if (photoMatch) {
        aiPhotoDescription = photoMatch[1]
        cleanedResponse = cleanedResponse.replace(/\[照片:.+?\]/g, '').trim()
        console.log('📸 AI发送照片，描述:', aiPhotoDescription)
      }
      
      // 检查AI是否要发送语音消息
      const voiceMatch = aiResponse.match(/\[语音:(.+?)\]/)
      let aiVoiceText: string | null = null
      
      if (voiceMatch) {
        aiVoiceText = voiceMatch[1]
        cleanedResponse = cleanedResponse.replace(/\[语音:.+?\]/g, '').trim()
        console.log('🎤 AI发送语音，内容:', aiVoiceText)
      }
      
      // 检查AI是否要发送位置
      const locationMatch = aiResponse.match(/\[位置:(.+?):(.+?)\]/)
      let aiLocationData: { name: string; address: string } | null = null
      
      if (locationMatch) {
        aiLocationData = {
          name: locationMatch[1],
          address: locationMatch[2]
        }
        cleanedResponse = cleanedResponse.replace(/\[位置:.+?:.+?\]/g, '').trim()
        console.log('📍 AI发送位置:', aiLocationData)
      }
      
      if (aiResponse.includes('[领取红包]')) {
        redEnvelopeAction = 'claim'
        cleanedResponse = cleanedResponse.replace(/\[领取红包\]/g, '').trim()
        console.log('🎁 AI决定：领取红包')
      }
      
      // 📊 解析状态栏信息
      const statusMatch = aiResponse.match(/\[状态:([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/)
      
      if (statusMatch && id) {
        const statusData = {
          outfit: statusMatch[1].trim(),
          action: statusMatch[2].trim(),
          mood: statusMatch[3].trim(),
          thought: statusMatch[4].trim(),
          location: statusMatch[5].trim(),
          weather: statusMatch[6].trim(),
          affection: 75,
          timestamp: Date.now(),
          characterId: id
        }
        
        localStorage.setItem(`character_status_${id}`, JSON.stringify(statusData))
        console.log('✅ 状态已保存:', statusData)
      }
      
      // 清除状态标记（如果AI还是发送了）
      cleanedResponse = cleanedResponse.replace(/\[状态:[^\]]+\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[状态:[\s\S]*?\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[.*?状态.*?\]/g, '').trim()
      
      console.log('🧹 清理后的回复内容:', cleanedResponse)
      console.log('📏 清理后的回复长度:', cleanedResponse.length)
      
      // 检查AI是否对转账做出决定
      let transferAction: 'accept' | 'reject' | null = null
      
      // 检查AI是否要发起转账 - 支持多种格式
      let transferMatch = aiResponse.match(/\[转账:(\d+\.?\d*):(.+?)\]/)
      let aiTransferData: { amount: number; message: string } | null = null
      
      if (transferMatch) {
        aiTransferData = {
          amount: parseFloat(transferMatch[1]),
          message: transferMatch[2]
        }
        cleanedResponse = cleanedResponse.replace(/\[转账:\d+\.?\d*:.+?\]/g, '').trim()
        console.log('💰 AI发起转账 (标准格式):', aiTransferData)
      } else {
        // 尝试匹配其他格式：[给你转账¥500, 备注: xxx] 或类似格式
        const altMatch = aiResponse.match(/\[.*?转账.*?[¥￥]?\s*(\d+\.?\d*).*?[:：]\s*(.+?)\]/)
        if (altMatch) {
          aiTransferData = {
            amount: parseFloat(altMatch[1]),
            message: altMatch[2].trim()
          }
          cleanedResponse = cleanedResponse.replace(/\[.*?转账.*?\]/g, '').trim()
          console.log('💰 AI发起转账 (备用格式):', aiTransferData)
        }
      }
      
      if (aiResponse.includes('[接收转账]')) {
        transferAction = 'accept'
        cleanedResponse = cleanedResponse.replace(/\[接收转账\]/g, '').trim()
        console.log('✅ AI决定：接收转账')
      } else if (aiResponse.includes('[退还转账]')) {
        transferAction = 'reject'
        cleanedResponse = cleanedResponse.replace(/\[退还转账\]/g, '').trim()
        console.log('↩️  AI决定：退还转账')
      } else if (!aiTransferData && !aiRedEnvelopeData) {
        console.log('⏸️  AI未对转账/红包做出决定')
      }
      
      // 检查AI是否要开通亲密付
      const intimatePayMatch = aiResponse.match(/\[亲密付:(\d+\.?\d*)\]/)
      let aiIntimatePayLimit: number | null = null
      
      if (intimatePayMatch) {
        aiIntimatePayLimit = parseFloat(intimatePayMatch[1])
        cleanedResponse = cleanedResponse.replace(/\[亲密付:\d+\.?\d*\]/g, '').trim()
        console.log('💝 AI开通亲密付，月额度:', aiIntimatePayLimit)
      }
      
      // 检查AI是否要引用消息（支持冒号后有空格）
      const quoteMatch = aiResponse.match(/\[引用:\s*(\d+)\]/)
      let aiQuotedMessageId: number | null = null
      
      if (quoteMatch) {
        aiQuotedMessageId = parseInt(quoteMatch[1])
        cleanedResponse = cleanedResponse.replace(/\[引用:\s*\d+\]/g, '').trim()
        console.log('💬 AI引用了消息ID:', aiQuotedMessageId)
      }
      
      // 检查AI是否要撤回消息
      let shouldRecallLastMessage = false
      if (aiResponse.includes('[撤回消息]')) {
        shouldRecallLastMessage = true
        cleanedResponse = cleanedResponse.replace(/\[撤回消息\]/g, '').trim()
        console.log('🔄 AI要撤回上一条消息')
      }
      
      // 检查AI是否对亲密付做出决定
      let intimatePayAction: 'accept' | 'reject' | null = null
      
      if (aiResponse.includes('[接受亲密付]')) {
        intimatePayAction = 'accept'
        cleanedResponse = cleanedResponse.replace(/\[接受亲密付\]/g, '').trim()
        console.log('💝 AI决定：接受亲密付')
      } else if (aiResponse.includes('[拒绝亲密付]')) {
        intimatePayAction = 'reject'
        cleanedResponse = cleanedResponse.replace(/\[拒绝亲密付\]/g, '').trim()
        console.log('💔 AI决定：拒绝亲密付')
      }
      
      // 如果有转账操作，更新最新的待处理转账状态并添加系统提示
      if (transferAction) {
        // 从后往前找最新的待处理转账
        for (let i = currentMessages.length - 1; i >= 0; i--) {
          const msg = currentMessages[i]
          if (msg.messageType === 'transfer' && 
              msg.type === 'sent' && 
              msg.transfer?.status === 'pending') {
            const updatedMessages = [...currentMessages]
            updatedMessages[i] = {
              ...updatedMessages[i],
              transfer: {
                ...updatedMessages[i].transfer!,
                status: transferAction === 'accept' ? 'received' : 'expired'
              }
            }
            
            // 添加系统提示消息
            const systemMessage: Message = {
              id: Date.now(),
              type: 'system',
              content: transferAction === 'accept' 
                ? `${character?.name || '对方'}已收款` 
                : `${character?.name || '对方'}退还了转账`,
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              messageType: 'system'
            }
            updatedMessages.push(systemMessage)
            
            setMessages(updatedMessages)
            currentMessages = updatedMessages
            break
          }
        }
      }
      
      // 如果AI对亲密付做出决定，更新最新的待处理亲密付状态
      if (intimatePayAction && id && character) {
        // 从后往前找最新的待处理亲密付
        for (let i = currentMessages.length - 1; i >= 0; i--) {
          const msg = currentMessages[i]
          if (msg.messageType === 'intimate_pay' && 
              msg.type === 'sent' && 
              msg.intimatePay?.status === 'pending') {
            const updatedMessages = [...currentMessages]
            updatedMessages[i] = {
              ...updatedMessages[i],
              intimatePay: {
                ...updatedMessages[i].intimatePay!,
                status: intimatePayAction === 'accept' ? 'accepted' : 'rejected'
              }
            }
            
            // 如果AI接受，创建亲密付关系
            if (intimatePayAction === 'accept') {
              const { createIntimatePayRelation } = await import('../utils/walletUtils')
              createIntimatePayRelation(
                character.id,
                character.name,
                msg.intimatePay!.monthlyLimit,
                character.avatar
              )
            }
            
            // 添加系统提示消息
            const systemMessage: Message = {
              id: Date.now(),
              type: 'system',
              content: intimatePayAction === 'accept' 
                ? `${character?.name || '对方'}接受了你的亲密付` 
                : `${character?.name || '对方'}拒绝了你的亲密付`,
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              messageType: 'system'
            }
            updatedMessages.push(systemMessage)
            
            setMessages(updatedMessages)
            currentMessages = updatedMessages
            break
          }
        }
      }
      
      // 如果AI要领取红包，更新最新的待领取红包状态
      if (redEnvelopeAction === 'claim' && id) {
        // 从后往前找最新的待领取红包
        for (let i = currentMessages.length - 1; i >= 0; i--) {
          const msg = currentMessages[i]
          if (msg.messageType === 'redenvelope' && 
              msg.type === 'sent' && 
              msg.redEnvelopeId) {
            const redEnvelope = getRedEnvelope(id, msg.redEnvelopeId)
            if (redEnvelope && redEnvelope.status === 'pending') {
              // 更新红包状态
              updateRedEnvelope(id, msg.redEnvelopeId, {
                status: 'claimed',
                claimedBy: character?.name || 'AI',
                claimedAt: Date.now()
              })
              
              // 添加系统提示消息
              const systemMessage: Message = {
                id: Date.now(),
                type: 'system',
                content: `${character?.name || '对方'}领取了你的红包`,
                time: new Date().toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                messageType: 'system'
              }
              
              const updatedMessages = [...currentMessages, systemMessage]
              setMessages(updatedMessages)
              currentMessages = updatedMessages
              break
            }
          }
        }
      }

      // 处理AI回复 - 支持多条消息（按换行分割）
      let newMessages = [...currentMessages]
      
      // 如果有文字回复
      if (cleanedResponse.trim()) {
        const responseLines = cleanedResponse.trim().split('\n').filter(line => line.trim())
        
        // 如果回复只有一行，直接添加
        if (responseLines.length === 1) {
          // 提取旁白内容
          const narrations: { type: 'action' | 'thought'; content: string }[] = []
          let textContent = responseLines[0]
          
          if (enableNarration) {
            // 提取旁白 [旁白]内容[/旁白]
            const narrationMatches = textContent.match(/\[旁白\]([^\[]+?)\[\/旁白\]/g)
            if (narrationMatches) {
              narrationMatches.forEach(match => {
                const content = match.replace(/\[旁白\]|\[\/旁白\]/g, '').trim()
                if (content) {
                  narrations.push({
                    type: 'action',
                    content: content
                  })
                }
              })
              textContent = textContent.replace(/\[旁白\][^\[]+?\[\/旁白\]/g, '').trim()
            }
          }
          
          const now = Date.now()
          
          // 查找引用的消息
          let quotedMsg = null
          if (aiQuotedMessageId) {
            quotedMsg = currentMessages.find(m => m.id === aiQuotedMessageId)
          }
          
          const aiMessage: Message = {
            id: newMessages.length + 1,
            type: 'received',
            content: textContent,
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: now,
            narrations: narrations.length > 0 ? narrations : undefined,
            quotedMessage: quotedMsg ? {
              id: quotedMsg.id,
              content: quotedMsg.isRecalled && quotedMsg.recalledContent 
                ? quotedMsg.recalledContent 
                : (quotedMsg.content || quotedMsg.emojiDescription || quotedMsg.photoDescription || quotedMsg.voiceText || '特殊消息'),
              senderName: quotedMsg.type === 'sent' ? '我' : 
                          quotedMsg.type === 'received' ? (character?.name || 'AI') : 
                          (quotedMsg.content?.includes('你撤回了') ? '我' : (character?.name || 'AI')),
              type: (quotedMsg.type === 'system' ? 'sent' : quotedMsg.type) as 'sent' | 'received'
            } : undefined,
            blocked: isAiBlocked // 标记拉黑状态
          }
          
          // 🔍 调试：检查AI消息的blocked字段
          console.log('📝 创建AI消息:', {
            messageId: aiMessage.id,
            isAiBlocked: isAiBlocked,
            blocked: aiMessage.blocked,
            content: aiMessage.content?.substring(0, 20)
          })
          
          newMessages.push(aiMessage)
          setMessages(newMessages)
        } else {
          // 多行回复，分多条消息逐个显示，模拟真人打字
          for (let i = 0; i < responseLines.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500)) // 随机延迟
            
            // 提取旁白内容
            const narrations: { type: 'action' | 'thought'; content: string }[] = []
            let textContent = responseLines[i]
            
            if (enableNarration) {
              // 提取旁白 [旁白]内容[/旁白]
              const narrationMatches = textContent.match(/\[旁白\]([^\[]+?)\[\/旁白\]/g)
              if (narrationMatches) {
                narrationMatches.forEach(match => {
                  const content = match.replace(/\[旁白\]|\[\/旁白\]/g, '').trim()
                  if (content) {
                    narrations.push({
                      type: 'action',
                      content: content
                    })
                  }
                })
                textContent = textContent.replace(/\[旁白\][^\[]+?\[\/旁白\]/g, '').trim()
              }
            }
            
            // 查找引用的消息（只在第一条消息添加引用）
            let quotedMsg = null
            if (i === 0 && aiQuotedMessageId) {
              quotedMsg = currentMessages.find(m => m.id === aiQuotedMessageId)
            }
            
            const aiMessage: Message = {
              id: newMessages.length + 1,
              type: 'received',
              content: textContent,
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              narrations: narrations.length > 0 ? narrations : undefined,
              quotedMessage: quotedMsg ? {
                id: quotedMsg.id,
                content: quotedMsg.isRecalled && quotedMsg.recalledContent 
                  ? quotedMsg.recalledContent 
                  : (quotedMsg.content || quotedMsg.emojiDescription || quotedMsg.photoDescription || quotedMsg.voiceText || '特殊消息'),
                senderName: quotedMsg.type === 'sent' ? '我' : 
                            quotedMsg.type === 'received' ? (character?.name || 'AI') : 
                            (quotedMsg.content?.includes('你撤回了') ? '我' : (character?.name || 'AI')),
                type: (quotedMsg.type === 'system' ? 'sent' : quotedMsg.type) as 'sent' | 'received'
              } : undefined,
              blocked: isAiBlocked // 标记拉黑状态
            }
            newMessages = [...newMessages, aiMessage]
            setMessages(newMessages)
          }
        }
      }
      
      // 如果AI发了表情包，添加表情包消息
      if (aiEmojiIndexes.length > 0) {
        for (const index of aiEmojiIndexes) {
          const emoji = availableEmojis[index]
          if (emoji) {
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
            
            const emojiMessage: Message = {
              id: newMessages.length + 1,
              type: 'received',
              content: '',
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: Date.now(),
              messageType: 'emoji',
              emojiUrl: emoji.url,
              emojiDescription: emoji.description,
              blocked: isAiBlocked
            }
            
            newMessages = [...newMessages, emojiMessage]
            setMessages(newMessages)
            console.log('😀 AI发送了表情包:', emoji.description)
          }
        }
      }
      
      // 如果AI发了语音消息，添加语音消息
      if (aiVoiceText) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
        
        const voiceMessage: Message = {
          id: newMessages.length + 1,
          type: 'received',
          content: '',
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'voice',
          voiceText: aiVoiceText,
          blocked: isAiBlocked
        }
        
        newMessages = [...newMessages, voiceMessage]
        setMessages(newMessages)
        console.log('🎤 AI发送了语音消息:', aiVoiceText)
      }
      
      // 如果AI发了位置，添加位置消息
      if (aiLocationData) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
        
        const locationMessage: Message = {
          id: newMessages.length + 1,
          type: 'received',
          content: '',
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'location',
          location: {
            name: aiLocationData.name,
            address: aiLocationData.address,
            latitude: 39.9042 + Math.random() * 0.1,
            longitude: 116.4074 + Math.random() * 0.1
          },
          blocked: isAiBlocked
        }
        
        newMessages = [...newMessages, locationMessage]
        setMessages(newMessages)
        console.log('📍 AI发送了位置:', aiLocationData)
      }
      
      // 如果AI发了照片，添加照片消息
      if (aiPhotoDescription) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
        
        const photoMessage: Message = {
          id: newMessages.length + 1,
          type: 'received',
          content: '',
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'photo',
          photoDescription: aiPhotoDescription,
          blocked: isAiBlocked
        }
        
        newMessages = [...newMessages, photoMessage]
        setMessages(newMessages)
        console.log('📸 AI发送了照片，描述:', aiPhotoDescription)
      }
      
      // 如果AI发了红包
      if (aiRedEnvelopeData && id) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 稍微延迟一下
        
        // 创建红包数据
        const redEnvelope: RedEnvelope = {
          id: generateRedEnvelopeId(),
          amount: aiRedEnvelopeData.amount,
          blessing: aiRedEnvelopeData.blessing,
          status: 'pending',
          sender: 'ai',
          createdAt: Date.now(),
          claimedBy: null,
          claimedAt: null
        }
        
        // 保存红包
        saveRedEnvelope(id, redEnvelope)
        
        const now = Date.now()
        const aiRedEnvelopeMessage: Message = {
          id: now,
          type: 'received',
          content: `[红包]${aiRedEnvelopeData.blessing}`,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: now,
          messageType: 'redenvelope',
          redEnvelopeId: redEnvelope.id,
          blocked: isAiBlocked
        }
        newMessages = [...newMessages, aiRedEnvelopeMessage]
        setMessages(newMessages)
        console.log('🧧 AI红包卡片已添加')
      }
      
      // 如果AI发起了转账
      if (aiTransferData) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 稍微延迟一下
        
        const now = Date.now()
        const aiTransferMessage: Message = {
          id: now,
          type: 'received',
          content: '',
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: now,
          messageType: 'transfer',
          transfer: {
            amount: aiTransferData.amount,
            message: aiTransferData.message,
            status: 'pending'
          },
          blocked: isAiBlocked
        }
        newMessages = [...newMessages, aiTransferMessage]
        setMessages(newMessages)
        console.log('💸 AI转账卡片已添加')
      }
      
      // 如果AI要开通亲密付
      if (aiIntimatePayLimit && id && character) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 稍微延迟一下
        
        const now = Date.now()
        const aiIntimatePayMessage: Message = {
          id: now,
          type: 'received',
          content: '',
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: now,
          messageType: 'intimate_pay',
          intimatePay: {
            monthlyLimit: aiIntimatePayLimit,
            characterId: character.id,
            characterName: character.name,
            status: 'pending'
          },
          blocked: isAiBlocked
        }
        newMessages = [...newMessages, aiIntimatePayMessage]
        setMessages(newMessages)
        console.log('💝 AI亲密付卡片已添加')
      }
      
      // 💭 提取记忆和生成总结（根据用户设置的间隔提取）
      try {
        // 获取用户设置的总结间隔（默认 30 轮）
        const summaryInterval = parseInt(localStorage.getItem(`memory_summary_interval_${id}`) || '30')
        
        // 计算对话轮数（用户消息 + AI 回复 = 1 轮）
        const conversationRounds = Math.floor(newMessages.filter(m => m.type === 'sent' || m.type === 'received').length / 2)
        
        // 每 N 轮对话提取一次记忆并生成总结
        if (conversationRounds % summaryInterval === 0 && conversationRounds > 0) {
          console.log(`💭 开始提取记忆和生成总结...（第 ${conversationRounds} 轮对话）`)
          
          // 获取最近 N 轮对话的内容
          const recentUserMessages = currentMessages.filter(m => m.type === 'sent').slice(-summaryInterval)
          const recentAiMessages = newMessages.filter(m => m.type === 'received').slice(-summaryInterval)
          
          if (recentUserMessages.length > 0 && recentAiMessages.length > 0) {
            // 合并最近的对话内容
            const userContent = recentUserMessages.map(m => 
              m.content || m.emojiDescription || m.photoDescription || m.voiceText || ''
            ).join('\n')
            
            const aiContent = recentAiMessages.map(m => 
              m.content || m.emojiDescription || m.photoDescription || m.voiceText || ''
            ).join('\n')
            
            const result = await memorySystem.extractMemories(userContent, aiContent)
            console.log(`💭 记忆提取完成（已分析最近 ${summaryInterval} 轮对话）`)
            console.log('📝 记忆总结已生成')
            
            // 保存总结到 localStorage（累积，不覆盖）
            if (result.summary && id) {
              try {
                // 获取旧的总结
                const oldSummary = localStorage.getItem(`memory_summary_${id}`) || ''
                
                // 添加分隔符和新总结
                const separator = oldSummary ? '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' : ''
                const newSummary = oldSummary + separator + `【第 ${Math.ceil(conversationRounds / summaryInterval)} 次总结 - 第 ${conversationRounds - summaryInterval + 1}-${conversationRounds} 轮对话】\n\n${result.summary}`
                
                localStorage.setItem(`memory_summary_${id}`, newSummary)
                console.log('💾 记忆总结已累积保存')
                console.log(`📊 总结历史长度: ${newSummary.length} 字符`)
              } catch (error) {
                console.error('❌ 保存记忆总结失败:', error)
              }
            }
          }
        } else {
          console.log(`💭 跳过记忆提取（等待第 ${Math.ceil(conversationRounds / summaryInterval) * summaryInterval} 轮对话）`)
        }
      } catch (error) {
        console.error('❌ 记忆提取失败:', error)
      }
      
      // 如果AI要撤回上一条消息
      if (shouldRecallLastMessage) {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 找到AI最后发送的消息（不包括系统消息）
        const lastAiMessageIndex = newMessages.map((msg, idx) => ({ msg, idx }))
          .reverse()
          .find(({ msg }) => msg.type === 'received' && msg.messageType !== 'system')
        
        if (lastAiMessageIndex) {
          const { msg, idx } = lastAiMessageIndex
          
          // 检查是否是特殊消息（红包、转账、亲密付不能撤回）
          const canRecall = !msg.redEnvelopeId && !msg.transfer && !msg.intimatePay
          
          if (!canRecall) {
            console.log('⚠️ AI尝试撤回特殊消息被阻止:', msg.messageType)
          } else {
            console.log('🔄 AI撤回消息:', msg.content || msg.emojiDescription || '特殊消息')
            
            // 将消息标记为撤回
            newMessages[idx] = {
              ...msg,
              isRecalled: true,
              recalledContent: msg.content || msg.emojiDescription || msg.photoDescription || msg.voiceText || '特殊消息',
              content: `${character?.name || 'AI'}撤回了一条消息`,
              type: 'system' as const,
              messageType: 'system' as const
            }
            
            setMessages([...newMessages])
          }
        }
      }
      
    } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ AI调用失败')
      console.error('错误信息:', error.message)
      console.error('错误详情:', error)
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      // 显示错误消息
      const errorMessage: Message = {
        id: currentMessages.length + 1,
        type: 'received',
        content: `[错误] ${error.message || 'AI调用失败，请在设置中检查API配置'}`,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      setMessages([...currentMessages, errorMessage])
    } finally {
      setIsAiTyping(false)
      console.log('🏁 AI回复流程结束\n')
    }
  }

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* 壁纸背景层 - 铺满整个页面 */}
      <div 
        className="absolute inset-0 z-0"
        style={getBackgroundStyle()}
      />
      
      {/* 内容层 */}
      <div className="relative z-10 h-full flex flex-col">
        {/* iOS状态栏 - 根据设置显示 */}
        {showStatusBar && <StatusBar />}
        {/* 顶部导航栏 - 玻璃毛玻璃效果，能透过看到壁纸 */}
        <div className={`px-4 py-3 flex items-center justify-between border-b border-white/20 ${background ? 'glass-dark' : 'glass-effect'}`}>
        <button
          onClick={() => navigate(-1)}
          className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
        >
          <BackIcon size={24} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-900">
            {isAiTyping ? '正在输入...' : (character?.name || '聊天')}
          </h1>
          {id && (() => {
            const streakData = getStreakData(id)
            return streakData.currentStreak > 0 ? (
              <button
                onClick={() => navigate(`/streak/${id}`)}
                className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-lg font-medium flex items-center gap-1 hover:bg-orange-200 transition-colors"
              >
                🔥 {streakData.currentStreak}
              </button>
            ) : null
          })()}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowStatusModal(true)}
            className="ios-button p-1 hover:opacity-70 transition-all"
            title="查看角色状态"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-700">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button 
            onClick={() => navigate(`/chat-settings/${id}`)}
            className="ios-button text-gray-700 hover:text-gray-900"
          >
            <MoreIcon size={24} />
          </button>
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="text-gray-400 text-base">开始聊天吧</p>
          </div>
        ) : (
           <>
             {messages.map((message, index) => {
               const prevMessage = index > 0 ? messages[index - 1] : null
               const showTimeDivider = shouldShowTimeDivider(message, prevMessage)
               
               // 隐藏的消息不显示，但会被AI看到
               if (message.isHidden) {
                 return null
               }
               
               if (message.type === 'system') {
                 // 通话记录消息
                 if (message.isCallRecord) {
                   const isExpanded = expandedCallId === message.id
                   
                   return (
                     <div key={message.id}>
                       {/* 时间分隔线 */}
                       {showTimeDivider && message.timestamp && (
                         <div className="flex justify-center mb-4">
                           <div className="bg-gray-200/60 px-3 py-1 rounded-full">
                             <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                           </div>
                         </div>
                       )}
                       
                       <div className="flex justify-center mb-3">
                         <div className="w-[85%] max-w-xs">
                           {/* 通话记录卡片 */}
                           <div 
                             className="glass-card rounded-xl p-3 cursor-pointer hover:shadow-lg transition-all"
                             onClick={() => setExpandedCallId(isExpanded ? null : message.id)}
                           >
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <div>
                                   <div className="text-xs font-medium text-gray-700">{message.content}</div>
                                   <div className="text-[10px] text-gray-400 mt-0.5">
                                     {isExpanded ? '点击收起' : '点击查看详情'}
                                   </div>
                                 </div>
                               </div>
                               <div className="text-gray-400 text-xs">
                                 {isExpanded ? '▲' : '▼'}
                               </div>
                             </div>
                             
                             {/* 展开的通话详情 */}
                             {isExpanded && message.callMessages && message.callMessages.length > 0 && (
                               <div className="mt-2 pt-2 border-t border-gray-200/50">
                                 <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                   {message.callMessages.map((callMsg, idx) => {
                                     if (callMsg.type === 'narrator') {
                                       // 旁白
                                       return (
                                         <div key={idx} className="text-center">
                                           <span className="text-[10px] text-gray-400 italic">
                                             {callMsg.content}
                                           </span>
                                         </div>
                                       )
                                     } else {
                                       // 对话消息
                                       const isUser = callMsg.type === 'user'
                                       return (
                                         <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                           <div className={`max-w-[75%] px-2 py-1 rounded-lg text-[11px] ${
                                             isUser 
                                               ? 'bg-green-500 text-white' 
                                               : 'glass-light text-gray-800'
                                           }`}>
                                             {callMsg.content}
                                           </div>
                                         </div>
                                       )
                                     }
                                   })}
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     </div>
                   )
                 }
                 
                 // 普通系统消息
                 return (
                   <div key={message.id}>
                     {/* 时间分隔线 */}
                     {showTimeDivider && message.timestamp && (
                       <div className="flex justify-center mb-4">
                         <div className="bg-gray-200/60 px-3 py-1 rounded-full">
                           <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                         </div>
                       </div>
                     )}
                     <div className="flex justify-center mb-4">
                       <div 
                         className={`bg-gray-200/80 px-3 py-1.5 rounded-md ${message.isRecalled ? 'cursor-pointer hover:bg-gray-300/80 transition-colors' : ''}`}
                         onClick={() => {
                           if (message.isRecalled && message.recalledContent) {
                             setViewingRecalledMessage(message)
                           }
                         }}
                       >
                         <span className="text-xs text-gray-600">{message.content}</span>
                       </div>
                     </div>
                   </div>
                 )
               }
               
               // 如果消息只有旁白没有文字内容，单独居中显示
               if (message.narrations && message.narrations.length > 0 && !message.content && !message.messageType) {
                 return (
                   <div key={message.id}>
                     {/* 时间分隔线 */}
                     {showTimeDivider && message.timestamp && (
                       <div className="flex justify-center mb-4">
                         <div className="bg-gray-200/60 px-3 py-1 rounded-full">
                           <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                         </div>
                       </div>
                     )}
                     <div className="mb-4">
                       {message.narrations.map((narration, idx) => (
                         <div
                           key={idx}
                           className="text-center text-xs text-gray-500 italic mb-2"
                         >
                           {narration.content}
                         </div>
                       ))}
                     </div>
                   </div>
                 )
               }
               
               return (
                 <div key={message.id}>
                   {/* 时间分隔线 */}
                   {showTimeDivider && message.timestamp && (
                     <div className="flex justify-center mb-4">
                       <div className="bg-gray-200/60 px-3 py-1 rounded-full">
                         <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                       </div>
                     </div>
                   )}
                   <div className="mb-4">
                   {/* 旁白内容 - 居中显示在消息上方 */}
                   {message.narrations && message.narrations.length > 0 && (
                     <div className="mb-2">
                       {message.narrations.map((narration, idx) => (
                         <div
                           key={idx}
                           className="text-center text-xs text-gray-500 italic mb-1"
                         >
                           {narration.content}
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {/* 消息主体 */}
                   <div
                     className={`flex ${
                       message.type === 'sent' ? 'justify-end message-sent' : 'justify-start message-received'
                     }`}
                   >
                   {/* 对方消息：头像在左，气泡在右 */}
                   {message.type === 'received' && (
                     <div className="flex flex-col items-center mr-2">
                       <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                         {isCharacterCustomAvatar ? (
                           <img src={characterAvatar} alt="角色头像" className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-2xl">{characterAvatar || '🤖'}</span>
                         )}
                       </div>
                       {message.timestamp && (
                         <span className="text-[10px] text-gray-400 mt-1">{message.time}</span>
                       )}
                     </div>
                   )}
                 
                 {/* 消息气泡 */}
                 <div 
                   className="max-w-[70%]"
                   onTouchStart={(e) => handleLongPressStart(message, e)}
                   onTouchEnd={handleLongPressEnd}
                   onMouseDown={(e) => handleLongPressStart(message, e)}
                   onMouseUp={handleLongPressEnd}
                   onMouseLeave={handleLongPressEnd}
                 >
                   {message.messageType === 'redenvelope' && message.redEnvelopeId ? (
                     (() => {
                       const redEnvelope = getRedEnvelope(id!, message.redEnvelopeId)
                       return redEnvelope ? (
                         <RedEnvelopeCard
                           redEnvelope={redEnvelope}
                           onClick={() => handleOpenRedEnvelope(message.redEnvelopeId!)}
                         />
                       ) : null
                     })()
                   ) : message.messageType === 'photo' && message.photoDescription ? (
                     <FlipPhotoCard 
                       description={message.photoDescription}
                       messageId={message.id}
                     />
                   ) : message.messageType === 'voice' && message.voiceText ? (
                     <div className="flex flex-col gap-2 max-w-[240px]">
                       <div 
                         className={`rounded-2xl p-3 shadow-lg min-w-[160px] transition-all ${
                           message.type === 'sent' 
                             ? 'bg-wechat-primary' 
                             : 'bg-white/80 backdrop-blur-sm border border-gray-100'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                           {/* 播放按钮 */}
                           <button 
                             className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                               message.type === 'sent' ? 'bg-white/20 hover:bg-white/30' : 'bg-green-500 hover:bg-green-600'
                             }`}
                             onClick={(e) => {
                               e.stopPropagation()
                               const duration = Math.min(Math.max(Math.ceil(message.voiceText.length / 5), 1), 60)
                               handlePlayVoice(message.id, duration)
                             }}
                           >
                             {playingVoiceId === message.id ? (
                               <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                               </svg>
                             ) : (
                               <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                 <path d="M8 5v14l11-7z"/>
                               </svg>
                             )}
                           </button>
                           
                           {/* 波形动画 */}
                           <div 
                             className="flex items-center gap-0.5 flex-1 cursor-pointer"
                             onClick={() => setShowVoiceTextMap(prev => ({
                               ...prev,
                               [message.id]: !prev[message.id]
                             }))}
                           >
                             {[40, 60, 80, 60, 40, 70, 50, 90, 60, 40, 80, 50, 70].map((height, i) => (
                               <div 
                                 key={i}
                                 className={`w-0.5 rounded-full transition-all ${
                                   message.type === 'sent' ? 'bg-white/60' : 'bg-gray-400'
                                 } ${
                                   playingVoiceId === message.id ? 'animate-pulse' : ''
                                 }`}
                                 style={{ 
                                   height: playingVoiceId === message.id ? `${Math.random() * 100}%` : `${height}%`,
                                   maxHeight: '16px',
                                   minHeight: '4px',
                                   animationDelay: `${i * 0.1}s`
                                 }}
                               />
                             ))}
                           </div>
                           
                           {/* 时长 */}
                           <div className={`text-xs font-medium ${
                             message.type === 'sent' ? 'text-white' : 'text-gray-600'
                           }`}>
                             {Math.min(Math.max(Math.ceil(message.voiceText.length / 5), 1), 60)}"
                           </div>
                         </div>
                       </div>
                       
                       {/* 转文字显示 */}
                       {showVoiceTextMap[message.id] && (
                         <div className={`px-3 py-2 rounded-xl text-sm text-gray-700 ${
                           message.type === 'sent' 
                             ? '' 
                             : 'bg-gray-100'
                         }`}>
                           <div className="text-xs text-gray-500 mb-1">转文字：</div>
                           {message.voiceText}
                         </div>
                       )}
                     </div>
                   ) : message.messageType === 'location' && message.location ? (
                     <div 
                       className="glass-card rounded-2xl overflow-hidden shadow-lg w-[280px] cursor-pointer hover:shadow-xl transition-shadow"
                       onClick={() => handleViewLocation(message)}
                     >
                       {/* 地图缩略图 */}
                       <div className="h-32 bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
                         {/* 模拟地图网格 */}
                         <div className="absolute inset-0 opacity-20">
                           <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                             {Array.from({ length: 64 }).map((_, i) => (
                               <div key={i} className="border border-gray-300"></div>
                             ))}
                           </div>
                         </div>
                         {/* 定位标记 */}
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                           <svg className="w-8 h-8 text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                           </svg>
                         </div>
                       </div>
                       
                       {/* 位置信息 */}
                       <div className="p-3 bg-white/90 backdrop-blur-sm">
                         <div className="flex items-start gap-2">
                           <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                           </svg>
                           <div className="flex-1 min-w-0">
                             <div className="font-medium text-gray-900 text-sm truncate">
                               {message.location.name}
                             </div>
                             <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                               {message.location.address}
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   ) : message.messageType === 'emoji' && message.emojiUrl ? (
                     <div className="rounded-2xl overflow-hidden shadow-lg max-w-[200px]">
                       <img 
                         src={message.emojiUrl} 
                         alt={message.emojiDescription || '表情包'} 
                         className="w-full h-auto"
                       />
                     </div>
                   ) : message.messageType === 'transfer' && message.transfer ? (
                     <div className="glass-card rounded-2xl p-4 shadow-lg min-w-[200px]">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                           ¥
                         </div>
                         <div className="flex-1">
                           <div className="text-sm text-gray-900 font-medium">转账</div>
                           <div className="text-xs text-gray-500 mt-0.5">
                             {message.transfer.message || '转账'}
                           </div>
                         </div>
                       </div>
                       <div className="border-t border-gray-200 pt-3">
                         {message.type === 'received' && message.transfer.status === 'pending' ? (
                           <>
                             <div className="flex items-center justify-between mb-3">
                               <span className="text-2xl font-semibold text-gray-900">
                                 ¥{message.transfer.amount.toFixed(2)}
                               </span>
                             </div>
                             <div className="flex gap-2">
                               <button 
                                 onClick={() => handleRejectTransfer(message.id)}
                                 className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full ios-button"
                               >
                                 退还
                               </button>
                               <button 
                                 onClick={() => handleReceiveTransfer(message.id)}
                                 className="flex-1 px-4 py-2 bg-primary text-white text-sm rounded-full ios-button"
                               >
                                 领取
                               </button>
                             </div>
                           </>
                         ) : (
                           <div className="flex items-center justify-between">
                             <span className="text-2xl font-semibold text-gray-900">
                               ¥{message.transfer.amount.toFixed(2)}
                             </span>
                             {message.transfer.status === 'received' && (
                               <span className="text-xs text-gray-400">
                                 {message.type === 'sent' ? '已收款' : '你已收款'}
                               </span>
                             )}
                             {message.transfer.status === 'expired' && (
                               <span className="text-xs text-gray-400">
                                 {message.type === 'sent' ? '已退还' : '你已退还'}
                               </span>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   ) : message.messageType === 'intimate_pay' && message.intimatePay ? (
                     <div className="glass-card rounded-2xl p-4 shadow-lg min-w-[200px]">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                           <img src={intimatePayIcon} alt="亲密付" className="w-full h-full object-cover" />
                         </div>
                         <div className="flex-1">
                           <div className="text-sm text-gray-900 font-medium">亲密付</div>
                           <div className="text-xs text-gray-500 mt-0.5">
                             为你开通亲密付
                           </div>
                         </div>
                       </div>
                       <div className="border-t border-gray-200 pt-3">
                         {message.intimatePay.status === 'pending' ? (
                           <>
                             <div className="mb-3">
                               <div className="text-xs text-gray-500 mb-1">每月额度</div>
                               <div className="text-2xl font-semibold text-gray-900">
                                 ¥{message.intimatePay.monthlyLimit.toFixed(2)}
                               </div>
                             </div>
                             {message.type === 'received' ? (
                               <>
                                 <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                                   接受后，你每月可使用对方的零钱进行消费，最高额度 ¥{message.intimatePay.monthlyLimit.toFixed(2)}
                                 </div>
                                 <button 
                                   onClick={() => navigate(`/intimate-pay/receive/${message.intimatePay!.characterId}/${message.intimatePay!.monthlyLimit}`, { replace: true })}
                                   className="w-full px-4 py-2 bg-gradient-to-r from-pink-400 to-red-400 text-white text-sm rounded-full ios-button"
                                 >
                                   接受亲密付
                                 </button>
                               </>
                             ) : (
                               <div className="text-xs text-gray-500 text-center">
                                 等待对方接受
                               </div>
                             )}
                           </>
                         ) : (
                           <div className="text-center">
                             <div className="text-2xl font-semibold text-gray-900 mb-1">
                               ¥{message.intimatePay.monthlyLimit.toFixed(2)}
                             </div>
                             <span className="text-xs text-gray-400">
                               {message.intimatePay.status === 'accepted' 
                                 ? (message.type === 'sent' ? '对方已接受' : '你已接受')
                                 : (message.type === 'sent' ? '对方已拒绝' : '你已拒绝')}
                             </span>
                           </div>
                         )}
                       </div>
                     </div>
                   ) : (
                     <div>
                       {/* 文字内容 */}
                       {message.content && (
                         <div
                           className={`rounded-2xl break-words shadow-lg overflow-hidden ${
                             message.type === 'sent'
                               ? 'text-gray-900 rounded-tr-sm'
                               : message.content.startsWith('[错误]')
                               ? 'bg-red-100 text-red-700 rounded-tl-sm'
                               : 'text-gray-900 rounded-tl-sm'
                           }`}
                           style={
                             message.type === 'sent'
                               ? {
                                   backgroundColor: userBubbleColor,
                                   ...Object.fromEntries(
                                     userBubbleCSS.split(';').filter(s => s.trim()).map(s => {
                                       const [key, value] = s.split(':').map(s => s.trim())
                                       return [key.replace(/-([a-z])/g, (g) => g[1].toUpperCase()), value]
                                     })
                                   )
                                 }
                               : message.content.startsWith('[错误]')
                               ? {}
                               : {
                                   backgroundColor: aiBubbleColor,
                                   ...Object.fromEntries(
                                     aiBubbleCSS.split(';').filter(s => s.trim()).map(s => {
                                       const [key, value] = s.split(':').map(s => s.trim())
                                       return [key.replace(/-([a-z])/g, (g) => g[1].toUpperCase()), value]
                                     })
                                   )
                                 }
                           }
                         >
                           <div className="px-4 py-3">
                             {/* 引用的消息 */}
                             {message.quotedMessage && (
                               <div 
                                 className="mb-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors"
                                 style={{
                                   background: 'rgba(0, 0, 0, 0.05)',
                                   fontSize: '12px',
                                   color: '#666'
                                 }}
                               >
                                 <div 
                                   className="font-semibold mb-0.5"
                                   style={{ color: '#1677ff' }}
                                 >
                                   {message.quotedMessage.senderName}
                                 </div>
                                 <div 
                                   className="overflow-hidden text-ellipsis whitespace-nowrap"
                                 >
                                   {message.quotedMessage.content}
                                 </div>
                               </div>
                             )}
                             
                             {/* 消息内容 */}
                             {message.content}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
                 
                   {/* 自己消息：气泡在左，头像在右 */}
                  {message.type === 'sent' && (
                    <div className="flex flex-col items-center ml-2">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                        {isUserCustomAvatar ? (
                          <img src={userAvatar} alt="我的头像" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>
                      {message.timestamp && (
                        <span className="text-[10px] text-gray-400 mt-1">{message.time}</span>
                      )}
                    </div>
                  )}
                </div>
                </div>
               </div>
             )
             })}
             
             {/* AI正在输入 */}
             {isAiTyping && (
               <div className="flex mb-4 justify-start">
                 <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 mr-2 shadow-lg overflow-hidden">
                   {isCharacterCustomAvatar ? (
                     <img src={characterAvatar} alt="角色头像" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-2xl">{characterAvatar || '🤖'}</span>
                   )}
                 </div>
                 <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm shadow-lg">
                   <div className="flex gap-1">
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                 </div>
               </div>
             )}
             <div ref={messagesEndRef} />
           </>
          )}
        </div>

      {/* 底部输入栏 - 玻璃效果 */}
      <div className={`border-t border-gray-200/50 ${background ? 'glass-dark' : 'glass-effect'}`}>
        {/* 引用消息显示区域 */}
        {quotedMessage && (
          <div className="px-3 pt-2 pb-1">
            <div className="bg-gray-100 rounded-xl p-2 flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-700 mb-0.5">
                  {quotedMessage.type === 'sent' ? '我' : (character?.name || 'AI')}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {quotedMessage.content || quotedMessage.emojiDescription || quotedMessage.photoDescription || quotedMessage.voiceText || '特殊消息'}
                </div>
              </div>
              <button
                onClick={() => setQuotedMessage(null)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 ios-button"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        <div className="px-3 py-3 flex items-center gap-2">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700"
          >
            <AddCircleIcon size={26} />
          </button>
          <div className="flex-1 flex items-center bg-white/90 rounded-full px-4 py-2 shadow-inner">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="发送消息"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400"
            />
          </div>
          <button 
            onClick={() => setShowEmojiPanel(true)}
            className="w-10 h-10 flex items-center justify-center ios-button text-gray-700"
          >
            <EmojiIcon size={22} />
          </button>
          {inputValue.trim() ? (
            <button
              onClick={handleSend}
              className="w-10 h-10 flex items-center justify-center ios-button bg-wechat-green text-white rounded-full shadow-lg"
            >
              <SendIcon size={18} />
            </button>
          ) : (
            <button 
              onClick={handleAIReply}
              className="w-10 h-10 flex items-center justify-center ios-button text-gray-700"
            >
              <SendIcon size={22} />
            </button>
          )}
        </div>
        {!showMenu && (
          <div className="flex justify-center pb-2">
            <div className="w-32 h-1 bg-gray-900 rounded-full opacity-40"></div>
          </div>
        )}
      </div>

      {/* 聊天菜单 */}
      {showMenu && (
        <ChatMenu
          onClose={() => setShowMenu(false)}
          onSelectImage={handleSelectImage}
          onSelectCamera={handleSelectCamera}
          onSelectRedPacket={() => {
            setShowMenu(false)
            setShowRedEnvelopeSender(true)
          }}
          onSelectTransfer={() => {
            setShowMenu(false)
            setShowTransferSender(true)
          }}
          onSelectIntimatePay={() => {
            setShowMenu(false)
            setShowIntimatePaySender(true)
          }}
          onSelectLocation={handleSelectLocation}
          onSelectVoiceMessage={handleSelectVoice}
          onSelectVoiceCall={() => {
            setShowMenu(false)
            setIsVideoCall(false)
            setCallStartTime(Date.now())
            setShowCallScreen(true)
          }}
          onSelectVideoCall={() => {
            setShowMenu(false)
            setIsVideoCall(true)
            setCallStartTime(Date.now())
            setShowCallScreen(true)
          }}
        />
      )}

      {/* 红包发送弹窗 */}
      <RedEnvelopeSender
        show={showRedEnvelopeSender}
        onClose={() => setShowRedEnvelopeSender(false)}
        onSend={handleSendRedEnvelope}
        characterId={id}
        characterName={character?.name}
      />

      {/* 红包详情弹窗 */}
      <RedEnvelopeDetail
        show={showRedEnvelopeDetail}
        redEnvelope={selectedRedEnvelope}
        canClaim={canClaimRedEnvelope}
        onClose={() => setShowRedEnvelopeDetail(false)}
        onClaim={handleClaimRedEnvelope}
      />

      {/* 转账发送弹窗 */}
      <TransferSender
        show={showTransferSender}
        onClose={() => setShowTransferSender(false)}
        onSend={handleSendTransfer}
        characterId={id}
        characterName={character?.name}
      />

      {/* 亲密付发送弹窗 */}
      {showIntimatePaySender && (
        <IntimatePaySender
          onSend={handleSendIntimatePay}
          onCancel={() => setShowIntimatePaySender(false)}
        />
      )}

      {/* 表情包面板 */}
      <EmojiPanel
        show={showEmojiPanel}
        onClose={() => setShowEmojiPanel(false)}
        onSelect={handleSelectEmoji}
      />

      {/* 拍摄模态框 */}
      {showCameraModal && (
        <>
          {/* 遮罩层 */}
          <div
            onClick={() => setShowCameraModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            {/* 模态框内容 */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-3xl p-6 w-[90%] max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                拍摄照片
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 text-center">
                输入图片描述，将生成一张白底黑字的图片
              </p>
              
              {/* 输入框 */}
              <textarea
                value={cameraDescription}
                onChange={(e) => setCameraDescription(e.target.value)}
                placeholder="请输入图片描述..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
              
              {/* 字数统计 */}
              <div className="text-right text-sm text-gray-500 mt-2">
                {cameraDescription.length} 字
              </div>
              
              {/* 按钮组 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCameraModal(false)
                    setCameraDescription('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full ios-button font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSendCameraPhoto}
                  disabled={!cameraDescription.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-full ios-button font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送照片
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 语音消息模态框 */}
      {showVoiceModal && (
        <>
          {/* 遮罩层 */}
          <div
            onClick={() => setShowVoiceModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            {/* 模态框内容 */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-3xl p-6 w-[90%] max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                发送语音消息
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 text-center">
                输入语音内容（模拟语音转文字）
              </p>
              
              {/* 输入框 */}
              <textarea
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
                placeholder="请输入语音内容..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoFocus
              />
              
              {/* 字数统计 */}
              <div className="text-right text-sm text-gray-500 mt-2">
                {voiceText.length} 字
              </div>
              
              {/* 按钮组 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowVoiceModal(false)
                    setVoiceText('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full ios-button font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSendVoice}
                  disabled={!voiceText.trim()}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-full ios-button font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送语音
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 发送位置模态框 */}
      {showLocationModal && (
        <>
          <div
            onClick={() => setShowLocationModal(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-3xl p-6 w-[90%] max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                📍 发送位置
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 text-center">
                输入位置名称（地址可选）
              </p>
              
              {/* 地名输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地点名称
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="例如：星巴克(国贸店)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              {/* 地址输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  详细地址
                </label>
                <textarea
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  placeholder="例如：北京市朝阳区建国门外大街1号国贸商城"
                  className="w-full h-24 px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              
              {/* 按钮组 */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowLocationModal(false)
                    setLocationName('')
                    setLocationAddress('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full ios-button font-medium"
                >
                  取消
                </button>
                <button
                  onClick={handleSendLocation}
                  disabled={!locationName.trim()}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-full ios-button font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送位置
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 位置详情查看模态框 */}
      {selectedLocationMsg && (
        <>
          <div
            onClick={() => setSelectedLocationMsg(null)}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[90%] max-w-2xl"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedLocationMsg(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* 大地图 */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                <div className="h-96 bg-gradient-to-br from-blue-100 to-green-100 relative">
                  {/* 模拟地图网格 */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-16 grid-rows-16 h-full w-full">
                      {Array.from({ length: 256 }).map((_, i) => (
                        <div key={i} className="border border-gray-300"></div>
                      ))}
                    </div>
                  </div>
                  {/* 定位标记 */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <svg className="w-16 h-16 text-red-500 drop-shadow-2xl animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </div>
                </div>
                
                {/* 位置详细信息 */}
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {selectedLocationMsg.location?.name}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {selectedLocationMsg.location?.address}
                      </p>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-full ios-button font-medium">
                      导航到这里
                    </button>
                    <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full ios-button font-medium">
                      发送给朋友
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 通话界面 */}
      {character && (
        <CallScreen
          show={showCallScreen}
          character={{
            id: character.id,
            name: character.name,
            avatar: character.avatar,
            profile: character.description,
            relationship: (character as any).relationship || '朋友',
            favorability: (character as any).favorability || 50
          }}
          isVideoCall={isVideoCall}
          onEnd={() => {
            // 保存通话记录到聊天历史
            if (callMessages.length > 0) {
              const callDuration = Math.floor((Date.now() - (callStartTime || Date.now())) / 1000)
              const mins = Math.floor(callDuration / 60)
              const secs = callDuration % 60
              const durationText = `${mins}:${secs.toString().padStart(2, '0')}`
              
              // 创建通话记录消息
              const now = new Date()
              const callRecordMsg: Message = {
                id: Date.now(),
                type: 'system',
                content: `${isVideoCall ? '视频' : '语音'}通话 ${durationText}`,
                time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                isCallRecord: true,
                callDuration: callDuration,
                callMessages: callMessages
              }
              
              setMessages(prev => [...prev, callRecordMsg])
              
              // 将通话内容添加到聊天历史，让AI能记住
              // 构建详细的通话记录，包含旁白和对话
              const callDetails = callMessages.map(msg => {
                if (msg.type === 'narrator') {
                  return `[${msg.content}]`
                } else {
                  return `${msg.type === 'user' ? '用户' : character?.name}: ${msg.content}`
                }
              }).join('\n')
              
              if (callDetails) {
                const summaryMsg: Message = {
                  id: Date.now() + 1,
                  type: 'system',
                  content: `━━━ ${isVideoCall ? '视频' : '语音'}通话记录 ━━━
时间：${now.toLocaleString('zh-CN')}
时长：${durationText}

${callDetails}

━━━ 通话结束 ━━━

⚠️ 重要提醒：
- 这是刚才${isVideoCall ? '视频' : '语音'}通话的完整内容
- 你们刚刚通过${isVideoCall ? '视频' : '语音'}通话聊过这些
- 你必须记住通话中说过的话和提到的事情
- 如果通话中提到你在某个地方，那就是你现在真实的位置
- 如果通话中提到你在做某事，那就是你刚才真实在做的事
- 继续聊天时要保持连贯性，不要忘记通话内容`,
                  time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                  timestamp: Date.now(),
                  isHidden: true // 隐藏显示，但AI能看到
                }
                setMessages(prev => [...prev, summaryMsg])
              }
            }
            
            setShowCallScreen(false)
            setCallMessages([])
            setCallStartTime(null)
          }}
          onSendMessage={handleCallSendMessage}
          onRequestAIReply={handleCallAIReply}
          messages={callMessages}
        />
      )}

      {/* 角色状态弹窗 */}
      <CharacterStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        characterName={character?.name || 'AI'}
        characterId={id || ''}
      />

      {/* 长按消息菜单 */}
      {showMessageMenu && longPressedMessage && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 z-50 bg-black/50"
            style={{
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              setShowMessageMenu(false)
              setLongPressedMessage(null)
            }}
          />
          
          {/* 菜单气泡 - 带箭头的毛玻璃效果 */}
          <div 
            className={`fixed z-50 ${longPressedMessage.type === 'sent' ? 'message-menu-right' : 'message-menu-left'}`}
            style={{
              top: `${Math.min(menuPosition.y + 10, window.innerHeight - 150)}px`,
              left: longPressedMessage.type === 'sent' 
                ? `${Math.min(menuPosition.x - 140, window.innerWidth - 160)}px`
                : `${Math.max(menuPosition.x - 20, 20)}px`,
              minWidth: '140px',
              maxWidth: '160px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              transform: 'scale(1)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'menuFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* 箭头 */}
            <div 
              style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                background: 'rgba(255, 255, 255, 0.95)',
                transform: 'rotate(45deg)',
                top: '-6px',
                [longPressedMessage.type === 'sent' ? 'right' : 'left']: '20px',
                zIndex: -1
              }}
            />
            
            <div style={{ padding: '8px 0' }}>
              {/* 引用 */}
              <button
                onClick={handleQuoteMessage}
                className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 ios-button transition-all"
                style={{ border: 'none', background: 'transparent' }}
              >
                引用
              </button>
              
              {/* 撤回（只对普通消息显示，红包转账等不能撤回） */}
              {!longPressedMessage?.redEnvelopeId && 
               !longPressedMessage?.transfer && 
               !longPressedMessage?.intimatePay && (
                <button
                  onClick={handleRecallMessage}
                  className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 ios-button transition-all"
                  style={{ border: 'none', background: 'transparent' }}
                >
                  撤回
                </button>
              )}
              
              {/* 删除 */}
              <button
                onClick={handleDeleteMessage}
                className="w-full px-4 py-2.5 hover:bg-black/5 text-left text-sm text-gray-900 ios-button transition-all"
                style={{ border: 'none', background: 'transparent' }}
              >
                删除
              </button>
            </div>
          </div>
          
          <style>{`
            @keyframes menuFadeIn {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </>
      )}

      {/* 查看撤回消息弹窗 */}
      {viewingRecalledMessage && (
        <>
          {/* 遮罩层 */}
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
            style={{
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
            }}
            onClick={() => setViewingRecalledMessage(null)}
          >
            {/* 弹窗内容 */}
            <div 
              className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {viewingRecalledMessage.content?.includes('你撤回了') ? '你' : (character?.name || 'AI')}撤回的消息
                </h3>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {viewingRecalledMessage.recalledContent || '无内容'}
                </p>
              </div>
              
              <button
                onClick={() => setViewingRecalledMessage(null)}
                className="w-full py-3 bg-wechat-green text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  )
}

export default ChatDetail
