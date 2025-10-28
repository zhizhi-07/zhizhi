import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { BackIcon, MoreIcon, SendIcon, AddCircleIcon, EmojiIcon } from '../components/Icons'
import StatusBar from '../components/StatusBar'
import { useSettings } from '../context/SettingsContext'
import { useCharacter } from '../context/CharacterContext'
import { useUser } from '../context/UserContext'
import { callAI } from '../utils/api'
import { buildRoleplayPrompt, buildBlacklistPrompt } from '../utils/prompts'
import MusicInviteCard from '../components/MusicInviteCard'
// import { buildPromptFromTemplate } from '../utils/promptTemplate' // 文件不存在，已注释
import { setItem as safeSetItem } from '../utils/storage'
import { getCoupleSpaceContentSummary } from '../utils/coupleSpaceContentUtils'
import ChatMenu from '../components/ChatMenu'
import CallScreen from '../components/CallScreen'
import IncomingCallScreen from '../components/IncomingCallScreen'
import RedEnvelopeSender from '../components/RedEnvelopeSender'
import RedEnvelopeDetail from '../components/RedEnvelopeDetail'
import RedEnvelopeCard from '../components/RedEnvelopeCard'
import XiaohongshuCard from '../components/XiaohongshuCard'
import XiaohongshuSelector from '../components/XiaohongshuSelector'
import XiaohongshuLinkInput from '../components/XiaohongshuLinkInput'
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
import intimatePayIcon from '../assets/intimate-pay-icon.webp'
import { useMemory } from '../hooks/useMemory'
import { useBackground } from '../context/BackgroundContext'
import { blacklistManager } from '../utils/blacklistManager'
import { getStreakData, updateStreak } from '../utils/streakSystem'
import { useAccounting } from '../context/AccountingContext'
import { extractBillFromAIResponse } from '../utils/accountingAssistant'
import { lorebookManager } from '../utils/lorebookSystem'
import { calculateContextTokens, formatTokenCount } from '../utils/tokenCounter'
import { XiaohongshuNote } from '../types/xiaohongshu'
import { markAIReplying, markAIReplyComplete } from '../utils/backgroundAI'
import { clearUnread, incrementUnread } from '../utils/unreadMessages'

interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp?: number  // 添加时间戳字段（毫秒）
  isRecalled?: boolean  // 是否已撤回
  recalledContent?: string  // 撤回前的原始内容（供AI查看）
  originalType?: 'received' | 'sent'  // 撤回前的原始消息类型（用于判断是谁撤回的）
  quotedMessage?: {  // 引用的消息
    id: number
    content: string
    senderName: string
    type: 'received' | 'sent'
  }
  messageType?: 'text' | 'transfer' | 'system' | 'redenvelope' | 'emoji' | 'photo' | 'voice' | 'location' | 'intimate_pay' | 'couple_space_invite' | 'xiaohongshu' | 'image' | 'musicInvite'
  transfer?: {
    amount: number
    message: string
    status?: 'pending' | 'received' | 'expired'
  }
  redEnvelopeId?: string
  emojiUrl?: string
  emojiDescription?: string
  photoDescription?: string
  imageUrl?: string  // 用于识图的图片URL（base64或http链接）
  voiceText?: string
  avatarPrompt?: string  // 换头像时使用的提示词
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
  coupleSpaceInvite?: {
    inviterId: string
    inviterName: string
    status: 'pending' | 'accepted' | 'rejected'
  }
  xiaohongshuNote?: XiaohongshuNote  // 小红书笔记数据
  blocked?: boolean  // 是否被拉黑（AI消息显示警告图标）
}

const ChatDetail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { currentUser, updateUser } = useUser()
  
  // 记忆系统
  const memorySystem = useMemory(id || '')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState<Message[]>(() => {
    if (id) {
      const savedMessages = localStorage.getItem(`chat_messages_${id}`)
      const loadedMessages = savedMessages ? JSON.parse(savedMessages) : []
      
      // 数据版本管理
      const DATA_VERSION = 2 // 当前数据版本
      const currentVersion = parseInt(localStorage.getItem(`chat_data_version_${id}`) || '0')
      
      // 为旧消息添加时间戳（如果没有）
      // 只在第一次加载时处理，之后所有消息都会有timestamp
      let needsSave = currentVersion < DATA_VERSION
      const processedMessages = loadedMessages.map((msg: Message, index: number) => {
        let updated = { ...msg }
        
        // 添加时间戳
        if (!msg.timestamp) {
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
          
          updated.timestamp = today.getTime()
        }
        
        // 修复旧的转账消息：如果备注是"转账"或"你发起了一笔转账"，改为空字符串
        if (msg.messageType === 'transfer' && msg.transfer?.message) {
          console.log('🔍 检查转账消息备注:', msg.transfer.message)
          if (msg.transfer.message === '转账' || msg.transfer.message === '你发起了一笔转账') {
            console.log('✅ 修复转账消息，将备注从', msg.transfer.message, '改为空字符串')
            needsSave = true
            updated = {
              ...updated,
              transfer: {
                ...updated.transfer!,
                message: ''
              }
            }
          }
        }
        
        return updated
      })
      
      // 如果有消息被添加了timestamp或数据被迁移，保存回localStorage
      if (needsSave) {
        setTimeout(() => {
          localStorage.setItem(`chat_messages_${id}`, JSON.stringify(processedMessages))
          localStorage.setItem(`chat_data_version_${id}`, String(DATA_VERSION))
          console.log(`✅ 数据已迁移到版本 ${DATA_VERSION}`)
        }, 0)
      }
      
      return processedMessages
    }
    return []
  })
  const [isAiTyping, setIsAiTyping] = useState(false)
  const saveTimeoutRef = useRef<number>() // 防抖保存定时器
  const [showMenu, setShowMenu] = useState(false)
  const isPageVisibleRef = useRef(true) // 跟踪页面是否可见（用于后台AI回复）
  const aiRepliedCountRef = useRef(0) // 记录AI回复的消息数（用于计算未读）
  const isMountedRef = useRef(true) // 追踪组件是否已挂载（用于切换聊天时继续AI回复）
  
  // Token 计数状态
  const [tokenStats, setTokenStats] = useState({ total: 0, remaining: 0, percentage: 0, systemPrompt: 0, lorebook: 0, messages: 0 })
  const [showTokenDetail, setShowTokenDetail] = useState(false)
  const [responseTime, setResponseTime] = useState(0) // 响应时间（毫秒）
  const [lorebookEntries, setLorebookEntries] = useState<Array<{ name: string; tokens: number }>>([])
  
  const { background: globalBackground, getBackgroundStyle: getGlobalBackgroundStyle } = useBackground()
  
  // 读取当前聊天的专属背景
  const [chatBackground, setChatBackground] = useState(() => {
    return localStorage.getItem(`chat_background_${id}`) || ''
  })
  
  // 监听聊天背景变化
  useEffect(() => {
    const handleStorageChange = () => {
      setChatBackground(localStorage.getItem(`chat_background_${id}`) || '')
    }
    
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [id])
  
  // 检查是否应用全局背景到所有界面
  const [applyToAllPages, setApplyToAllPages] = useState(() => {
    const saved = localStorage.getItem('apply_background_to_all_pages')
    return saved === 'true'
  })
  
  // 监听设置变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('apply_background_to_all_pages')
      setApplyToAllPages(saved === 'true')
    }
    
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(handleStorageChange, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])
  
  // 获取当前聊天的背景样式
  const getBackgroundStyle = () => {
    // 优先级：聊天专属背景 > 全局背景（如果勾选） > 默认
    let bg = chatBackground
    if (!bg && applyToAllPages) {
      bg = globalBackground
    }
    
    if (!bg) {
      return {
        background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
      }
    }
    if (bg.startsWith('http') || bg.startsWith('data:image')) {
      return {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    return {
      background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
    }
  }
  
  const background = chatBackground || (applyToAllPages ? globalBackground : '')
  
  // 从localStorage读取当前聊天的旁白设置
  const [enableNarration, setEnableNarration] = useState(() => {
    const saved = localStorage.getItem(`narrator_enabled_${id}`)
    return saved === 'true'
  })

  // 从localStorage读取当前聊天的主动打电话设置
  const [enableProactiveCalls, setEnableProactiveCalls] = useState(() => {
    const saved = localStorage.getItem(`proactive_calls_enabled_${id}`)
    return saved === 'true'
  })

  // 读取气泡自定义设置 - 使用 state 以便响应变化
  const [userBubbleColor, setUserBubbleColor] = useState(() => {
    return localStorage.getItem(`user_bubble_color_${id}`) || localStorage.getItem('user_bubble_color') || '#FFD4E5'
  })
  const [aiBubbleColor, setAiBubbleColor] = useState(() => {
    return localStorage.getItem(`ai_bubble_color_${id}`) || localStorage.getItem('ai_bubble_color') || '#FFFFFF'
  })
  const [userBubbleCSS, setUserBubbleCSS] = useState(() => {
    return localStorage.getItem(`user_bubble_css_${id}`) || localStorage.getItem('user_bubble_css') || ''
  })
  const [aiBubbleCSS, setAiBubbleCSS] = useState(() => {
    return localStorage.getItem(`ai_bubble_css_${id}`) || localStorage.getItem('ai_bubble_css') || ''
  })
  
  // 读取红包和转账封面
  const [redEnvelopeCover, setRedEnvelopeCover] = useState(() => {
    return localStorage.getItem(`red_envelope_cover_${id}`) || ''
  })
  const [redEnvelopeIcon, setRedEnvelopeIcon] = useState(() => {
    return localStorage.getItem(`red_envelope_icon_${id}`) || ''
  })
  const [transferCover, setTransferCover] = useState(() => {
    return localStorage.getItem(`transfer_cover_${id}`) || ''
  })
  const [transferIcon, setTransferIcon] = useState(() => {
    return localStorage.getItem(`transfer_icon_${id}`) || ''
  })
  
  // 监听 localStorage 变化，实时更新气泡样式、封面和字体
  useEffect(() => {
    const handleStorageChange = () => {
      setUserBubbleColor(localStorage.getItem(`user_bubble_color_${id}`) || localStorage.getItem('user_bubble_color') || '#FFD4E5')
      setAiBubbleColor(localStorage.getItem(`ai_bubble_color_${id}`) || localStorage.getItem('ai_bubble_color') || '#FFFFFF')
      setUserBubbleCSS(localStorage.getItem(`user_bubble_css_${id}`) || localStorage.getItem('user_bubble_css') || '')
      setAiBubbleCSS(localStorage.getItem(`ai_bubble_css_${id}`) || localStorage.getItem('ai_bubble_css') || '')
      setRedEnvelopeCover(localStorage.getItem(`red_envelope_cover_${id}`) || '')
      setRedEnvelopeIcon(localStorage.getItem(`red_envelope_icon_${id}`) || '')
      setTransferCover(localStorage.getItem(`transfer_cover_${id}`) || '')
      setTransferIcon(localStorage.getItem(`transfer_icon_${id}`) || '')
      
      // 应用自定义字体
      const fontId = localStorage.getItem('chat_font_family')
      const fontFamilyValue = localStorage.getItem('chat_font_family_value')
      
      if (fontId && fontId !== 'system' && fontFamilyValue) {
        document.documentElement.style.setProperty('--chat-font-family', fontFamilyValue)
      } else {
        document.documentElement.style.removeProperty('--chat-font-family')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 使用轮询检测 localStorage 变化（因为同一页面的 storage 事件不会触发）
    const interval = setInterval(handleStorageChange, 500)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [id])
  
  // 将自定义 CSS 注入到页面中
  useEffect(() => {
    const styleId = `custom-bubble-style-${id}`
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }
    
    // 组合用户和 AI 的自定义 CSS
    const combinedCSS = `${userBubbleCSS}\n${aiBubbleCSS}`
    styleElement.textContent = combinedCSS
    
    console.log('💅 CSS 已注入:', combinedCSS.substring(0, 100) + '...')
    
    return () => {
      // 组件卸载时移除样式
      const el = document.getElementById(styleId)
      if (el) {
        el.remove()
      }
    }
  }, [id, userBubbleCSS, aiBubbleCSS])
  
  const { showStatusBar } = useSettings()
  const { getCharacter, updateCharacter } = useCharacter()
  const { getRedEnvelope, saveRedEnvelope, updateRedEnvelope } = useRedEnvelope()
  const { moments } = useMoments()
  const { addTransaction } = useAccounting()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasProcessedTransferRef = useRef(false)
  const hasProcessedIntimatePayRef = useRef(false)
  const hasProcessedCoupleSpaceInviteRef = useRef(false)
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
  
  // 情侣空间相关状态
  const [showCoupleSpaceInviteSender, setShowCoupleSpaceInviteSender] = useState(false)
  const [showCoupleSpaceContentModal, setShowCoupleSpaceContentModal] = useState(false)
  const [coupleSpaceContentType, setCoupleSpaceContentType] = useState<'photo' | 'message' | 'anniversary' | null>(null)
  const [hasCoupleSpaceActive, setHasCoupleSpaceActive] = useState(false)
  
  // 情侣空间内容表单数据
  const [couplePhotoDescription, setCouplePhotoDescription] = useState('')
  const [couplePhotoFiles, setCouplePhotoFiles] = useState<string[]>([])
  const [coupleMessageContent, setCoupleMessageContent] = useState('')
  const [anniversaryDate, setAnniversaryDate] = useState('')
  const [anniversaryTitle, setAnniversaryTitle] = useState('')
  const [anniversaryDescription, setAnniversaryDescription] = useState('')
  
  // 消息分页加载
  const [displayCount, setDisplayCount] = useState(30) // 初始显示30条
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // 表情包相关状态
  const [showEmojiPanel, setShowEmojiPanel] = useState(false)
  
  // 消息容器ref
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef(0)
  const isFirstLoadRef = useRef(true)
  const prevMessageCountRef = useRef(0) // 记录上一次的消息数量
  
  // 监听小红书手动输入事件
  useEffect(() => {
    const handleOpenInput = () => {
      setShowXiaohongshuInput(true)
    }
    window.addEventListener('openXiaohongshuInput', handleOpenInput)
    return () => {
      window.removeEventListener('openXiaohongshuInput', handleOpenInput)
    }
  }, [])
  
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
  
  // 小红书相关状态
  const [showXiaohongshuSelector, setShowXiaohongshuSelector] = useState(false)
  const [showXiaohongshuInput, setShowXiaohongshuInput] = useState(false)
  
  // 通话相关状态
  const [showCallScreen, setShowCallScreen] = useState(false)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [showIncomingCall, setShowIncomingCall] = useState(false) // 来电界面
  
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
  const [callAITyping, setCallAITyping] = useState(false) // 通话中AI正在输入
  
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
  
  // 处理滚动加载更多
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || isLoadingMore) return
    
    // 检测是否滚动到顶部（距离顶部小于100px）
    if (container.scrollTop < 100 && displayCount < messages.length) {
      setIsLoadingMore(true)
      prevScrollHeightRef.current = container.scrollHeight
      
      // 加载更多30条
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + 30, messages.length))
        setIsLoadingMore(false)
      }, 100)
    }
  }, [isLoadingMore, displayCount, messages.length])
  
  // 监听滚动
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // 加载更多后保持滚动位置
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    // 如果是加载更多（不是首次），保持滚动位置
    if (prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current
      if (scrollDiff > 0) {
        container.scrollTop = scrollDiff
      }
      prevScrollHeightRef.current = 0
    } else {
      // 首次加载或切换聊天后，强制滚动到底部
      setTimeout(() => {
        container.scrollTop = container.scrollHeight
      }, 100)
    }
  }, [displayCount])
  
  // 切换聊天时重置displayCount并清除未读消息
  useEffect(() => {
    setDisplayCount(30)
    isFirstLoadRef.current = true
    prevMessageCountRef.current = 0 // 重置消息数量记录
    
    // 清除未读消息
    if (id) {
      clearUnread(id)
      console.log('✅ 已清除未读消息:', id)
    }
    
    // 立即尝试滚动一次
    setTimeout(() => {
      const container = messagesContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }, 200)
  }, [id])
  
  // 监听页面可见性（用户是否在当前聊天页面）
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisibleRef.current = !document.hidden
      console.log('👁️ 页面可见性变化:', isPageVisibleRef.current ? '可见' : '隐藏')
      
      // 如果页面从隐藏变为可见，清除未读消息
      if (isPageVisibleRef.current && id) {
        clearUnread(id)
      }
    }
    
    // 初始化为可见和已挂载
    isPageVisibleRef.current = !document.hidden
    isMountedRef.current = true
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // 组件卸载时标记
      isMountedRef.current = false
    }
  }, [id])
  
  // 🔍 首次进入聊天时自动识别AI头像（只识别一次，除非头像变了）
  useEffect(() => {
    if (!character?.id || !character?.avatar || !character.avatar.startsWith('data:image')) {
      return
    }
    
    // 🔑 检查头像是否变化（对比指纹）
    const currentFingerprint = character.avatar.substring(0, 200)
    const savedFingerprint = localStorage.getItem(`character_avatar_fingerprint_${character.id}`)
    const existingDescription = localStorage.getItem(`character_avatar_description_${character.id}`)
    
    if (existingDescription && savedFingerprint === currentFingerprint) {
      console.log('✅ AI头像未变化，使用缓存的识图结果')
      return
    }
    
    if (existingDescription && savedFingerprint !== currentFingerprint) {
      console.log('🔄 检测到AI头像已更换，重新识别...')
    }
    
    // 首次识别或头像已变化，重新识图
    // 只在生产环境（Netlify）中启用头像识别
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    
    if (isProduction) {
    ;(async () => {
      try {
        console.log('👁️ 首次进入聊天，开始识别AI头像...')
        const visionResponse = await fetch('/.netlify/functions/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: character.avatar,
            prompt: '详细描述这个头像的内容，包括：角色特征、风格、颜色、表情、氛围等。请用简洁的语言描述。'
          })
        })
        
        if (visionResponse.ok) {
          const visionData = await visionResponse.json()
          const avatarDescription = visionData.description || visionData.result
          
          // 保存识图结果和头像指纹
          localStorage.setItem(`character_avatar_description_${character.id}`, avatarDescription)
          localStorage.setItem(`character_avatar_recognized_at_${character.id}`, Date.now().toString())
          localStorage.setItem(`character_avatar_fingerprint_${character.id}`, character.avatar.substring(0, 200))
          console.log('✅ AI头像识别完成:', avatarDescription)
        } else {
            console.warn('⚠️ AI头像识别失败（API返回错误）')
        }
      } catch (error) {
          // 静默失败，不在控制台显示错误
          console.log('💡 AI头像识别跳过（本地环境或网络错误）')
      }
    })()
    } else {
      console.log('💡 本地开发环境，跳过AI头像识别')
    }
  }, [character?.id, character?.avatar])
  
  // 新消息自动滚动到底部（优化后的滚动逻辑）
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    
    // 🔧 修复：只在消息增加时才扩展displayCount（防止切换聊天时懒加载失效）
    const prevCount = prevMessageCountRef.current
    const currentCount = messages.length
    
    // 如果消息数量增加（新消息），且超过了displayCount，则扩展显示范围
    if (currentCount > prevCount && currentCount > displayCount) {
      console.log(`📈 消息增加: ${prevCount} → ${currentCount}，扩展displayCount`)
      setDisplayCount(currentCount)
    }
    
    // 更新记录的消息数量
    prevMessageCountRef.current = currentCount
    
    // 首次加载时强制滚动到底部
    if (isFirstLoadRef.current && messages.length > 0) {
      isFirstLoadRef.current = false
      // 使用requestAnimationFrame + setTimeout确保DOM完全渲染
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 300)
      })
      return
    }
    
    // 新消息时，如果在底部附近则自动滚动
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200
    if (isNearBottom) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }
  }, [messages.length, displayCount])
  
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
              } else if (lastMessage.messageType === 'couple_space_invite') {
                lastMessageText = '[情侣空间]'
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

  // 从角色描述中提取初始记忆（已禁用，避免不必要的API调用）
  // useEffect(() => {
  //   if (character?.description && id) {
  //     memorySystem.extractInitialMemories(character.description)
  //       .catch((error: any) => {
  //         console.error('❌ 初始记忆提取失败:', error)
  //       })
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [character?.description, id])

  // 背景设置现在由全局 BackgroundContext 管理
  
  // 监听旁白设置变化
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(`narrator_enabled_${id}`)
      setEnableNarration(saved === 'true')
      
      const callsSaved = localStorage.getItem(`proactive_calls_enabled_${id}`)
      setEnableProactiveCalls(callsSaved === 'true')
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    const interval = setInterval(() => {
      const saved = localStorage.getItem(`narrator_enabled_${id}`)
      if ((saved === 'true') !== enableNarration) {
        setEnableNarration(saved === 'true')
      }
      
      const callsSaved = localStorage.getItem(`proactive_calls_enabled_${id}`)
      if ((callsSaved === 'true') !== enableProactiveCalls) {
        setEnableProactiveCalls(callsSaved === 'true')
      }
    }, 2000) // 从500ms改为2000ms，减少CPU占用
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [id, enableNarration, enableProactiveCalls])

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
            // 检查拉黑状态
            const blacklistStatus = blacklistManager.getBlockStatus('user', id)
            const isBlocked = blacklistStatus.blockedByMe
            
            // AI决定发消息
            const aiMessage: Message = {
              id: Date.now(),
              type: 'received',
              content: response.trim(),
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: Date.now(),
              blocked: isBlocked // 标记拉黑状态
            }
            
            // 立即更新消息列表
            setMessages(prev => {
              const newMessages = [...prev, aiMessage]
              
              // 立即保存到 localStorage（不使用防抖）
              safeSetItem(`chat_messages_${id}`, newMessages)
              
              // 立即更新聊天列表
              const chatList = localStorage.getItem('chatList')
              if (chatList) {
                const chats = JSON.parse(chatList)
                const chatIndex = chats.findIndex((chat: any) => chat.id === id)
                
                if (chatIndex !== -1) {
                  chats[chatIndex] = {
                    ...chats[chatIndex],
                    lastMessage: aiMessage.content || '',
                    time: aiMessage.time
                  }
                  localStorage.setItem('chatList', JSON.stringify(chats))
                  console.log(`📝 聊天列表已更新: ${aiMessage.content.substring(0, 20)}...`)
                }
              }
              
              return newMessages
            })
            
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

  // 检查情侣空间状态
  useEffect(() => {
    const checkCoupleSpaceStatus = async () => {
      if (id) {
        const { hasActiveCoupleSpace } = await import('../utils/coupleSpaceUtils')
        const isActive = hasActiveCoupleSpace(id)
        console.log('💑 检查情侣空间状态:', { characterId: id, isActive })
        setHasCoupleSpaceActive(isActive)
      }
    }
    checkCoupleSpaceStatus()
  }, [id, messages])

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

  // 处理从情侣空间页面跳转过来的邀请 - 使用ref防止重复
  useEffect(() => {
    const shouldSendInvite = location.state?.sendCoupleSpaceInvite
    if (shouldSendInvite && !hasProcessedCoupleSpaceInviteRef.current && id && character && currentUser) {
      console.log('💑 自动发送情侣空间邀请卡片')
      
      hasProcessedCoupleSpaceInviteRef.current = true
      
      const now = Date.now()
      const coupleSpaceMsg: Message = {
        id: now,
        type: 'sent',
        content: '',
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: now,
        messageType: 'couple_space_invite',
        coupleSpaceInvite: {
          characterId: character.id,
          characterName: character.name,
          characterAvatar: character.avatar,
          status: 'pending'
        }
      }
      
      // 禁用平滑滚动
      shouldSmoothScrollRef.current = false
      
      setMessages(prev => [...prev, coupleSpaceMsg])
      
      // 清除location.state
      window.history.replaceState({}, document.title)
      
      // 延迟重置标记
      setTimeout(() => {
        hasProcessedCoupleSpaceInviteRef.current = false
        console.log('🔄 情侣空间邀请标记已重置')
      }, 1000)
    }
  }, [location.state?.sendCoupleSpaceInvite, id, character, currentUser])

  const handleSend = async () => {
    if (inputValue.trim() && !isAiTyping) {
      const now = Date.now()
      
      // 检查是否被AI拉黑
      const blacklistStatus = id ? blacklistManager.getBlockStatus(id, 'user') : { blockedByMe: false, blockedByTarget: false }
      const isBlockedByAI = blacklistStatus.blockedByTarget
      
      const userMessage: Message = {
        id: messages.length + 1,
        type: 'sent',
        content: inputValue,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: now,
        blocked: isBlockedByAI, // 添加被拉黑标记
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
      
      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      setInputValue('')
      setQuotedMessage(null) // 清除引用
      
      // 更新火花
      if (id) {
        updateStreak(id)
      }
      
      // 不自动触发AI回复，让用户手动点击按钮触发
      // await getAIReply(updatedMessages)
    }
  }

  // 点击纸飞机触发AI回复
  const handleAIReply = async () => {
    console.log('🎯 点击纸飞机按钮，准备调用AI')
    console.log('  isAiTyping:', isAiTyping)
    console.log('  messages.length:', messages.length)
    
    if (isAiTyping) {
      console.log('⚠️ AI正在输入中，跳过本次调用')
      return
    }
    
    // 标记AI正在回复
    if (id) {
      markAIReplying(id)
    }
    
    // 如果是第一次对话（没有消息），让AI主动打招呼
    console.log('✅ 开始调用getAIReply')
    await getAIReply(messages)
  }

  // 重新生成AI这一轮的所有消息
  const handleRegenerateMessage = async (messageId: number) => {
    console.log('🔄 重新生成AI这一轮消息，消息ID:', messageId)
    
    if (isAiTyping) {
      console.log('⚠️ AI正在输入中，无法重新生成')
      return
    }
    
    // 找到要重新生成的消息索引
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) {
      console.log('❌ 未找到消息')
      return
    }
    
    // 从这条消息开始往前找，找到这一轮AI回复的第一条消息
    // （即找到最近的一条用户消息之后的第一条AI消息）
    let firstAIMessageIndex = messageIndex
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].type === 'sent') {
        // 找到用户消息，停止
        firstAIMessageIndex = i + 1
        break
      }
      // 如果是AI消息或系统消息，继续往前找
      if (i === 0) {
        // 到达第一条消息，说明这一轮从开头开始
        firstAIMessageIndex = 0
      }
    }
    
    console.log('🔍 找到AI这一轮的起始索引:', firstAIMessageIndex)
    
    // 删除从第一条AI消息到最后的所有消息
    const newMessages = messages.slice(0, firstAIMessageIndex)
    setMessages(newMessages)
    
    console.log('🗑️ 删除了', messages.length - firstAIMessageIndex, '条消息')
    
    // 稍微延迟一下，让用户看到消息被删除
    setTimeout(async () => {
      // 调用AI重新生成
      await getAIReply(newMessages)
    }, 100)
  }

  // 计算是否有输入内容（优化性能，避免重复计算）
  const hasInputText = useMemo(() => {
    return inputValue.trim().length > 0
  }, [inputValue])

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

  // 情侣空间邀请发送处理函数
  const handleSendCoupleSpaceInvite = async () => {
    if (!id || !character) return
    
    // 创建情侣空间邀请记录到localStorage
    const { createCoupleSpaceInvite } = await import('../utils/coupleSpaceUtils')
    const relation = createCoupleSpaceInvite(
      'current_user',
      id,
      character.name,
      character.avatar
    )
    
    if (!relation) {
      alert('已有活跃的情侣空间')
      setShowCoupleSpaceInviteSender(false)
      return
    }
    
    const now = Date.now()
    const coupleSpaceMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'couple_space_invite',
      coupleSpaceInvite: {
        inviterId: 'current_user',
        inviterName: currentUser?.name || '用户',
        status: 'pending'
      }
    }
    
    setMessages(prev => [...prev, coupleSpaceMsg])
    setShowCoupleSpaceInviteSender(false)
    console.log('✅ 情侣空间邀请已发送，localStorage记录已创建')
  }

  // 打开情侣空间内容创建弹窗
  const handleOpenCoupleSpaceContent = () => {
    console.log('📸 打开情侣空间内容创建弹窗')
    setShowMenu(false)
    setShowCoupleSpaceContentModal(true)
  }

  // 发送情侣空间照片
  const handleSendCouplePhoto = async () => {
    if (!id || !character) return
    if (!couplePhotoDescription.trim() && couplePhotoFiles.length === 0) return
    
    const { addCouplePhoto } = await import('../utils/coupleSpaceContentUtils')
    const baseDescription = couplePhotoDescription.trim() || '照片'
    
    // 如果有多张照片
    if (couplePhotoFiles.length > 0) {
      const now = Date.now()
      
      // 批量上传所有照片
      for (let i = 0; i < couplePhotoFiles.length; i++) {
        const photoFile = couplePhotoFiles[i]
        const description = couplePhotoFiles.length > 1 
          ? `${baseDescription} (${i + 1}/${couplePhotoFiles.length})`
          : baseDescription
        
        addCouplePhoto(character.id, currentUser?.name || '我', description, photoFile)
      }
      
      // 添加系统消息
      const systemMsg: Message = {
        id: now,
        type: 'system',
        content: `📸 你在情侣空间上传了 ${couplePhotoFiles.length} 张照片${baseDescription !== '照片' ? `：${baseDescription}` : ''}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now,
        messageType: 'system',
        isHidden: false
      }
      
      setMessages(prev => [...prev, systemMsg])
      alert(`${couplePhotoFiles.length} 张照片已上传到情侣空间！`)
    } else {
      // 没有照片，只有描述
      const now = Date.now()
      addCouplePhoto(character.id, currentUser?.name || '我', baseDescription, undefined)
      
      const systemMsg: Message = {
        id: now,
        type: 'system',
        content: `📸 你在情侣空间上传了照片：${baseDescription}`,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        timestamp: now,
        messageType: 'system',
        isHidden: false
      }
      
      setMessages(prev => [...prev, systemMsg])
      alert('照片已上传到情侣空间！')
    }
    
    setCouplePhotoDescription('')
    setCouplePhotoFiles([])
    setShowCoupleSpaceContentModal(false)
    setCoupleSpaceContentType(null)
  }

  // 发送情侣空间留言
  const handleSendCoupleMessage = async () => {
    if (!id || !character) return
    if (!coupleMessageContent.trim()) return
    
    const { addCoupleMessage } = await import('../utils/coupleSpaceContentUtils')
    addCoupleMessage(character.id, currentUser?.name || '我', coupleMessageContent.trim())
    
    const now = Date.now()
    const systemMsg: Message = {
      id: now,
      type: 'system',
      content: `💌 你在情侣空间留言：${coupleMessageContent.trim()}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      messageType: 'system',
      isHidden: false
    }
    
    setMessages(prev => [...prev, systemMsg])
    setCoupleMessageContent('')
    setShowCoupleSpaceContentModal(false)
    setCoupleSpaceContentType(null)
    alert('留言已发布到情侣空间！')
  }

  // 发送纪念日
  const handleSendAnniversary = async () => {
    if (!id || !character) return
    if (!anniversaryDate || !anniversaryTitle.trim()) return
    
    const { addCoupleAnniversary } = await import('../utils/coupleSpaceContentUtils')
    addCoupleAnniversary(character.id, currentUser?.name || '我', anniversaryDate, anniversaryTitle.trim(), anniversaryDescription.trim())
    
    const now = Date.now()
    const systemMsg: Message = {
      id: now,
      type: 'system',
      content: `🎂 你在情侣空间添加了纪念日：${anniversaryTitle.trim()}（${anniversaryDate}）`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: now,
      messageType: 'system',
      isHidden: false
    }
    
    setMessages(prev => [...prev, systemMsg])
    setAnniversaryDate('')
    setAnniversaryTitle('')
    setAnniversaryDescription('')
    setShowCoupleSpaceContentModal(false)
    setCoupleSpaceContentType(null)
    alert('纪念日已添加到情侣空间！')
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

  // 相册功能 - 上传本地图片（支持AI识图）
  const handleSelectImage = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true  // 支持多选
    
    input.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement
      const files = target.files
      if (!files || files.length === 0) return
      
      try {
        // 动态导入图片工具
        const { compressImage, isValidImageSize } = await import('../utils/imageUtils')
        
        const newMessages: Message[] = []
        
        // 批量处理所有图片
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          
          if (!file.type.startsWith('image/')) {
            console.warn(`⚠️ 跳过非图片文件: ${file.name}`)
            continue
          }
          
          // 验证文件大小
          if (!isValidImageSize(file, 10)) {
            alert(`图片 ${file.name} 大小超过10MB，已跳过`)
            continue
          }
          
          // 压缩图片
          const compressedBase64 = await compressImage(file, 1024, 1024, 0.8)
          
          // 创建图片消息（支持AI识图）
          const imageMsg: Message = {
            id: Date.now() + i,  // 确保ID唯一
            type: 'sent',
            content: files.length > 1 ? `发送了图片 (${i + 1}/${files.length})` : '发送了一张图片',
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: Date.now() + i,
            messageType: 'image',
            imageUrl: compressedBase64
          }
          
          newMessages.push(imageMsg)
        }
        
        if (newMessages.length > 0) {
          setMessages(prev => [...prev, ...newMessages])
          console.log(`📷 已发送 ${newMessages.length} 张图片`)
        }
      } catch (error) {
        console.error('图片处理失败:', error)
        alert('图片处理失败，请重试')
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

  // 小红书功能
  const handleSelectXiaohongshu = () => {
    setShowMenu(false)
    setShowXiaohongshuSelector(true)
  }
  
  const handleSendXiaohongshu = (note: XiaohongshuNote) => {
    const now = Date.now()
    const xiaohongshuMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'xiaohongshu',
      xiaohongshuNote: note
    }
    
    setMessages(prev => [...prev, xiaohongshuMsg])
    setShowXiaohongshuSelector(false)
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

  // 删除消息（真正删除，保存到localStorage）
  const handleDeleteMessage = () => {
    if (longPressedMessage) {
      const newMessages = messages.filter(msg => msg.id !== longPressedMessage.id)
      safeSetMessages(newMessages) // 使用safeSetMessages确保保存到localStorage
      console.log('🗑️ 消息已删除并保存到localStorage')
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
              originalType: msg.type as 'received' | 'sent', // 保存原始消息类型，用于判断撤回者
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

    // 设置AI正在输入状态
    setCallAITyping(true)
    
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
      
      // 通话提示词变量替换函数
      const replaceVars = (text: string, charName: string, userName: string): string => {
        return text
          .replace(/\{\{char\}\}/gi, charName)
          .replace(/\{\{user\}\}/gi, userName)
      }

      // 语音通话提示词
      const voicePrompt = `你是 ${character.name}。
${character.description ? replaceVars(character.description, character.name, currentUser?.name || '用户') : ''}
${character.signature ? replaceVars(character.signature, character.name, currentUser?.name || '用户') : ''}

现在是${timeString}，你正在和${currentUser?.name || '用户'}打语音电话。

最近的聊天：
${recentChats || '无'}

刚才通话里说的：
${recentTranscript}

${currentUser?.name || '用户'}："${lastMessage.content}"

现在回复。用JSON格式：
{"messages": [{"type": "voice_desc", "content": "..."}, {"type": "voice_text", "content": "..."}]}

只返回JSON：`

      // 视频通话提示词
      const videoPrompt = `你是 ${character.name}。
${character.description ? replaceVars(character.description, character.name, currentUser?.name || '用户') : ''}
${character.signature ? replaceVars(character.signature, character.name, currentUser?.name || '用户') : ''}

现在是${timeString}，你正在和${currentUser?.name || '用户'}视频通话。

最近的聊天：
${recentChats || '无'}

刚才通话里说的：
${recentTranscript}

${currentUser?.name || '用户'}："${lastMessage.content}"

现在回复。用JSON格式：
{"messages": [{"type": "voice_desc", "content": "..."}, {"type": "voice_text", "content": "..."}]}

只返回JSON：`

      const prompt = isVideoCall ? videoPrompt : voicePrompt

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
    } finally {
      // 结束AI输入状态
      setCallAITyping(false)
    }
  }

  // 安全的setMessages：组件卸载后也能保存消息
  const safeSetMessages = useCallback((newMessages: Message[]) => {
    console.log('🔍 safeSetMessages 调用，isMounted:', isMountedRef.current, '消息数:', newMessages.length)
    
    // 先直接设置消息到state（确保渲染）
    setMessages(newMessages)
    console.log('✅ 消息已设置到state')
    
    // 🔧 始终立即保存到 localStorage（防止用户快速退出聊天窗口时消息丢失）
    if (id) {
      safeSetItem(`chat_messages_${id}`, newMessages)
      console.log('💾 消息已立即保存到 localStorage')
    }
  }, [id])

  // 获取AI回复
  const getAIReply = async (currentMessages: Message[]) => {
    console.log('🚀🚀🚀 getAIReply 函数被调用了！')
    console.log('📊 参数检查:')
    console.log('  - currentMessages:', currentMessages?.length || 0)
    console.log('  - character:', character?.name)
    console.log('  - id:', id)
    
    setIsAiTyping(true)
    
    console.log('🎭 开始生成AI回复')
    console.log('👤 角色:', character?.name)
    console.log('💬 当前消息数:', currentMessages.length)

    try {
      console.log('🔵 进入try块')
      
      // 使用角色扮演提示词
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📝 角色信息检查:')
      console.log('  名字:', character?.name)
      console.log('  签名:', character?.signature)
      console.log('  人设描述:', character?.description)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      console.log('🟢 步骤1: 获取火花天数')
      // 获取当前火花天数
      const streakData = id ? getStreakData(id) : null
      const streakDays = streakData?.currentStreak || 0
      
      // 检查是否有活跃的情侣空间
      const { hasActiveCoupleSpace, isUserCoupleSpacePublic } = await import('../utils/coupleSpaceUtils')
      const hasCoupleSpace = id ? hasActiveCoupleSpace(id) : false
      const userHasPublicCoupleSpace = isUserCoupleSpacePublic()
      console.log('💑 情侣空间状态:', hasCoupleSpace ? '已开启' : '未开启')
      console.log('💑 用户情侣空间公开状态:', userHasPublicCoupleSpace ? '公开' : '私密或无')
      
      // 获取用户最后一条消息
      const lastUserMsg = currentMessages.filter(m => m.type === 'sent').slice(-1)[0]
      const userMessageContent = lastUserMsg?.content || ''
      
      console.log('🟢 步骤2: 导入梗库工具')
      // 🔥 基于对话上下文匹配可能用到的梗（类似世界书）
      const { retrieveMemes, getRandomMemes } = await import('../utils/memesRetrieval')
      console.log('🟢 步骤2完成: 梗库工具导入成功')
      
      // 获取最近10条消息的内容作为上下文（包括AI可能想说的话的情绪）
      const recentContext = currentMessages
        .slice(-10)
        .map(m => m.content)
        .join(' ')
      
      // 先匹配相关的梗（最多5个）
      let matchedMemes = await retrieveMemes(recentContext, 5)
      
      // 如果匹配的梗太少，补充2个随机梗，增加多样性
      if (matchedMemes.length < 3) {
        const randomMemes = getRandomMemes(2)
        const matchedIds = new Set(matchedMemes.map(m => m.id))
        randomMemes.forEach(meme => {
          if (!matchedIds.has(meme.id)) {
            matchedMemes.push(meme)
          }
        })
      }
      
      // 转换为 RetrievedMeme 格式
      const retrievedMemes = matchedMemes.map(m => ({
        梗: m['梗'],
        含义: m['含义']
      }))
      
      if (matchedMemes.length > 0) {
        console.log('🔥 热梗库:', matchedMemes.map(m => m['梗']).join(', '))
      }
      
      // 构建对话历史（根据用户设置读取消息数量，包含隐藏的通话记录）
      // 注意：不过滤 system 消息，因为通话记录是 system 类型但 isHidden=true
      const recentMessages = currentMessages.slice(-aiMessageLimit)
      
      // 🍺 检查是否使用自定义提示词模板
      const useCustomTemplate = id ? localStorage.getItem(`prompt_template_id_${id}`) : null
      const customTemplateContent = id ? localStorage.getItem(`prompt_custom_template_${id}`) : null
      
      let systemPrompt: string
      
      // 如果没有设置模板，默认使用"角色扮演强化"
      const templateId = useCustomTemplate || 'roleplayEnhanced'
      
      if (templateId !== 'default') {
        // 使用模板系统（包括默认的角色扮演强化）
        console.log('🍺 使用提示词模板:', templateId)
        
        // 构建历史对话文本
        const historyText = recentMessages.map(msg => {
          const sender = msg.type === 'sent' ? currentUser?.name || '用户' : character?.name || 'AI'
          let content = msg.content
          
          // 处理特殊消息类型
          if (msg.messageType === 'transfer') {
            content = `[转账] ¥${msg.transfer?.amount} - ${msg.transfer?.message || ''}`
          } else if (msg.messageType === 'redenvelope') {
            content = `[红包]`
          } else if (msg.messageType === 'emoji') {
            content = `[表情包: ${msg.emojiDescription}]`
          } else if (msg.messageType === 'photo') {
            content = `[照片: ${msg.photoDescription}]`
          } else if (msg.messageType === 'voice') {
            content = `[语音: ${msg.voiceText}]`
          } else if (msg.messageType === 'location') {
            content = `[位置: ${msg.location?.name}]`
          } else if (msg.messageType === 'xiaohongshu' && msg.xiaohongshuNote) {
            content = `[小红书: ${msg.xiaohongshuNote.title}]`
          }
          
          return `${sender}: ${content}`
        }).join('\n')
        
        // 使用角色扮演提示词系统（原模板系统功能已移除）
        const coupleSpaceContent = id ? getCoupleSpaceContentSummary(id) : ''
        
        // 获取用户外貌描述（通过识图获得）
        const userAppearance = currentUser?.id 
          ? localStorage.getItem(`user_avatar_description_${currentUser.id}`) 
          : null
        
        // 获取AI头像描述（通过识图获得）
        const characterAvatar = character?.id 
          ? localStorage.getItem(`character_avatar_description_${character.id}`) 
          : null
        
        systemPrompt = buildRoleplayPrompt(
          {
            name: character?.name || 'AI',
            nickname: character?.nickname,
            signature: character?.signature,
            description: character?.description,
            tags: character?.tags
          },
          {
            name: currentUser?.name || '用户',
            nickname: currentUser?.nickname,
            signature: currentUser?.signature
          },
          enableNarration, // 传入旁白模式开关
          streakDays,
          retrievedMemes, // 传入热梗
          hasCoupleSpace, // 传入情侣空间状态（情侣空间伙伴始终可见）
          coupleSpaceContent, // 传入情侣空间内容摘要
          enableProactiveCalls, // 传入主动打电话开关
          userAppearance || undefined, // 传入用户外貌描述
          characterAvatar || undefined // 传入AI头像描述
        )
        
        console.log('✅ 使用角色扮演提示词系统')
      } else {
        // 使用原有的提示词系统
        console.log('📝 使用默认提示词系统')
        const coupleSpaceContent = id ? getCoupleSpaceContentSummary(id) : ''
        
        // 获取用户外貌描述（通过识图获得）
        const userAppearance = currentUser?.id 
          ? localStorage.getItem(`user_avatar_description_${currentUser.id}`) 
          : null
        
        // 获取AI头像描述（通过识图获得）
        const characterAvatar = character?.id 
          ? localStorage.getItem(`character_avatar_description_${character.id}`) 
          : null
        
        systemPrompt = buildRoleplayPrompt(
          {
            name: character?.name || 'AI',
            nickname: character?.nickname,
            signature: character?.signature,
            description: character?.description,
            tags: character?.tags
          },
          {
            name: currentUser?.name || '用户',
            nickname: currentUser?.nickname,
            signature: currentUser?.signature
          },
          enableNarration, // 传入旁白模式开关
          streakDays,
          retrievedMemes, // 传入热梗
          hasCoupleSpace, // 传入情侣空间状态（情侣空间伙伴始终可见）
          coupleSpaceContent, // 传入情侣空间内容摘要
          enableProactiveCalls, // 传入主动打电话开关
          userAppearance || undefined, // 传入用户外貌描述
          characterAvatar || undefined // 传入AI头像描述
        )
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 完整系统提示词:')
      console.log(systemPrompt)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
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
        } else if (msg.messageType === 'xiaohongshu') {
          console.log(`  ${idx + 1}. [小红书] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}: ${msg.xiaohongshuNote?.title || '无标题'}`)
        } else if (msg.messageType === 'emoji') {
          console.log(`  ${idx + 1}. [表情包] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}: ${msg.emojiDescription || '无描述'}`)
        } else if (msg.messageType === 'redenvelope') {
          console.log(`  ${idx + 1}. [红包] ${msg.type === 'sent' ? '用户→AI' : 'AI→用户'}`)
        } else {
          const contentPreview = msg.content 
            ? (typeof msg.content === 'string' ? msg.content.substring(0, 30) : '[复杂消息]')
            : '(空)'
          console.log(`  ${idx + 1}. [消息] ${msg.type === 'sent' ? '用户' : 'AI'}: ${contentPreview}...`)
        }
      })
      console.log('✅ forEach完成')
      
      // 获取表情包说明（带超时保护）
      let emojiInstructions = ''
      let availableEmojis: any[] = []
      try {
        const { getEmojis } = await import('../utils/emojiStorage')
        availableEmojis = await Promise.race([
          getEmojis(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('获取表情包超时')), 2000))
        ]) as any[]
        const { generateEmojiInstructions } = await import('../utils/emojiParser')
        emojiInstructions = generateEmojiInstructions(availableEmojis)
        console.log('✅ 表情包加载成功')
      } catch (error) {
        console.warn('⚠️ 表情包加载失败，跳过:', error)
        emojiInstructions = ''
        availableEmojis = []
      }
      
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
      const lastUserMessage = currentMessages.filter(m => m.type === 'sent').slice(-1)[0]
      
      if (lastAiMessage && lastUserMessage && lastAiMessage.timestamp && lastUserMessage.timestamp) {
        const timeDiff = lastUserMessage.timestamp - lastAiMessage.timestamp
        const minutes = Math.floor(timeDiff / 1000 / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        
        // 告诉时间+简短提醒，不限制话术
        if (minutes < 1) {
          timeIntervalContext = `\n⏰ 用户秒回了你（可以表现开心/惊喜）\n`
        } else if (minutes < 5) {
          timeIntervalContext = `\n⏰ 用户过了${minutes}分钟回复\n`
        } else if (minutes < 60) {
          timeIntervalContext = `\n⏰ 用户过了${minutes}分钟回复（可以自然表现等待感）\n`
        } else if (hours < 24) {
          timeIntervalContext = `\n⏰ 用户过了${hours}小时回复（可以表现担心/想念）\n`
        } else {
          timeIntervalContext = `\n⏰ 用户过了${days}天回复（可以表现想念/好奇发生了什么）\n`
        }
        
        console.log('⏰ 时间间隔:', timeIntervalContext.trim())
      }
      
      if (blacklistContext) {
        console.log('✅ 拉黑提示词已添加到系统提示中')
        console.log('拉黑提示词长度:', blacklistContext.length, '字符')
      }
      
      // 添加用户情侣空间状态提示（仅对非情侣空间伙伴的AI）
      let userCoupleSpaceContext = ''
      if (userHasPublicCoupleSpace && !hasCoupleSpace) {
        // 用户公开了情侣空间，但当前AI不是情侣空间伙伴
        userCoupleSpaceContext = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n⚠️ 重要提示：用户情侣空间状态\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n用户已经和其他人建立了情侣空间（公开状态）。\n\n这意味着：\n- 你不能向用户发送情侣空间邀请\n- 如果用户向你发送情侣空间邀请，你可以接受或拒绝\n- 你知道用户已经有情侣空间了，可以在对话中自然提及\n\n`
      }
      
      // 构建世界书上下文（获取详细统计）
      const recentMessagesText = recentMessages.map(m => m.content || '').join('\n')
      const lorebookResult = lorebookManager.buildContextWithStats(character.id, recentMessagesText, 2000)
      const lorebookContext = lorebookResult.context ? `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📚 世界书设定\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${lorebookResult.context}\n\n` : ''
      setLorebookEntries(lorebookResult.triggeredEntries)
      console.log('📚 世界书上下文:', lorebookResult.context ? `已加载 ${lorebookResult.triggeredEntries.length} 个条目` : '未触发')
      
      // 构建系统提示词
      let fullSystemPrompt = systemPrompt + blacklistContext + timeIntervalContext + momentsContextText + intimatePayContext + memoryContext + userCoupleSpaceContext + lorebookContext + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 回复方式
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 可以连续发多条消息（用换行分隔，每条消息单独一行）
• 根据心情决定回复长度
• 像真人一样自然聊天

💡 多条消息示例：
第一条消息
第二条消息
第三条消息

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
• 🎨 生成图片：[生成图片:标题|描述|提示词] - AI生成图片并包装成精美小红书卡片
• 位置：[位置:地名:详细地址]
• 红包：[红包:金额:祝福语] 或 [领取红包] 或 [领红包]（最多200元）
• 转账：[转账:金额:说明] 或 [接收转账] 或 [退还转账]
• 亲密付：[亲密付:月额度] 或 [接受亲密付] 或 [拒绝亲密付]
• 撤回：[撤回消息] - 撤回你刚发的上一条消息（详见下方说明）
• 拉黑：[拉黑用户] - 如果对方太过分，你可以选择拉黑TA（慎用！）

格式必须严格，用冒号分隔（生成图片用竖线|分隔）。

💰 **你可以给对方转账** [转账:520:爱你] 表达心意，给生活费
- 对方给你转账时，你可以收 [接收转账] 或退 [退还转账]
- 一次只处理1笔，分开回复

🧧 **你可以发红包** [红包:66.6:开心] 哄对方开心（最多200元）
- 对方的红包记得领 [领取红包]
- 5.20=爱你 | 6.66=顺利 | 8.88=发财 | 9.99=长久

💝 **亲密付** - 对方给你开通后，你可以随便花TA的钱买东西
- 你可以主动开通给对方 [亲密付:2000] 让TA随便花
- 对方给你开通时，根据关系决定 [接受亲密付] 或 [拒绝亲密付]
- 🛒 **消费格式：**[消费:平台-商品-金额]
  例：[消费:淘宝-袜子-29.9] [消费:美团-奶茶-28] [消费:便利店-零食-15.5]
  对方会收到消费通知，你可以选择提或不提这次消费
- ⭐ 你的日常生活：逛街、买衣服、点外卖、喝奶茶、买零食...都可以自然消费
- 不能超过对方给的额度，用完会提示额度不足
- 发红包/转账也会优先用TA的额度

🎭 **你可以换形象** 心情变了、想换个样子时
- [换头像:可爱猫咪，橘色，圆眼睛] 换个新头像
- [网名:新的昵称] 改个新网名
- [个性签名:今天也要开心鸭~] 换个签名

🔙 **撤回消息：**[撤回消息] - 撤回上一条消息
- 用于：说错话、后悔、制造悬念
- ❌ 不能撤回红包/转账！
- 撤回后需解释或重新表达

🔄 **撤回处理：**[撤回了消息:"xxx"] = 用户撤回 | [我撤回了消息:"xxx"] = 你自己撤回

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 **AI生图：**[生成图片:标题|描述|提示词]
- 例：[生成图片:樱花|春日美景|樱花盛开，唯美，高清]
- 自动包装成小红书卡片，支持中文提示词

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 **引用：**[引用:ID] 你的回复
最近消息ID: ${recentMessages.slice(-5).filter(msg => msg.type === 'sent').map(msg => msg.id).join(', ')}

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
      
      console.log('🟢 步骤X: 开始构建apiMessages')
      const apiMessages = [
        {
          role: 'system' as const,
          content: fullSystemPrompt
        },
        ...recentMessages.map((msg, mapIndex) => {
          console.log(`  🔹 处理消息 ${mapIndex + 1}/${recentMessages.length}: type=${msg.type}, messageType=${msg.messageType}`)
          
          // 优先处理撤回的消息
          if (msg.isRecalled && msg.recalledContent) {
            // 使用 originalType 判断是用户撤回还是AI撤回（更准确）
            const isUserRecalled = msg.originalType === 'sent'
            const isAIRecalled = msg.originalType === 'received'
            
            console.log('🔄 发现撤回消息，原内容:', msg.recalledContent, '撤回者:', isUserRecalled ? '用户' : 'AI', 'originalType:', msg.originalType)
            
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
          
          // 处理系统消息
          if (msg.type === 'system') {
            // 如果是隐藏的系统消息（通话记录），传递给AI
            if (msg.isHidden) {
              return {
                role: 'system' as const,
                content: msg.content
              }
            }
            
            // 如果是转账/红包相关的系统消息，也传递给AI（让AI知道操作结果）
            if (msg.content.includes('已收款') || 
                msg.content.includes('退还了转账') || 
                msg.content.includes('已领取') ||
                msg.content.includes('已过期')) {
              return {
                role: 'system' as const,
                content: `[系统提示: ${msg.content}]`
              }
            }
            
            // 其他系统消息过滤掉
            return null
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
          
          // 如果是情侣空间邀请，转换为AI可读的格式
          if (msg.messageType === 'couple_space_invite' && msg.coupleSpaceInvite) {
            const isUserSent = msg.type === 'sent'
            const coupleSpaceInfo = isUserSent
              ? `[用户邀请你加入情侣空间，状态：${msg.coupleSpaceInvite.status === 'pending' ? '待你决定是否接受' : msg.coupleSpaceInvite.status === 'accepted' ? '你已接受' : '你已拒绝'}]`
              : `[你邀请用户加入情侣空间，状态：${msg.coupleSpaceInvite.status === 'pending' ? '等待用户接受' : msg.coupleSpaceInvite.status === 'accepted' ? '用户已接受' : '用户已拒绝'}]`
            console.log('💑 情侣空间邀请传递给AI:', coupleSpaceInfo, '发送者:', isUserSent ? 'user' : 'ai')
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: coupleSpaceInfo
            }
          }
          
          // 如果是小红书消息，转换为AI可读的格式（包含封面图片和评论）
          if (msg.messageType === 'xiaohongshu' && msg.xiaohongshuNote) {
            const note = msg.xiaohongshuNote
            const isUserSent = msg.type === 'sent'
            
            let noteText = isUserSent
              ? `[用户分享了一个小红书笔记]\n标题：${note.title}\n内容：${note.description}\n作者：${note.author.nickname}\n点赞：${note.stats.likes} 评论：${note.stats.comments} 收藏：${note.stats.collects}\n标签：${note.tags.join(' ')}`
              : `[你分享了一个小红书笔记]\n标题：${note.title}`
            
            // 如果有热门评论，添加到文本中
            if (note.topComments && note.topComments.length > 0) {
              noteText += '\n\n热门评论：'
              note.topComments.forEach((comment, index) => {
                noteText += `\n${index + 1}. ${comment.author}：${comment.content} (👍${comment.likes})`
              })
            }
            
            // 如果有图片，添加图片内容
            if (note.coverImage) {
              console.log('📕 小红书消息（含图片）传递给AI:', noteText)
              return {
                role: isUserSent ? 'user' as const : 'assistant' as const,
                content: [
                  { type: 'text', text: noteText },
                  { type: 'image_url', image_url: { url: note.coverImage, detail: 'low' } }
                ]
              }
            } else {
              console.log('📕 小红书消息传递给AI:', noteText)
              return {
                role: isUserSent ? 'user' as const : 'assistant' as const,
                content: noteText
              }
            }
          }
          
          // 如果是图片消息（识图），传递图片给AI
          if (msg.messageType === 'image' && msg.imageUrl) {
            const isUserSent = msg.type === 'sent'
            const imageText = isUserSent ? '用户发送了一张图片' : '你发送了一张图片'
            console.log('🖼️ 图片消息（识图）传递给AI')
            return {
              role: isUserSent ? 'user' as const : 'assistant' as const,
              content: [
                { type: 'text', text: imageText },
                { type: 'image_url', image_url: { url: msg.imageUrl, detail: 'high' } }
              ]
            }
          }
          
          // 普通文字消息
          if (msg.content) {
            // 引用消息不需要特殊处理，引用的消息已经在对话历史中
            // AI可以根据上下文自然理解，添加引用标记反而可能导致AI重复内容
            return {
              role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
              content: msg.content
            }
          }
          
          // 其他情况跳过
          console.log(`  ✅ 消息 ${mapIndex + 1} 处理完成`)
          return null
        }).filter(msg => msg !== null)
      ]
      
      console.log('✅ apiMessages构建完成，总数:', apiMessages.length)
      
      // 规则提醒已移除，让AI自然回复
      
      console.log('📤 发送给AI的消息总数:', apiMessages.length)
      console.log('📤 发送给AI的完整消息列表:')
      apiMessages.forEach((msg, idx) => {
        if (msg.role === 'system') {
          const contentLength = typeof msg.content === 'string' ? msg.content.length : JSON.stringify(msg.content).length
          console.log(`  ${idx}. [系统提示词] (${contentLength} 字符)`)
        } else {
          const preview = typeof msg.content === 'string' 
            ? msg.content.substring(0, 50) 
            : '[包含图片的消息]'
          console.log(`  ${idx}. [${msg.role}] ${preview}...`)
        }
      })
      
      console.log('🔴🔴🔴 准备调用callAI')
      console.log('  apiMessages数量:', apiMessages.length)
      console.log('  第一条system prompt长度:', apiMessages[0]?.content?.length || 0)
      
      // 计算 Token 统计
      // 从 API 设置中获取模型的真实上下文限制
      const apiSettings = localStorage.getItem('api_settings')
      let contextLimit = 100000 // 默认 100k
      if (apiSettings) {
        const settings = JSON.parse(apiSettings)
        // 根据模型判断上下文限制
        if (settings.model?.includes('gemini-2.0')) {
          contextLimit = 1000000 // Gemini 2.0 有 1M 上下文
        } else if (settings.model?.includes('gpt-4')) {
          contextLimit = 128000 // GPT-4 Turbo 128k
        } else if (settings.model?.includes('claude-3')) {
          contextLimit = 200000 // Claude 3 200k
        }
      }
      
      // 将content转换为字符串（如果是数组则提取text部分）
      const messageContents = apiMessages.slice(1).map(m => {
        if (typeof m.content === 'string') {
          return m.content
        } else if (Array.isArray(m.content)) {
          // 提取文字部分
          return m.content
            .filter(item => item.type === 'text')
            .map(item => item.text)
            .join(' ')
        }
        return ''
      })
      const stats = calculateContextTokens(
        fullSystemPrompt,
        lorebookContext,
        messageContents,
        contextLimit
      )
      setTokenStats(stats)
      console.log('📊Token统计:', {
        总计: stats.total,
        系统提示: stats.systemPrompt,
        世界书: stats.lorebook,
        消息: stats.messages,
        剩余: stats.remaining,
        百分比: `${stats.percentage.toFixed(1)}%`
      })

      // 调用AI（记录响应时间）
      console.log('⚡️⚡️⚡️ 正在调用callAI...')
      const startTime = Date.now()
      let aiResponse: string
      try {
        aiResponse = await callAI(apiMessages)
        setResponseTime(Date.now() - startTime)
        console.log('✅✅✅ callAI返回成功')
      } catch (error: any) {
        // 如果是Vision不支持错误，降级处理：移除图片，只发送文字
        if (error.message === 'VISION_NOT_SUPPORTED') {
          console.warn('⚠️ 模型不支持Vision，降级为纯文字模式')
          
          // 将所有content转换为纯文字
          const textOnlyMessages = apiMessages.map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' 
              ? msg.content 
              : Array.isArray(msg.content)
                ? msg.content.filter(item => item.type === 'text').map(item => item.text).join('\n')
                : ''
          }))
          
          console.log('🔄 重试：使用纯文字模式')
          aiResponse = await callAI(textOnlyMessages)
          console.log('✅ 纯文字模式调用成功')
        } else {
          throw error
        }
      }
      
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
      
      // 检查AI是否要修改网名（先记录，稍后添加到newMessages）
      let nicknameSystemMessage: Message | null = null
      const nicknameMatch = aiResponse.match(/\[网名:(.+?)\]/)
      if (nicknameMatch && character) {
        const newNickname = nicknameMatch[1].trim()
        const oldNickname = character.nickname || character.name
        console.log(`✏️ AI修改网名: ${oldNickname} → ${newNickname}`)
        updateCharacter(character.id, { nickname: newNickname })
        
        // 创建系统提示消息（稍后添加）
        nicknameSystemMessage = {
          id: Date.now(),
          type: 'system',
          content: `${oldNickname} 更改了网名`,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        console.log('📣 准备添加网名系统提示:', nicknameSystemMessage.content)
      }
      
      // 检查AI是否要修改个性签名（先记录，稍后添加到newMessages）
      let signatureSystemMessage: Message | null = null
      const signatureMatch = aiResponse.match(/\[个性签名:(.+?)\]/)
      if (signatureMatch && character) {
        const newSignature = signatureMatch[1].trim()
        console.log(`✏️ AI修改个性签名: ${newSignature}`)
        updateCharacter(character.id, { signature: newSignature })
        
        // 创建系统提示消息（稍后添加）
        signatureSystemMessage = {
          id: Date.now() + 1, // 避免ID冲突
          type: 'system',
          content: `${character.nickname || character.name} 更改了个性签名`,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        console.log('📣 准备添加签名系统提示:', signatureSystemMessage.content)
      }
      
      // 检查AI是否要修改用户备注（先记录，稍后添加到newMessages）
      let remarkSystemMessage: Message | null = null
      const remarkMatch = aiResponse.match(/\[备注:(.+?)\]/)
      if (remarkMatch && character && currentUser) {
        const newRemark = remarkMatch[1].trim()
        const oldRemark = currentUser.remark || currentUser.nickname || currentUser.name
        console.log(`📝 AI修改用户备注: ${oldRemark} → ${newRemark}`)
        updateUser(currentUser.id, { remark: newRemark })
        
        // 创建系统提示消息（稍后添加）
        remarkSystemMessage = {
          id: Date.now() + 2, // 避免ID冲突
          type: 'system',
          content: `${character.nickname || character.name} 修改了备注为："${newRemark}"`,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system'
        }
        console.log('📣 准备添加备注系统提示:', remarkSystemMessage.content)
      }
      
      // 检查AI是否要换头像
      const avatarMatch = aiResponse.match(/\[换头像:(.+?)\]/)
      if (avatarMatch && character) {
        const description = avatarMatch[1].trim()
        console.log(`🖼️ AI要换头像: ${description}`)
        
        // 异步调用换头像API
        ;(async () => {
          try {
            console.log('🖼️ 开始调用换头像API...')
            
            let newAvatar: string | null = null
            let usedPrompt: string | null = null  // 记录使用的提示词
            
            // 🖼️ 特殊情况1：使用用户发的图片消息（AI识图后想用）
            // 优先检测序号格式（最简单可靠）
            const seqMatch = description.match(/^0?([1-5])$/)
            
            if (seqMatch) {
              // 序号格式：01, 02, 03, 1, 2, 3
              console.log('🔍 检查用户图片消息...')
              console.log('📊 当前消息总数:', currentMessages.length)
              
              // 先看看所有用户发的消息
              const allSentMessages = currentMessages.filter(msg => msg.type === 'sent')
              console.log('📤 用户发送的消息数:', allSentMessages.length)
              
              // 看看有多少照片类型（支持 photo 和 image 两种）
              const photoMessages = allSentMessages.filter(msg => 
                msg.messageType === 'photo' || msg.messageType === 'image'
              )
              console.log('📸 照片类型消息数:', photoMessages.length)
              
              // 看看有多少有描述或图片URL
              const photosWithContent = photoMessages.filter(msg => 
                msg.photoDescription || msg.imageUrl
              )
              console.log('📝 有内容的照片数:', photosWithContent.length)
              
              // 找到AI最后一次回复的位置
              let lastAIIndex = -1
              for (let i = currentMessages.length - 1; i >= 0; i--) {
                if (currentMessages[i].type === 'received') {
                  lastAIIndex = i
                  break
                }
              }
              
              console.log('🔍 AI最后回复位置:', lastAIIndex)
              
              // 🔧 修复：先筛选所有用户图片，再取最后10张（保证顺序正确）
              console.log('📊 开始筛选用户图片')
              
              // 从所有消息中筛选用户发的图片
              const allUserPhotos = currentMessages
                .filter(msg => {
                  if (msg.type !== 'sent') return false
                  // 只要是image类型且有imageUrl就行
                  if (msg.messageType === 'image' && msg.imageUrl) {
                    return true
                  }
                  // photo类型（拍摄）需要有描述
                  if (msg.messageType === 'photo' && msg.photoDescription) {
                    return true
                  }
                  return false
                })
              
              // 取最后10张图片（最近的）
              const userPhotos = allUserPhotos.slice(-10)
              
              console.log('📸 找到的所有图片数:', allUserPhotos.length)
              console.log('✅ 取最近10张:', userPhotos.length)
              
              console.log('✅ 最终筛选出的图片数:', userPhotos.length)
              
              if (userPhotos.length === 0) {
                console.warn('⚠️ 没有找到用户发的图片')
                alert('没有找到你发的图片哦~')
                return
              }
              
              // 🔧 修复：01=最新的图，02=第二新的图（从后往前数）
              const seqNum = parseInt(seqMatch[1])
              const index = userPhotos.length - seqNum
              
              if (index < 0 || index >= userPhotos.length) {
                console.warn(`⚠️ 序号${seqMatch[1]}超出范围，只有${userPhotos.length}张图片`)
                alert(`只有${userPhotos.length}张图片哦~`)
                return
              }
              
              const selectedPhoto = userPhotos[index]
              console.log(`📸 选择序号${seqMatch[1]}的图片（倒数第${seqNum}张，数组索引${index}）`)
              
              // 直接使用用户发的图片作为AI头像
              if (selectedPhoto.imageUrl) {
                // 相册上传的图片，直接用
                console.log('📷 直接使用用户上传的图片')
                newAvatar = selectedPhoto.imageUrl
                usedPrompt = '直接使用了用户上传的图片（序号' + seqMatch[1] + '）'
              } else if (selectedPhoto.photoDescription) {
                // 拍摄的图片，用描述生成
                console.log('🎨 使用拍摄图片的描述生成头像')
                const photoDesc = selectedPhoto.photoDescription
                
                // 简单中英翻译
                const translateMap: Record<string, string> = {
                  '猫咪': 'cute cat', '小猫': 'kitten', '猫': 'cat',
                  '狗': 'dog', '狗狗': 'cute dog',
                  '兔子': 'rabbit', '小兔': 'bunny',
                  '粉发': 'pink hair', '黑发': 'black hair', '金发': 'blonde hair',
                  '二次元': 'anime style', '动漫': 'anime',
                  '少女': 'girl', '女孩': 'girl', '男孩': 'boy',
                  '机器人': 'robot', '赛博朋克': 'cyberpunk',
                  '可爱': 'cute', '酷酷的': 'cool', '帅气': 'handsome',
                  '真实': 'realistic', '照片': 'photo',
                  '像素': 'pixel art', '风景': 'landscape', '人物': 'character',
                  '母子': 'mother and child', '妈妈': 'mother', '宝宝': 'baby',
                  '呸': '', '好耶': '', '多爱': 'love', '比较': 'compare',
                  '符合': 'match', '沉稳': 'calm', '气质': 'elegant', '喵喵': 'meow'
                }
                
                let translatedDesc = photoDesc
                for (const [cn, en] of Object.entries(translateMap)) {
                  translatedDesc = translatedDesc.replace(new RegExp(cn, 'g'), en)
                }
                
                const enhancedPrompt = `portrait avatar of ${translatedDesc}, centered composition, profile picture style, high quality, detailed, professional digital art, 4k`
                usedPrompt = enhancedPrompt  // 保存提示词
                console.log('📝 翻译后的提示词:', enhancedPrompt)
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=512&height=512&nologo=true&enhance=true&model=flux`
                
                const imgResponse = await fetch(imageUrl)
                const blob = await imgResponse.blob()
                newAvatar = await new Promise<string>((resolve) => {
                  const reader = new FileReader()
                  reader.onloadend = () => resolve(reader.result as string)
                  reader.readAsDataURL(blob)
                })
                console.log('✅ 使用拍摄图片描述生成头像成功')
              }
            }
            // 🎭 特殊情况2：直接复制用户的个人头像（偷头像）
            else if (description.includes('你头像') || description.includes('偷头像') || description.includes('复制头像')) {
              console.log('🎭 直接复制用户头像')
              if (currentUser?.avatar) {
                // 直接复制用户头像（不重新生成）
                newAvatar = currentUser.avatar
                usedPrompt = '直接复制了用户的头像（未使用AI生成）'  // 记录为直接复制
                console.log('✅ 成功复制用户头像')
              } else {
                console.warn('⚠️ 用户没有头像')
                alert('你还没有头像呢~')
                return
              }
            }
            // 🎨 普通情况：生成新头像
            else {
              // 🔧 本地开发Mock：直接使用Pollinations.ai生图
              const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
              let data: any
              
              if (isDev) {
                console.log('🔧 本地开发模式：使用Mock生图')
                
                // 简单中英翻译（避免中文导致生成错误）
                const translateMap: Record<string, string> = {
                  '猫咪': 'cute cat', '小猫': 'kitten', '猫': 'cat',
                  '狗': 'dog', '狗狗': 'cute dog',
                  '兔子': 'rabbit', '小兔': 'bunny',
                  '粉发': 'pink hair', '黑发': 'black hair', '金发': 'blonde hair',
                  '二次元': 'anime style', '动漫': 'anime',
                  '少女': 'girl', '女孩': 'girl', '男孩': 'boy',
                  '机器人': 'robot', '赛博朋克': 'cyberpunk',
                  '可爱': 'cute', '酷酷的': 'cool', '帅气': 'handsome',
                  '真实': 'realistic', '照片': 'photo',
                  '母子': 'mother and child', '妈妈': 'mother', '宝宝': 'baby',
                  '呸': '', '好耶': '', '多爱': 'love', '比较': 'compare',
                  '符合': 'match', '沉稳': 'calm', '气质': 'elegant', '喵喵': 'meow'
                }
                
                let translatedDesc = description
                for (const [cn, en] of Object.entries(translateMap)) {
                  translatedDesc = translatedDesc.replace(new RegExp(cn, 'g'), en)
                }
                
                // 强化提示词：添加更多关键词确保生成正确
                const enhancedPrompt = `portrait avatar of ${translatedDesc}, centered composition, profile picture style, high quality, detailed, professional digital art, 4k`
                usedPrompt = enhancedPrompt  // 保存提示词
                console.log('📝 翻译后的提示词:', enhancedPrompt)
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=512&height=512&nologo=true&enhance=true&model=flux`
                
                // 下载并转换为base64
                const imgResponse = await fetch(imageUrl)
                const blob = await imgResponse.blob()
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader()
                  reader.onloadend = () => resolve(reader.result as string)
                  reader.readAsDataURL(blob)
                })
                
                data = { avatar: base64, method: 'mock_pollinations' }
                console.log('✅ Mock生图成功')
              } else {
              // 生产环境：调用Netlify函数
              const response = await fetch('/.netlify/functions/change-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  description,
                  preferReal: description.includes('真实') || description.includes('照片')
                })
              })
              
              console.log('📡 API响应状态:', response.status)
              
              if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
              }
              
              data = await response.json()
              }
              
              console.log('📦 返回数据:', data)
              newAvatar = data.avatar
            }
            
            // 统一处理头像更新
            if (newAvatar) {
              // 更新角色头像
              updateCharacter(character.id, { avatar: newAvatar })
              console.log(`✅ 头像更换成功`)
              
              // 🔍 立即识别新头像，让AI知道自己头像长什么样
              ;(async () => {
                try {
                  console.log('👁️ 开始识别AI新头像...')
                  const visionResponse = await fetch('/.netlify/functions/vision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      image: newAvatar,
                      prompt: '详细描述这个头像的内容，包括：角色特征、风格、颜色、表情、氛围等。请用简洁的语言描述。'
                    })
                  })
                  
                  if (visionResponse.ok) {
                    const visionData = await visionResponse.json()
                    const avatarDescription = visionData.description || visionData.result
                    
                    // 保存识图结果和头像指纹
                    localStorage.setItem(`character_avatar_description_${character.id}`, avatarDescription)
                    localStorage.setItem(`character_avatar_recognized_at_${character.id}`, Date.now().toString())
                    localStorage.setItem(`character_avatar_fingerprint_${character.id}`, newAvatar.substring(0, 200))
                    console.log('✅ AI新头像识别完成:', avatarDescription)
                  } else {
                    console.warn('⚠️ AI新头像识别失败')
                  }
                } catch (error) {
                  console.error('❌ AI新头像识别异常:', error)
                }
              })()
              
              // 添加系统提示（使用回调确保获取最新状态）
              const systemMessage: Message = {
                id: Date.now() + Math.random(),  // 确保ID唯一
                type: 'system',
                content: `${character.nickname || character.name} 更换了头像`,
                time: new Date().toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                timestamp: Date.now(),
                messageType: 'system',
                avatarPrompt: usedPrompt || description  // 保存提示词
              }
              console.log('📣 添加系统提示:', systemMessage.content)
              // 使用函数式更新确保基于最新状态
              setMessages(prev => {
                console.log('📝 添加系统消息前的消息数:', prev.length)
                const updated = [...prev, systemMessage]
                console.log('📝 添加系统消息后的消息数:', updated.length)
                
                // 🔧 立即保存到 localStorage（防止用户退出聊天窗口时丢失）
                if (id) {
                  safeSetItem(`chat_messages_${id}`, updated)
                  console.log('💾 换头像系统消息已立即保存到 localStorage')
                }
                
                return updated
              })
            } else {
              console.error('❌ 换头像失败')
              alert(`换头像失败`)
            }
          } catch (error: any) {
            console.error('❌ 换头像异常:', error)
            alert(`换头像失败：${error.message || '网络错误'}`)
          }
        })()
      }
      
      // 检查AI是否要打电话
      const voiceCallMatch = aiResponse.match(/\[语音通话\]/)
      const videoCallMatch = aiResponse.match(/\[视频通话\]/)
      
      if (voiceCallMatch || videoCallMatch) {
        const isVideo = !!videoCallMatch
        console.log(`📞 AI发起${isVideo ? '视频' : '语音'}通话请求`)
        
        // 显示来电界面
        setIsVideoCall(isVideo)
        setShowIncomingCall(true)
        
        // 直接返回，不添加文字消息
        setIsAiTyping(false)
        return
      }
      
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
      
      // 清理通话标记
      cleanedResponse = cleanedResponse.replace(/\[语音通话\]/g, '').replace(/\[视频通话\]/g, '').trim()
      
      // 检查AI是否要拉黑用户
      const blockUserMatch = aiResponse.match(/\[拉黑用户\]/)
      if (blockUserMatch && id) {
        console.log('🚫 AI决定拉黑用户')
        blacklistManager.blockUser(id, 'user')
        cleanedResponse = cleanedResponse.replace(/\[拉黑用户\]/g, '').trim()
        
        // 添加系统提示
        const systemMessage: Message = {
          id: Date.now() + 9999,
          type: 'system',
          content: `${character?.name || 'AI'} 已将你加入黑名单`,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        }
        setMessages(prev => [...prev, systemMessage])
      }
      
      // 清理网名、个性签名和头像标记（使用[\s\S]匹配包括换行在内的所有字符）
      cleanedResponse = cleanedResponse.replace(/\[网名:[\s\S]+?\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[个性签名:[\s\S]+?\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[换头像:[\s\S]+?\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[一起听:[\s\S]+?\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[正在与[\s\S]+?一起听[\s\S]+?\]/g, '').trim()
      
      // 清理系统警告标记
      cleanedResponse = cleanedResponse.replace(/\[系统警告[：:][^\]]*\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/【系统警告[：:][^】]*】/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/系统警告[：:][^\n]*/g, '').trim()
      
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
      
      // 检查AI是否要分享小红书（支持中英文冒号）
      const xiaohongshuMatch = aiResponse.match(/\[小红书[：:](.+?)\]/)
      let aiXiaohongshuKeyword: string | null = null
      
      if (xiaohongshuMatch) {
        aiXiaohongshuKeyword = xiaohongshuMatch[1].trim()
        cleanedResponse = cleanedResponse.replace(/\[小红书[：:].+?\]/g, '').trim()
        console.log('📕 AI分享小红书，关键词:', aiXiaohongshuKeyword)
      }
      
      // 🎨 检查AI是否要生成图片（包装成小红书）
      // 格式：[生成图片:标题|描述|提示词]
      const generateImageMatch = aiResponse.match(/\[生成图片:(.+?)\|(.+?)\|(.+?)\]/)
      let aiGenerateImageData: { title: string; description: string; prompt: string } | null = null
      
      if (generateImageMatch) {
        aiGenerateImageData = {
          title: generateImageMatch[1].trim(),
          description: generateImageMatch[2].trim(),
          prompt: generateImageMatch[3].trim()
        }
        cleanedResponse = cleanedResponse.replace(/\[生成图片:.+?\|.+?\|.+?\]/g, '').trim()
        console.log('🎨 AI要生成图片:', aiGenerateImageData)
      }
      
      // 检查AI是否要发送一起听邀请
      // 支持两种格式：
      // 1. [一起听:歌名:歌手]
      // 2. [正在与 XX 一起听：歌名 - 歌手 ...]
      let musicInviteMatch = aiResponse.match(/\[一起听:(.+?):(.+?)\]/)
      let aiMusicInviteData: { songTitle: string; songArtist: string } | null = null
      
      if (musicInviteMatch) {
        aiMusicInviteData = {
          songTitle: musicInviteMatch[1],
          songArtist: musicInviteMatch[2]
        }
        cleanedResponse = cleanedResponse.replace(/\[一起听:.+?:.+?\]/g, '').trim()
        console.log('🎵 AI发送一起听邀请(格式1):', aiMusicInviteData)
      } else {
        // 尝试匹配第二种格式
        const altMatch = aiResponse.match(/\[正在与.+?一起听[：:](.+?)\s*[-－]\s*(.+?)(?:\s+\d|$|\])/);
        if (altMatch) {
          aiMusicInviteData = {
            songTitle: altMatch[1].trim(),
            songArtist: altMatch[2].trim()
          }
          cleanedResponse = cleanedResponse.replace(/\[正在与.+?一起听[：:].+?\]/g, '').trim()
          console.log('🎵 AI发送一起听邀请(格式2):', aiMusicInviteData)
        }
      }
      
      // 检查AI是否要领取红包（支持多种格式）
      if (/[\[【\(（]\s*(领取红包|领红包)\s*[\]】\)）]/.test(aiResponse)) {
        redEnvelopeAction = 'claim'
        cleanedResponse = cleanedResponse.replace(/[\[【\(（]\s*(领取红包|领红包)\s*[\]】\)）]/g, '').trim()
        console.log('🎁 AI决定：领取红包')
      }
      
      // 📊 解析状态栏信息
      // 注意：状态标记功能已禁用，不再解析和保存状态信息
      cleanedResponse = cleanedResponse.replace(/\[状态:[^\]]+\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[状态:[\s\S]*?\]/g, '').trim()
      cleanedResponse = cleanedResponse.replace(/\[.*?状态.*?\]/g, '').trim()
      
      console.log('🧹 清理后的回复内容:', cleanedResponse)
      console.log('📏 清理后的回复长度:', cleanedResponse.length)
      
      // 检查AI是否对转账做出决定
      let transferAction: 'accept' | 'reject' | null = null
      
      // 先检查AI是否要接收或退还转账（支持各种格式）
      console.log('🔍 检查转账指令，AI原始回复:', aiResponse)
      if (/[\[【\(（]\s*接收转账\s*[\]】\)）]/.test(aiResponse)) {
        transferAction = 'accept'
        cleanedResponse = cleanedResponse.replace(/[\[【\(（]\s*接收转账\s*[\]】\)）]/g, '').trim()
        console.log('✅ AI决定：接收转账')
      } else if (/[\[【\(（]\s*退还转账\s*[\]】\)）]/.test(aiResponse)) {
        transferAction = 'reject'
        cleanedResponse = cleanedResponse.replace(/[\[【\(（]\s*退还转账\s*[\]】\)）]/g, '').trim()
        console.log('↩️  AI决定：退还转账')
      } else {
        console.log('⏸️  AI未对转账做出决定（没有检测到[接收转账]或[退还转账]）')
      }
      
      // 检查AI是否要发起转账 - 支持多种格式
      // ⚠️ 如果AI正在接收/退还转账，则忽略发起转账的指令（防止冲突）
      let transferMatch = aiResponse.match(/\[转账:(\d+\.?\d*):(.+?)\]/)
      let aiTransferData: { amount: number; message: string } | null = null
      
      if (transferAction) {
        // 如果AI正在处理转账（接收或退还），忽略发起转账的指令
        if (transferMatch) {
          console.log('⚠️  AI同时包含接收/退还和发起转账指令，忽略发起转账指令')
          cleanedResponse = cleanedResponse.replace(/\[转账:\d+\.?\d*:.+?\]/g, '').trim()
        }
        // 同时清除备用格式的转账指令
        cleanedResponse = cleanedResponse.replace(/\[.*?转账.*?[¥￥]?\s*\d+\.?\d*.*?\]/g, '').trim()
      } else {
        // 只有在没有接收/退还转账时，才处理发起转账
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
      }
      
      // 🛒 检查AI是否要消费（使用亲密付额度）
      const consumeMatch = aiResponse.match(/\[消费:(.+?)-(.+?)-(\d+\.?\d*)\]/)
      let aiConsumeData: { platform: string; item: string; amount: number } | null = null
      
      if (consumeMatch) {
        aiConsumeData = {
          platform: consumeMatch[1].trim(),
          item: consumeMatch[2].trim(),
          amount: parseFloat(consumeMatch[3])
        }
        cleanedResponse = cleanedResponse.replace(/\[消费:.+?-.+?-\d+\.?\d*\]/g, '').trim()
        console.log('🛒 AI消费:', aiConsumeData)
      }
      
      // 检查AI是否要开通亲密付
      const intimatePayMatch = aiResponse.match(/\[亲密付:(\d+\.?\d*)\]/)
      let aiIntimatePayLimit: number | null = null
      
      if (intimatePayMatch) {
        aiIntimatePayLimit = parseFloat(intimatePayMatch[1])
        cleanedResponse = cleanedResponse.replace(/\[亲密付:\d+\.?\d*\]/g, '').trim()
        console.log('💝 AI开通亲密付，月额度:', aiIntimatePayLimit)
      }
      
      // 检查AI是否要发送情侣空间邀请
      let aiCoupleSpaceInvite = false
      if (aiResponse.includes('[情侣空间邀请]') || aiResponse.includes('[情侣空间]')) {
        aiCoupleSpaceInvite = true
        cleanedResponse = cleanedResponse.replace(/\[情侣空间邀请\]/g, '').replace(/\[情侣空间\]/g, '').trim()
        console.log('💑 AI发送情侣空间邀请')
      }
      
      // 检查AI是否要添加相册照片
      const albumMatch = aiResponse.match(/\[相册:([^\]]+)\]/)
      let albumDescription: string | null = null
      if (albumMatch) {
        albumDescription = albumMatch[1]
        cleanedResponse = cleanedResponse.replace(/\[相册:[^\]]+\]/g, '').trim()
        console.log('📸 AI添加相册照片:', albumDescription)
      }
      
      // 检查AI是否要添加留言
      const messageMatch = aiResponse.match(/\[留言:([^\]]+)\]/)
      let coupleMessage: string | null = null
      if (messageMatch) {
        coupleMessage = messageMatch[1]
        cleanedResponse = cleanedResponse.replace(/\[留言:[^\]]+\]/g, '').trim()
        console.log('💌 AI添加留言:', coupleMessage)
      }
      
      // 检查AI是否要添加纪念日
      const anniversaryMatch = aiResponse.match(/\[纪念日:([^\]]+)\]/)
      let anniversaryData: { date: string; title: string; description?: string } | null = null
      if (anniversaryMatch) {
        const parts = anniversaryMatch[1].split('|')
        if (parts.length >= 2) {
          anniversaryData = {
            date: parts[0].trim(),
            title: parts[1].trim(),
            description: parts[2]?.trim()
          }
          cleanedResponse = cleanedResponse.replace(/\[纪念日:[^\]]+\]/g, '').trim()
          console.log('🎂 AI添加纪念日:', anniversaryData)
        }
      }
      
      // 检查AI是否要引用消息（支持冒号后有空格）
      const quoteMatch = aiResponse.match(/\[引用:\s*(\d+)\]/)
      let aiQuotedMessageId: number | null = null
      
      if (quoteMatch) {
        aiQuotedMessageId = parseInt(quoteMatch[1])
        cleanedResponse = cleanedResponse.replace(/\[引用:\s*\d+\]/g, '').trim()
        console.log('💬 AI引用了消息ID:', aiQuotedMessageId)
        
        // 检查AI回复是否重复了引用内容（避免不必要的重复）
        const quotedMsg = currentMessages.find(m => m.id === aiQuotedMessageId)
        if (quotedMsg) {
          const quotedContent = quotedMsg.isRecalled && quotedMsg.recalledContent 
            ? quotedMsg.recalledContent 
            : (quotedMsg.content || quotedMsg.emojiDescription || quotedMsg.photoDescription || quotedMsg.voiceText || '')
          
          const cleanedQuoted = quotedContent.trim()
          const cleanedReply = cleanedResponse.trim()
          
          // 情况1: 完全相同
          if (cleanedReply === cleanedQuoted) {
            console.log('⚠️ AI回复与引用内容完全相同，已移除')
            cleanedResponse = ''
          }
          // 情况2: AI回复以引用内容开头（重复了引用内容）
          else if (cleanedReply.startsWith(cleanedQuoted) && cleanedReply.length > cleanedQuoted.length) {
            // 检查是否是简单重复延伸（如"呀呀" -> "呀呀呀呀"）
            const afterQuote = cleanedReply.substring(cleanedQuoted.length).trim()
            const quotedChar = cleanedQuoted.charAt(cleanedQuoted.length - 1)
            
            // 如果后面的内容都是重复的字符或标点，说明是无意义延伸
            if (afterQuote.split('').every(c => c === quotedChar || c === '.' || c === '。' || c === '!' || c === '！' || c === '?' || c === '？')) {
              console.log('⚠️ AI回复是引用内容的简单重复延伸，已移除重复部分')
              cleanedResponse = afterQuote.replace(new RegExp(`^${quotedChar}+`, 'g'), '').trim()
            }
            // 如果后面有实质性内容，只移除开头的重复部分
            else if (afterQuote.length < cleanedQuoted.length * 0.5) {
              // 后续内容很短，可能是不小心重复了
              console.log('⚠️ AI回复以引用内容开头，移除重复部分')
              cleanedResponse = afterQuote
            }
          }
          // 情况3: 引用内容很短（如"呀呀"），AI回复也很短且相似
          else if (cleanedQuoted.length <= 4 && cleanedReply.length <= 8) {
            // 检查是否是同一个字符的重复
            const quotedChars = new Set(cleanedQuoted.split(''))
            const replyChars = cleanedReply.split('')
            const isSimilarRepeat = replyChars.filter(c => quotedChars.has(c)).length / replyChars.length > 0.8
            
            if (isSimilarRepeat && !cleanedReply.includes('，') && !cleanedReply.includes(',') && !cleanedReply.includes('。')) {
              console.log('⚠️ AI回复是引用内容的相似重复，已移除')
              cleanedResponse = ''
            }
          }
        }
      }
      
      // 检查AI是否要撤回消息
      let shouldRecallLastMessage = false
      let recallMessageId: number | null = null
      
      // 检查是否撤回指定消息ID：[撤回:123]
      const recallWithIdMatch = aiResponse.match(/\[撤回:(\d+)\]/)
      if (recallWithIdMatch) {
        recallMessageId = parseInt(recallWithIdMatch[1])
        cleanedResponse = cleanedResponse.replace(/\[撤回:\d+\]/g, '').trim()
        console.log('🔄 AI要撤回消息ID:', recallMessageId)
      } else if (aiResponse.includes('[撤回消息]')) {
        // 撤回上一条消息
        shouldRecallLastMessage = true
        cleanedResponse = cleanedResponse.replace(/\[撤回消息\]/g, '').trim()
        console.log('🔄 AI要撤回上一条消息')
      }
      
      // 检查AI是否要写日记
      let shouldWriteDiary = false
      if (aiResponse.includes('[写日记]')) {
        shouldWriteDiary = true
        cleanedResponse = cleanedResponse.replace(/\[写日记\]/g, '').trim()
        console.log('📔 AI要写日记了')
      }
      
      // 如果AI要撤回消息，清除掉可能的动作描述（括号内容）
      // 防止AI输出类似 "(心跳加快) [撤回消息]" 这样的内容
      if (shouldRecallLastMessage || recallMessageId) {
        // 移除中文括号内的动作描述
        cleanedResponse = cleanedResponse.replace(/[（(][^）)]*[）)]/g, '').trim()
        console.log('🧹 清除撤回时的动作描述')
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
      
      // 检查AI是否对情侣空间做出决定
      let coupleSpaceAction: 'accept' | 'reject' | null = null
      
      if (aiResponse.includes('[接受情侣空间]')) {
        coupleSpaceAction = 'accept'
        cleanedResponse = cleanedResponse.replace(/\[接受情侣空间\]/g, '').trim()
        console.log('💑 AI决定：接受情侣空间')
      } else if (aiResponse.includes('[拒绝情侣空间]')) {
        coupleSpaceAction = 'reject'
        cleanedResponse = cleanedResponse.replace(/\[拒绝情侣空间\]/g, '').trim()
        console.log('💔 AI决定：拒绝情侣空间')
      }
      
      // 如果有转账操作，更新最新的待处理转账状态并添加系统提示
      if (transferAction) {
        // 从后往前找最新的待处理转账（用户发起的）
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
            
            // 添加系统提示消息（给用户看的）
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
            
            // 添加AI的系统提示消息（给AI看的，让AI知道操作成功，但用户看不到）
            const aiSystemMessage: Message = {
              id: Date.now() + 1,
              type: 'system',
              content: transferAction === 'accept' 
                ? `你已收款，已存入零钱 ¥${updatedMessages[i].transfer!.amount.toFixed(2)}` 
                : `你已退还转账 ¥${updatedMessages[i].transfer!.amount.toFixed(2)}`,
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              messageType: 'system',
              isHidden: true  // 隐藏消息，只给AI看
            }
            updatedMessages.push(aiSystemMessage)
            
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
      
      // 如果AI对情侣空间做出决定，更新最新的待处理情侣空间邀请状态
      if (coupleSpaceAction && id && character) {
        // 从后往前找最新的待处理情侣空间邀请
        for (let i = currentMessages.length - 1; i >= 0; i--) {
          const msg = currentMessages[i]
          if (msg.messageType === 'couple_space_invite' && 
              msg.type === 'sent' && 
              msg.coupleSpaceInvite?.status === 'pending') {
            const updatedMessages = [...currentMessages]
            updatedMessages[i] = {
              ...updatedMessages[i],
              coupleSpaceInvite: {
                ...updatedMessages[i].coupleSpaceInvite!,
                status: coupleSpaceAction === 'accept' ? 'accepted' : 'rejected'
              }
            }
            
            // 如果AI接受，创建情侣空间关系
            if (coupleSpaceAction === 'accept') {
              const { acceptCoupleSpaceInvite } = await import('../utils/coupleSpaceUtils')
              const success = acceptCoupleSpaceInvite(id)
              console.log('💑 AI接受情侣空间邀请结果:', success ? '成功' : '失败')
              if (success) {
                console.log('✅ 情侣空间已激活，localStorage已更新')
              } else {
                console.error('❌ 情侣空间激活失败，请检查邀请记录')
              }
            }
            
            // 添加系统提示消息
            const systemMessage: Message = {
              id: Date.now(),
              type: 'system',
              content: coupleSpaceAction === 'accept' 
                ? `${character?.name || '对方'}接受了你的情侣空间邀请` 
                : `${character?.name || '对方'}拒绝了你的情侣空间邀请`,
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
        // 将字面的 \n 转换为真正的换行符（处理AI可能输出的 \\n）
        // 同时保留AI直接输出的真正换行符
        const normalizedResponse = cleanedResponse.replace(/\\n/g, '\n')
        const responseLines = normalizedResponse.trim().split('\n').filter(line => line.trim())
        
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
          
          // 如果处理后文字内容为空，跳过这条消息
          if (!textContent || !textContent.trim()) {
            console.log('⚠️ 文字内容为空，跳过消息')
          } else {
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
          
          // 添加网名、签名和备注的系统提示
          if (nicknameSystemMessage) {
            newMessages.push(nicknameSystemMessage)
            console.log('✅ 添加网名系统提示到消息列表')
          }
          if (signatureSystemMessage) {
            newMessages.push(signatureSystemMessage)
            console.log('✅ 添加签名系统提示到消息列表')
          }
          if (remarkSystemMessage) {
            newMessages.push(remarkSystemMessage)
            console.log('✅ 添加备注系统提示到消息列表')
          }
          
          newMessages.push(aiMessage)
          safeSetMessages(newMessages)
          
          // 增加AI回复计数（用于未读消息）
          aiRepliedCountRef.current++
          }
        } else {
          // 多行回复前，先添加网名、签名和备注的系统提示
          if (nicknameSystemMessage) {
            newMessages.push(nicknameSystemMessage)
            console.log('✅ 添加网名系统提示到消息列表（多行回复）')
          }
          if (signatureSystemMessage) {
            newMessages.push(signatureSystemMessage)
            console.log('✅ 添加签名系统提示到消息列表（多行回复）')
          }
          if (remarkSystemMessage) {
            newMessages.push(remarkSystemMessage)
            console.log('✅ 添加备注系统提示到消息列表（多行回复）')
          }
          
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
            
            // 如果处理后文字内容为空，跳过这条消息
            if (!textContent || !textContent.trim()) {
              console.log(`⚠️ 多行消息第${i+1}条内容为空，跳过`)
              continue
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
            safeSetMessages(newMessages)
            aiRepliedCountRef.current++ // 增加AI回复计数
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
            safeSetMessages(newMessages)
            aiRepliedCountRef.current++ // 增加AI回复计数
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
        safeSetMessages(newMessages)
        aiRepliedCountRef.current++ // 增加AI回复计数
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
        safeSetMessages(newMessages)
        aiRepliedCountRef.current++ // 增加AI回复计数
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
        safeSetMessages(newMessages)
        aiRepliedCountRef.current++ // 增加AI回复计数
        console.log('📸 AI发送了照片，描述:', aiPhotoDescription)
      }
      
      // 如果AI分享了小红书
      if (aiXiaohongshuKeyword) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
        
        try {
          // 动态导入小红书API
          const { getXiaohongshuForAI } = await import('../utils/xiaohongshuApi')
          
          // 获取小红书笔记
          const keywords = aiXiaohongshuKeyword.split(/[,，\s]+/).filter(k => k.trim())
          const note = await getXiaohongshuForAI(keywords)
          
          if (note) {
            const xiaohongshuMessage: Message = {
              id: Date.now(),
              type: 'received',
              content: '',
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: Date.now(),
              messageType: 'xiaohongshu',
              xiaohongshuNote: note,
              blocked: isAiBlocked
            }
            
            newMessages = [...newMessages, xiaohongshuMessage]
            safeSetMessages(newMessages)
            aiRepliedCountRef.current++ // 增加AI回复计数
            console.log('📕 AI发送了小红书笔记:', note.title)
          } else {
            console.warn('⚠️ 未找到相关小红书笔记')
          }
        } catch (error) {
          console.error('❌ 获取小红书笔记失败:', error)
        }
      }
      
      // 🎨 如果AI要生成图片（包装成小红书）
      if (aiGenerateImageData) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
        
        try {
          console.log('🎨 调用AI生图API...')
          const response = await fetch('/.netlify/functions/generate-xhs-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiGenerateImageData)
          })
          
          if (response.ok) {
            const { note } = await response.json()
            
            const xiaohongshuMessage: Message = {
              id: Date.now(),
              type: 'received',
              content: '',
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: Date.now(),
              messageType: 'xiaohongshu',
              xiaohongshuNote: note,
              blocked: isAiBlocked
            }
            
            newMessages = [...newMessages, xiaohongshuMessage]
            safeSetMessages(newMessages)
            aiRepliedCountRef.current++ // 增加AI回复计数
            console.log('🎨 AI生成图片成功:', note.title)
          } else {
            console.error('❌ AI生图失败:', response.status)
          }
        } catch (error) {
          console.error('❌ AI生图异常:', error)
        }
      }
      
      // 如果AI发送了一起听邀请
      if (aiMusicInviteData) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500))
        
        const musicInviteMessage: Message = {
          id: Date.now(),
          type: 'received',
          content: '',
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'musicInvite',
          musicInvite: {
            songTitle: aiMusicInviteData.songTitle,
            songArtist: aiMusicInviteData.songArtist,
            inviterName: character?.name || 'AI',
            status: 'pending'
          },
          blocked: isAiBlocked
        }
        
        newMessages = [...newMessages, musicInviteMessage]
        safeSetMessages(newMessages)
        aiRepliedCountRef.current++ // 增加AI回复计数
        console.log('🎵 AI发送了一起听邀请:', aiMusicInviteData.songTitle, '-', aiMusicInviteData.songArtist)
      }
      
      // 如果AI发了红包
      if (aiRedEnvelopeData && id) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 稍微延迟一下
        
        // 🔥 尝试使用用户给AI开通的亲密付额度
        const intimatePaySuccess = useCharacterIntimatePay(id, aiRedEnvelopeData.amount, `红包：${aiRedEnvelopeData.blessing}`)
        
        if (intimatePaySuccess) {
          console.log('💝 AI使用了用户的亲密付额度发红包')
        }
        
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
        safeSetMessages(newMessages)
        aiRepliedCountRef.current++ // 增加AI回复计数
        console.log('🧧 AI红包卡片已添加')
      }
      // 如果AI发起了转账
      if (aiTransferData) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 稍微延迟一下
        
        // 🔥 尝试使用用户给AI开通的亲密付额度
        const intimatePaySuccess = useCharacterIntimatePay(id!, aiTransferData.amount, `转账：${aiTransferData.message}`)
        
        if (intimatePaySuccess) {
          console.log('💝 AI使用了用户的亲密付额度发转账')
        }
        
        const now = Date.now()
        const aiTransferMessage: Message = {
          id: now,
          type: 'received',  // 消息类型：用户收到的消息（AI发的）
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
        safeSetMessages(newMessages)
        aiRepliedCountRef.current++ // 增加AI回复计数
        console.log('💸 AI转账卡片已添加')
      }
      
      // 🛒 如果AI要消费（使用亲密付额度）
      if (aiConsumeData && id) {
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const { platform, item, amount } = aiConsumeData
        
        // 尝试使用亲密付额度
        const success = useCharacterIntimatePay(id, amount, `${platform}-${item}`)
        
        if (success) {
          console.log(`🛒 AI消费成功: ${platform}-${item} ¥${amount}`)
          // 添加系统消息（可选，让用户看到消费记录）
          const systemMsg: Message = {
            id: Date.now() + Math.random(),
            type: 'system',
            content: `使用亲密付消费：${platform} - ${item}（¥${amount.toFixed(2)}）`,
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            timestamp: Date.now(),
            messageType: 'system',
            isHidden: false  // 用户可以在聊天记录里看到
          }
          newMessages = [...newMessages, systemMsg]
          safeSetMessages(newMessages)
        } else {
          console.warn('🛒 AI消费失败：亲密付额度不足')
          // 可以选择告诉AI额度不足
        }
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
        safeSetMessages(newMessages)
        aiRepliedCountRef.current++ // 增加AI回复计数
        console.log('💝 AI亲密付卡片已添加')
      }
      
      // 如果AI要发送情侣空间邀请
      if (aiCoupleSpaceInvite && id && character) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 稍微延迟一下
        
        // 检查用户是否已有活跃的情侣空间
        const { getCoupleSpaceRelation } = await import('../utils/coupleSpaceUtils')
        const existingRelation = getCoupleSpaceRelation()
        
        if (existingRelation && (existingRelation.status === 'pending' || existingRelation.status === 'active')) {
          // 用户已有情侣空间，发送系统提示消息
          console.warn('⚠️ AI想发送情侣空间邀请，但用户已有活跃的情侣空间')
          const now = Date.now()
          const systemMessage: Message = {
            id: now,
            type: 'system',
            content: '对方已经建立情侣空间，无法邀请',
            time: new Date().toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            timestamp: now,
            messageType: 'system',
            isHidden: false
          }
          newMessages = [...newMessages, systemMessage]
          safeSetMessages(newMessages)
        } else {
          // 创建情侣空间邀请记录到localStorage
          // 注意：关系记录的是用户和角色之间的关系，不区分谁发送邀请
          const { createCoupleSpaceInvite } = await import('../utils/coupleSpaceUtils')
          const relation = createCoupleSpaceInvite(
            'current_user', // 用户ID
            id, // 角色ID
            character.name,
            character.avatar
          )
          
          if (relation) {
            const now = Date.now()
            const aiCoupleSpaceMessage: Message = {
              id: now,
              type: 'received',
              content: '',
              time: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              timestamp: now,
              messageType: 'couple_space_invite',
              coupleSpaceInvite: {
                inviterId: character.id,
                inviterName: character.name,
                status: 'pending'
              },
              blocked: isAiBlocked
            }
            newMessages = [...newMessages, aiCoupleSpaceMessage]
            safeSetMessages(newMessages)
            aiRepliedCountRef.current++ // 增加AI回复计数
            console.log('💑 AI情侣空间邀请卡片已添加，localStorage记录已创建')
          } else {
            console.warn('⚠️ AI情侣空间邀请失败：已有活跃的情侣空间')
          }
        }
      }
      
      // 保存情侣空间内容到数据库
      // 只有在情侣空间已激活时才能保存内容
      if (id && character && (albumDescription || coupleMessage || anniversaryData)) {
        const { hasActiveCoupleSpace } = await import('../utils/coupleSpaceUtils')
        const isActive = hasActiveCoupleSpace(id)
        
        if (isActive) {
          const { addCouplePhoto, addCoupleMessage, addCoupleAnniversary } = await import('../utils/coupleSpaceContentUtils')
          
          // 保存相册照片
          if (albumDescription) {
            try {
              addCouplePhoto(character.id, character.name, albumDescription)
              console.log('📸 相册照片已保存')
              
              // 添加系统消息
              const systemMsg: Message = {
                id: Date.now() + Math.random(),
                type: 'system',
                content: `在情侣空间相册中添加了照片：${albumDescription}`,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                messageType: 'system',
                isHidden: false
              }
              setMessages(prev => [...prev, systemMsg])
            } catch (error) {
              console.error('保存相册照片失败:', error)
            }
          }
          
          // 保存留言
          if (coupleMessage) {
            try {
              addCoupleMessage(character.id, character.name, coupleMessage)
              console.log('💌 留言已保存')
              
              // 添加系统消息
              const systemMsg: Message = {
                id: Date.now() + Math.random(),
                type: 'system',
                content: `在情侣空间留言：${coupleMessage}`,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                messageType: 'system',
                isHidden: false
              }
              setMessages(prev => [...prev, systemMsg])
            } catch (error) {
              console.error('保存留言失败:', error)
            }
          }
          
          // 保存纪念日
          if (anniversaryData) {
            try {
              addCoupleAnniversary(
                character.id, 
                character.name, 
                anniversaryData.date, 
                anniversaryData.title, 
                anniversaryData.description
              )
              console.log('🎂 纪念日已保存')
              
              // 添加系统消息
              const systemMsg: Message = {
                id: Date.now() + Math.random(),
                type: 'system',
                content: `在情侣空间添加了纪念日：${anniversaryData.title}（${anniversaryData.date}）`,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                messageType: 'system',
                isHidden: false
              }
              setMessages(prev => [...prev, systemMsg])
            } catch (error) {
              console.error('保存纪念日失败:', error)
            }
          }
        } else {
          console.warn('⚠️ 情侣空间未激活，无法保存内容')
        }
      }
      
      // 💭 提取记忆和生成总结（根据用户设置的间隔提取）
      // 改为后台静默执行，不阻塞UI
      (() => {
        try {
          // 获取用户设置的总结间隔（默认 30 轮）
          const summaryInterval = parseInt(localStorage.getItem(`memory_summary_interval_${id}`) || '30')
          
          // 计算对话轮数（用户消息 + AI 回复 = 1 轮）
          const conversationRounds = Math.floor(newMessages.filter(m => m.type === 'sent' || m.type === 'received').length / 2)
          
          // 每 N 轮对话提取一次记忆并生成总结
          if (conversationRounds % summaryInterval === 0 && conversationRounds > 0) {
            console.log(`💭 后台开始提取记忆...（第 ${conversationRounds} 轮对话）`)
            
            // 获取最近 N 轮对话的内容
            const recentUserMessages = currentMessages.filter(m => m.type === 'sent').slice(-summaryInterval)
            const recentAiMessages = newMessages.filter(m => m.type === 'received').slice(-summaryInterval)
            
            if (recentUserMessages.length > 0 && recentAiMessages.length > 0) {
              // 合并最近的对话内容（包含图片识别结果）
              const userContent = recentUserMessages.map(m => {
                // 如果是图片消息，查找对应的AI回复来获取图片内容
                if (m.messageType === 'image' && m.imageUrl) {
                  // 找到这条图片消息后AI的第一个回复
                  const messageIndex = currentMessages.findIndex(msg => msg.id === m.id)
                  if (messageIndex !== -1 && messageIndex + 1 < currentMessages.length) {
                    const aiReplyAfterImage = currentMessages[messageIndex + 1]
                    if (aiReplyAfterImage && aiReplyAfterImage.type === 'received') {
                      // AI的回复中应该包含了对图片的描述
                      return `用户发送了图片，图片相关内容：${aiReplyAfterImage.content}`
                    }
                  }
                  return '用户发送了图片'
                }
                return m.content || m.emojiDescription || m.photoDescription || m.voiceText || ''
              }).join('\n')
              
              const aiContent = recentAiMessages.map(m => 
                m.content || m.emojiDescription || m.photoDescription || m.voiceText || ''
              ).join('\n')
              
              // 在后台异步执行，不等待完成
              memorySystem.extractMemories(userContent, aiContent).then(result => {
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
              }).catch(error => {
                console.error('❌ 记忆提取失败:', error)
              })
            }
          } else {
            console.log(`💭 跳过记忆提取（等待第 ${Math.ceil(conversationRounds / summaryInterval) * summaryInterval} 轮对话）`)
          }
        } catch (error) {
          console.error('❌ 记忆提取初始化失败:', error)
        }
      })()
      
      // 📔 如果AI要写日记，触发写日记功能
      if (shouldWriteDiary && id && character) {
        console.log('📔 AI决定写日记，后台触发日记生成...')
        console.log('📝 日记参数:', { characterId: id, characterName: character.name })
        
        // 保存变量副本，防止异步执行时丢失
        const characterId = id
        const characterName = character.name
        const characterDesc = character.description || ''
        const messagesSnapshot = [...newMessages]
        
        // 在后台静默执行，不阻塞UI
        setTimeout(async () => {
          try {
            console.log('🔄 开始异步生成日记...')
            const { generateDiary, saveDiary, getDiaries } = await import('../utils/diarySystem')
            console.log('📦 日记模块已加载')
            
            // 获取之前的日记（最近3篇）
            const previousDiaries = getDiaries(characterId).slice(0, 3)
            console.log(`📚 已获取${previousDiaries.length}篇历史日记`)
            
            // 获取当前状态
            const currentStatus = {
              mood: '',
              weather: ''
            }
            
            console.log('🎬 开始调用generateDiary...')
            // 生成日记
            const diary = await generateDiary(
              characterId,
              characterName,
              characterDesc,
              messagesSnapshot,
              currentStatus,
              previousDiaries
            )
            
            console.log('📝 日记生成结果:', diary ? '成功' : '失败')
            
            if (diary) {
              console.log('💾 保存日记到localStorage...')
              saveDiary(characterId, diary)
              console.log('✅ AI日记已生成并保存到日记本')
              const diaryPreview = diary.content.length > 50 ? diary.content.substring(0, 50) + '...' : diary.content
              console.log('📔 日记内容预览:', diaryPreview)
              
              // 添加系统提示消息到聊天记录
              const currentDate = new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
              
              // 提取日记的前几个字作为预览（去掉照片标记）
              const contentPreview = diary.content.replace(/\[照片:.*?\]/g, '').trim().substring(0, 15)
              const messagePreview = contentPreview + (diary.content.length > 15 ? '...' : '')
              
              const systemMessage: Message = {
                id: Date.now() + Math.random(),
                type: 'system',
                content: `📔 你在情侣空间日记本写了一篇日记：${messagePreview}（${currentDate}）`,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                messageType: 'system',
                isHidden: false
              }
              
              // 更新消息列表
              setMessages(prev => [...prev, systemMessage])
              
              // 同步到 localStorage
              const chatMessages = localStorage.getItem(`chat_messages_${characterId}`)
              const messages = chatMessages ? JSON.parse(chatMessages) : []
              messages.push(systemMessage)
              localStorage.setItem(`chat_messages_${characterId}`, JSON.stringify(messages))
              
              console.log('💬 系统提示已添加到聊天记录')
            } else {
              console.log('⏸️ AI今天不想写日记（返回null）')
            }
          } catch (error) {
            console.error('❌ AI写日记失败:', error)
            console.error('错误详情:', error instanceof Error ? error.message : String(error))
          }
        }, 1000) // 延迟1秒后触发，确保消息已经显示
      } else {
        if (shouldWriteDiary) {
          console.warn('⚠️ AI想写日记但缺少必要信息:', { 
            shouldWriteDiary, 
            hasId: !!id, 
            hasCharacter: !!character 
          })
        }
      }
      
      // 如果AI要撤回消息
      if (shouldRecallLastMessage || recallMessageId) {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        let targetMessage: { msg: Message; idx: number } | undefined
        
        if (recallMessageId) {
          // 撤回指定ID的消息
          const messageIndex = newMessages.findIndex(msg => msg.id === recallMessageId && msg.type === 'received')
          if (messageIndex !== -1) {
            targetMessage = { msg: newMessages[messageIndex], idx: messageIndex }
            console.log('🎯 找到要撤回的消息ID:', recallMessageId)
          } else {
            console.log('⚠️ 未找到消息ID:', recallMessageId)
          }
        } else {
          // 撤回上一条消息
          targetMessage = newMessages.map((msg, idx) => ({ msg, idx }))
            .reverse()
            .find(({ msg }) => msg.type === 'received' && msg.messageType !== 'system')
        }
        
        if (targetMessage) {
          const { msg, idx } = targetMessage
          
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
              originalType: msg.type as 'received' | 'sent', // 保存原始消息类型，用于判断撤回者
              content: `${character?.name || 'AI'}撤回了一条消息`,
              type: 'system' as const,
              messageType: 'system' as const
            }
            
            safeSetMessages([...newMessages])
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
      safeSetMessages([...currentMessages, errorMessage])
    } finally {
      setIsAiTyping(false)
      
      // 标记AI回复完成
      if (id) {
        markAIReplyComplete(id)
        
        // 如果组件已卸载（用户切换到其他聊天），保存所有消息到localStorage并增加未读
        if (!isMountedRef.current) {
          console.log('📦 组件已卸载，保存最终消息状态到 localStorage')
          const savedMessages = localStorage.getItem(`chat_messages_${id}`)
          if (savedMessages) {
            try {
              // 重新读取最新的消息（可能在AI回复过程中已经被修改）
              const latestMessages = JSON.parse(savedMessages) as Message[]
              localStorage.setItem(`chat_messages_${id}`, JSON.stringify(latestMessages))
              
              // 增加未读消息数
              if (aiRepliedCountRef.current > 0) {
                incrementUnread(id, aiRepliedCountRef.current)
                console.log('📬 切换聊天后AI回复完成，新增未读消息:', aiRepliedCountRef.current)
              }
            } catch (e) {
              console.error('保存消息失败:', e)
            }
          }
        }
        // 如果组件还在但页面不可见（用户切到其他标签页），也增加未读消息数
        else if (!isPageVisibleRef.current && aiRepliedCountRef.current > 0) {
          incrementUnread(id, aiRepliedCountRef.current)
          console.log('📬 后台AI回复完成，新增未读消息:', aiRepliedCountRef.current)
        }
        
        // 重置AI回复计数
        aiRepliedCountRef.current = 0
      }
      
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
        {/* 顶部：StatusBar + 导航栏一体化 */}
        <div className={`sticky top-0 z-50 ${background ? 'glass-dark' : 'glass-effect'}`}>
          {showStatusBar && <StatusBar />}
          <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="ios-button text-gray-700 hover:text-gray-900 -ml-2"
        >
          <BackIcon size={24} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-gray-900">
            {isAiTyping ? '正在输入...' : (character?.nickname || character?.name || '聊天')}
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
          {/* Token 计数器 */}
          {tokenStats.total > 0 && (
            <button
              onClick={() => setShowTokenDetail(!showTokenDetail)}
              className="text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 ios-button"
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span className="font-medium">{formatTokenCount(tokenStats.total)}</span>
              {responseTime > 0 && (
                <span className="text-[9px] opacity-70">·{(responseTime/1000).toFixed(1)}s</span>
              )}
            </button>
          )}
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
        </div>
        
        {/* Token 详情面板 */}
        {showTokenDetail && tokenStats.total > 0 && (
          <div className="glass-card mx-4 mt-2 p-3 rounded-xl transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-700">本次请求统计</span>
              <button 
                onClick={() => setShowTokenDetail(false)}
                className="text-gray-400 hover:text-gray-600 ios-button"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {/* 响应时间 */}
              {responseTime > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">响应时间</span>
                  <span className="font-semibold text-blue-600">{(responseTime/1000).toFixed(2)} 秒</span>
                </div>
              )}
              
              {/* Token 使用 */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-gray-600 font-medium">本次 Token 使用</span>
                  <span className="font-semibold text-blue-600">{tokenStats.total.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">系统提示</span>
                  <span className="text-gray-700">{tokenStats.systemPrompt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">世界书</span>
                  <span className="text-gray-700">{tokenStats.lorebook.toLocaleString()}</span>
                </div>
                {lorebookEntries.length > 0 && (
                  <div className="ml-4 space-y-0.5 mt-1">
                    {lorebookEntries.map((entry, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className="text-gray-400 truncate max-w-[150px]" title={entry.name}>· {entry.name}</span>
                        <span className="text-gray-500">{entry.tokens}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">消息历史</span>
                  <span className="text-gray-700">{tokenStats.messages.toLocaleString()}</span>
                </div>
              </div>
              
              {/* 上下文信息 */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">上下文限制</span>
                  <span className="text-gray-600">{(tokenStats.total + tokenStats.remaining).toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500">使用比例</span>
                  <span className="text-gray-600">{tokenStats.percentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* 聊天消息区域 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto hide-scrollbar px-4 py-4">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p className="text-gray-400 text-base">开始聊天吧</p>
          </div>
        ) : (
           <>
             {/* 加载更多提示 */}
             {displayCount < messages.length && (
               <div className="text-center py-2 text-xs text-gray-400">
                 {isLoadingMore ? '加载中...' : '向上滑动加载更多'}
               </div>
             )}
             
             {messages.slice(-displayCount).map((message, index, displayedMessages) => {
               const actualIndex = messages.length - displayCount + index
               const prevMessage = actualIndex > 0 ? messages[actualIndex - 1] : null
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
                                           <div className={`max-w-[75%] px-1.5 py-0.5 rounded-md text-[10px] ${
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
                        className={`bg-gray-200/80 px-3 py-1.5 rounded-md ${message.isRecalled || message.avatarPrompt ? 'cursor-pointer hover:bg-gray-300/80 transition-colors' : ''}`}
                        onClick={() => {
                          if (message.isRecalled && message.recalledContent) {
                            setViewingRecalledMessage(message)
                          } else if (message.avatarPrompt) {
                            // 简单翻译关键词
                            const translations: Record<string, string> = {
                              'portrait avatar of': '头像：',
                              'centered composition': '居中构图',
                              'profile picture style': '头像风格',
                              'high quality': '高质量',
                              'detailed': '精细',
                              'professional digital art': '专业数字艺术',
                              'cute': '可爱的',
                              'cat': '猫',
                              'dog': '狗',
                              'girl': '女孩',
                              'boy': '男孩',
                              'anime': '动漫',
                              'realistic': '真实的',
                              'photo': '照片',
                              'pink hair': '粉色头发',
                              'mother and child': '母子',
                              'baby': '宝宝',
                              'robot': '机器人',
                              'cool': '酷的',
                              'elegant': '优雅的'
                            }
                            
                            let translated = message.avatarPrompt
                            for (const [en, cn] of Object.entries(translations)) {
                              translated = translated.replace(new RegExp(en, 'gi'), cn)
                            }
                            
                            alert(`AI使用的提示词：\n\n原文：\n${message.avatarPrompt}\n\n中文翻译：\n${translated}`)
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
                    className={`flex message-container ${
                      message.type === 'sent' ? 'justify-end sent' : 'justify-start received'
                    }`}
                   >
                   {/* 对方消息：头像在左，气泡在右 */}
                   {message.type === 'received' && (
                     <div className="flex flex-col items-center mr-2">
                       <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                         {isCharacterCustomAvatar ? (
                           <img src={characterAvatar} alt="角色头像" className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-lg">{characterAvatar || '🤖'}</span>
                         )}
                       </div>
                       {message.timestamp && (
                         <span className="text-[9px] text-gray-400 mt-0.5">{message.time}</span>
                       )}
                     </div>
                   )}
                 
                 {/* 消息气泡 */}
                <div className="flex items-center gap-1">
                <div 
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
                           coverImage={redEnvelopeCover}
                           iconImage={redEnvelopeIcon}
                         />
                       ) : null
                     })()
                   ) : message.messageType === 'photo' && message.photoDescription ? (
                     <FlipPhotoCard 
                       description={message.photoDescription}
                       messageId={message.id}
                     />
                   ) : message.messageType === 'voice' && message.voiceText ? (
                     <div className="flex flex-col gap-2" style={{ width: '160px' }}>
                       <div 
                         className="message-bubble"
                         style={{
                           backgroundColor: message.type === 'sent' ? userBubbleColor : aiBubbleColor,
                           borderRadius: '16px',
                           padding: '12px',
                           boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                           width: '160px',
                           transition: 'all 0.2s',
                           border: message.type === 'sent' ? 'none' : '1px solid #e5e7eb'
                         }}
                       >
                         <div className="flex items-center gap-3">
                           {/* 播放按钮 */}
                           <button 
                             className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                               message.type === 'sent' ? 'bg-white/20 hover:bg-white/30' : 'bg-green-500 hover:bg-green-600'
                             }`}
                             onClick={(e) => {
                               e.stopPropagation()
                               const duration = Math.min(Math.max(Math.ceil((message.voiceText || '').length / 5), 1), 60)
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
                             {Math.min(Math.max(Math.ceil((message.voiceText || '').length / 5), 1), 60)}"
                           </div>
                         </div>
                       </div>
                       
                       {/* 转文字显示 */}
                       {showVoiceTextMap[message.id] && (
                         <div 
                           className={`px-3 py-2 rounded-xl text-sm ${
                             message.type === 'sent' 
                               ? 'bg-white/10 text-gray-700' 
                               : 'bg-gray-100 text-gray-700'
                           }`}
                           style={{ 
                             width: '160px',
                             wordWrap: 'break-word',
                             overflowWrap: 'break-word'
                           }}
                         >
                           <div className="text-xs text-gray-500 mb-1">转文字：</div>
                           {message.voiceText}
                         </div>
                       )}
                     </div>
                   ) : message.messageType === 'location' && message.location ? (
                    <div 
                      className="glass-card rounded-2xl overflow-hidden shadow-lg w-[220px] cursor-pointer hover:shadow-xl transition-shadow"
                      onClick={() => handleViewLocation(message)}
                    >
                      {/* 地图缩略图 */}
                      <div className="h-24 bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
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
                          <svg className="w-7 h-7 text-red-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* 位置信息 */}
                      <div className="p-2.5 h-[66px] bg-white/90 backdrop-blur-sm">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
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
                    <div className="rounded-2xl overflow-hidden shadow-lg max-w-[120px]">
                      <img 
                        src={message.emojiUrl} 
                        alt={message.emojiDescription || '表情包'} 
                        className="w-full h-auto"
                      />
                    </div>
                  ) : message.messageType === 'xiaohongshu' && message.xiaohongshuNote ? (
                    <XiaohongshuCard
                      note={message.xiaohongshuNote}
                      onClick={() => {
                        // 打开小红书链接
                        window.open(message.xiaohongshuNote!.url, '_blank')
                      }}
                    />
                  ) : message.messageType === 'image' && message.imageUrl ? (
                    <div className="rounded-2xl overflow-hidden shadow-lg max-w-[180px]">
                      <img 
                        src={message.imageUrl} 
                        alt="上传的图片" 
                        className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          // 点击放大图片
                          const win = window.open('', '_blank')
                          if (win) {
                            win.document.write(`<img src="${message.imageUrl}" style="max-width:100%;max-height:100vh;margin:auto;display:block;">`)
                          }
                        }}
                      />
                    </div>
                  ) : message.messageType === 'musicInvite' && message.musicInvite ? (
                    /* 一起听邀请卡片 */
                    <div style={{ maxWidth: '280px', display: 'inline-block' }}>
                      <MusicInviteCard
                        inviterName={message.musicInvite.inviterName}
                        songTitle={message.musicInvite.songTitle}
                        songArtist={message.musicInvite.songArtist}
                        songCover={message.musicInvite.songCover}
                        status={message.musicInvite.status}
                        onAccept={() => {
                          // 接受邀请
                          setMessages(prev => prev.map(msg => 
                            msg.id === message.id 
                              ? { ...msg, musicInvite: { ...msg.musicInvite!, status: 'accepted' } }
                              : msg
                          ))
                          // 保存更新后的消息
                          setTimeout(() => {
                            const updatedMessages = messages.map(msg => 
                              msg.id === message.id 
                                ? { ...msg, musicInvite: { ...msg.musicInvite!, status: 'accepted' } }
                                : msg
                            )
                            safeSetItem(`chat_${id}`, JSON.stringify(updatedMessages))
                          }, 100)
                          // 跳转到一起听聊天
                          navigate('/music-together-chat')
                        }}
                        onReject={() => {
                          // 拒绝邀请
                          setMessages(prev => prev.map(msg => 
                            msg.id === message.id 
                              ? { ...msg, musicInvite: { ...msg.musicInvite!, status: 'rejected' } }
                              : msg
                          ))
                          // 保存更新后的消息
                          setTimeout(() => {
                            const updatedMessages = messages.map(msg => 
                              msg.id === message.id 
                                ? { ...msg, musicInvite: { ...msg.musicInvite!, status: 'rejected' } }
                                : msg
                            )
                            safeSetItem(`chat_${id}`, JSON.stringify(updatedMessages))
                          }, 100)
                        }}
                      />
                    </div>
                  ) : message.messageType === 'transfer' && message.transfer ? (
                     <div 
                       className="message-bubble glass-card rounded-2xl p-4 shadow-lg min-w-[200px]"
                       style={{
                         backgroundImage: transferCover ? `url(${transferCover})` : 'none',
                         backgroundSize: 'cover',
                         backgroundPosition: 'center',
                         position: 'relative',
                         overflow: 'visible'  // 让伪元素可以显示在外面
                       }}
                     >
                       <div className="flex items-center gap-3 mb-3">
                         <div 
                           className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden"
                           style={{
                             backgroundImage: transferIcon ? `url(${transferIcon})` : 'none',
                             backgroundSize: 'cover',
                             backgroundPosition: 'center'
                           }}
                         >
                           {!transferIcon && '¥'}
                         </div>
                         <div className="flex-1">
                          <div className="text-sm text-gray-900 font-medium">转账</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {(() => {
                              // 如果有备注（非空字符串），优先显示备注
                              if (message.transfer.message && message.transfer.message.trim()) {
                                return message.transfer.message
                              }
                              // 没有备注时，根据状态显示
                              if (message.transfer.status === 'pending') {
                                return message.type === 'sent' ? '你发起了一笔转账' : '对方发起了一笔转账'
                              } else if (message.transfer.status === 'received') {
                                return '已接收'
                              } else if (message.transfer.status === 'expired') {
                                return '已退还'
                              }
                              return '转账'
                            })()}
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
                   ) : message.messageType === 'couple_space_invite' && message.coupleSpaceInvite ? (
                    <div className="glass-card rounded-2xl p-4 shadow-lg min-w-[200px]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900 font-medium">情侣空间</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            邀请你加入情侣空间
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-3">
                        {message.coupleSpaceInvite.status === 'pending' ? (
                          <>
                            <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                              开启专属情侣空间，分享你们的美好时光
                            </div>
                            {message.type === 'received' ? (
                              <button 
                                onClick={async () => {
                                  // 更新消息状态为已接受
                                  setMessages(prev => prev.map(msg => 
                                    msg.id === message.id && msg.coupleSpaceInvite
                                      ? { ...msg, coupleSpaceInvite: { ...msg.coupleSpaceInvite, status: 'accepted' } }
                                      : msg
                                  ))
                                  
                                  // 接受情侣空间邀请，保存到localStorage
                                  if (id) {
                                    const { acceptCoupleSpaceInvite } = await import('../utils/coupleSpaceUtils')
                                    const success = acceptCoupleSpaceInvite(id)
                                    if (success) {
                                      alert('已接受情侣空间邀请！现在可以去情侣空间查看了')
                                    }
                                  }
                                }}
                                className="w-full px-4 py-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm rounded-full ios-button"
                              >
                                接受邀请
                              </button>
                            ) : message.type === 'sent' ? (
                              <div className="text-center">
                                <span className="text-xs text-gray-400">
                                  等待对方回应
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 text-center">
                                等待对方接受
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center">
                            <span className="text-xs text-gray-400">
                              {message.coupleSpaceInvite.status === 'accepted' 
                                ? (message.type === 'sent' ? '对方已接受' : '你已接受')
                                : (message.type === 'sent' ? '对方已拒绝' : '你已拒绝')}
                            </span>
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
                    <div style={{ maxWidth: '280px', display: 'inline-block', wordBreak: 'break-word' }}>
                       {/* 文字内容 */}
                       {message.content && (
                        <div
                          className="message-bubble px-3 py-2"
                          style={{
                            // 默认基础样式（会被 CSS 的 !important 覆盖）
                            backgroundColor: message.type === 'sent' ? userBubbleColor : (message.content.startsWith('[错误]') ? '#fee2e2' : aiBubbleColor),
                            borderRadius: '12px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap',
                            color: message.content.startsWith('[错误]') ? '#991b1b' : '#111827',
                            fontSize: '14px',
                            maxWidth: '100%',
                            overflowWrap: 'break-word'
                          }}
                        >
                           <div style={{ position: 'relative', zIndex: 2 }}>
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
                             <span style={{ position: 'relative', zIndex: 2 }}>{message.content}</span>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
                 
                 {/* 拉黑警告图标 - 与气泡垂直居中 */}
                {message.type === 'received' && message.blocked && (
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                )}
                
                   {/* 用户被AI拉黑时显示警告图标 */}
                   {message.type === 'sent' && message.blocked && (
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                )}
                 </div>
                   {/* 自己消息：气泡在左，头像在右 */}
                  {message.type === 'sent' && (
                    <div className="flex flex-col items-center ml-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                        {isUserCustomAvatar ? (
                          <img src={userAvatar} alt="我的头像" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                      {message.timestamp && (
                        <span className="text-[9px] text-gray-400 mt-0.5">{message.time}</span>
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
               <div className="flex mb-3 justify-start">
                 <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mr-2 shadow-md overflow-hidden">
                   {isCharacterCustomAvatar ? (
                     <img src={characterAvatar} alt="角色头像" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-lg">{characterAvatar || '🤖'}</span>
                   )}
                 </div>
                 <div className="glass-card px-3 py-2 rounded-xl rounded-tl-sm shadow-md">
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
          {hasInputText ? (
            <button
              onClick={handleSend}
              disabled={isAiTyping}
              className="w-10 h-10 flex items-center justify-center ios-button bg-wechat-green text-white rounded-full shadow-lg disabled:opacity-50 transition-all duration-200"
            >
              <SendIcon size={18} />
            </button>
          ) : (
            <button 
              onClick={handleAIReply}
              disabled={isAiTyping}
              className="w-10 h-10 flex items-center justify-center ios-button text-gray-700 disabled:opacity-50 transition-all duration-200"
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
          onClose={() => {
            console.log('🔍 菜单状态检查:', { 
              characterId: id, 
              hasCoupleSpaceActive,
              characterName: character?.name 
            })
            setShowMenu(false)
          }}
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
          onSelectCoupleSpaceInvite={() => {
            setShowMenu(false)
            setShowCoupleSpaceInviteSender(true)
          }}
          onSelectCoupleSpaceContent={handleOpenCoupleSpaceContent}
          onSelectLocation={handleSelectLocation}
          onSelectVoiceMessage={handleSelectVoice}
          onSelectXiaohongshu={handleSelectXiaohongshu}
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
          onRegenerateAI={() => {
            setShowMenu(false)
            // 找到最后一条AI消息
            const lastAIMessage = messages.slice().reverse().find(m => m.type === 'received')
            if (lastAIMessage) {
              handleRegenerateMessage(lastAIMessage.id)
            }
          }}
          hasCoupleSpace={hasCoupleSpaceActive}
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

      {/* 情侣空间邀请确认弹窗 */}
      {showCoupleSpaceInviteSender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCoupleSpaceInviteSender(false)}
          />
          <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-white/20">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">邀请加入情侣空间</h3>
              <p className="text-sm text-gray-600">
                邀请 {character?.name} 加入专属情侣空间<br/>
                共同记录美好时光
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCoupleSpaceInviteSender(false)}
                className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button"
              >
                取消
              </button>
              <button
                onClick={handleSendCoupleSpaceInvite}
                className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-medium ios-button shadow-lg"
              >
                发送邀请
              </button>
            </div>
          </div>
        </div>
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

      {/* 小红书选择器 */}
      {showXiaohongshuSelector && (
        <XiaohongshuSelector
          onClose={() => setShowXiaohongshuSelector(false)}
          onSelect={handleSendXiaohongshu}
        />
      )}

      {/* 小红书手动输入 */}
      {showXiaohongshuInput && (
        <XiaohongshuLinkInput
          onClose={() => setShowXiaohongshuInput(false)}
          onSubmit={handleSendXiaohongshu}
        />
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
          isAITyping={callAITyping}
          onEnd={() => {
            const now = new Date()
            
            // 保存通话记录到聊天历史
            if (callMessages.length > 0) {
              const callDuration = Math.floor((Date.now() - (callStartTime || Date.now())) / 1000)
              const mins = Math.floor(callDuration / 60)
              const secs = callDuration % 60
              const durationText = `${mins}:${secs.toString().padStart(2, '0')}`
              
              // 创建通话记录消息
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
            } else {
              // 没有通话内容，说明用户挂断了（已取消）
              const cancelledMsg: Message = {
                id: Date.now(),
                type: 'system',
                content: `已取消 ${isVideoCall ? '视频' : '语音'}通话`,
                time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }
              setMessages(prev => [...prev, cancelledMsg])
              
              // 添加隐藏消息让AI知道
              const aiNoticeMsg: Message = {
                id: Date.now() + 1,
                type: 'system',
                content: `用户向你发起了${isVideoCall ? '视频' : '语音'}通话，但在接通前取消了。`,
                time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now(),
                isHidden: true
              }
              setMessages(prev => [...prev, aiNoticeMsg])
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

      {/* 来电界面 */}
      {character && (
        <IncomingCallScreen
          show={showIncomingCall}
          character={{
            name: character.name,
            avatar: character.avatar
          }}
          isVideoCall={isVideoCall}
          onAccept={() => {
            // 接听电话，打开通话界面
            setShowIncomingCall(false)
            setCallStartTime(Date.now())
            setShowCallScreen(true)
          }}
          onReject={() => {
            // 挂断电话
            setShowIncomingCall(false)
            
            // 添加一条系统消息：已拒绝（显示给用户看）
            const now = new Date()
            const rejectedCallMsg: Message = {
              id: Date.now(),
              type: 'system',
              content: `已拒绝 ${isVideoCall ? '视频' : '语音'}通话`,
              time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              timestamp: Date.now()
            }
            setMessages(prev => [...prev, rejectedCallMsg])
            
            // 添加一条隐藏消息（让AI知道被拒绝了）
            const userName = currentUser?.nickname || currentUser?.name || '用户'
            const aiNoticeMsg: Message = {
              id: Date.now() + 1,
              type: 'system',
              content: `${userName}拒绝了你的${isVideoCall ? '视频' : '语音'}通话请求。`,
              time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
              timestamp: Date.now(),
              isHidden: true // 隐藏显示，但AI能看到
            }
            setMessages(prev => [...prev, aiNoticeMsg])
          }}
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

      {/* 情侣空间内容创建弹窗 */}
      {showCoupleSpaceContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowCoupleSpaceContentModal(false)
              setCoupleSpaceContentType(null)
            }}
          />
          <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 shadow-2xl border border-white/20 max-h-[80vh] overflow-y-auto">
            {!coupleSpaceContentType ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">选择创建内容</h3>
                <div className="space-y-3">
                  <button onClick={() => setCoupleSpaceContentType('photo')} className="w-full px-4 py-3 rounded-2xl glass-card border border-white/20 text-gray-900 font-medium ios-button">
                    上传照片
                  </button>
                  <button onClick={() => setCoupleSpaceContentType('message')} className="w-full px-4 py-3 rounded-2xl glass-card border border-white/20 text-gray-900 font-medium ios-button">
                    发布留言
                  </button>
                  <button onClick={() => setCoupleSpaceContentType('anniversary')} className="w-full px-4 py-3 rounded-2xl glass-card border border-white/20 text-gray-900 font-medium ios-button">
                    添加纪念日
                  </button>
                </div>
                <button onClick={() => setShowCoupleSpaceContentModal(false)} className="w-full px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button mt-4">取消</button>
              </>
            ) : coupleSpaceContentType === 'photo' ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">上传照片</h3>
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-2">选择照片（可选，可多选）</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={(e) => { 
                      const files = e.target.files
                      if (files && files.length > 0) {
                        const newFiles: string[] = []
                        Array.from(files).forEach((file, index) => {
                          const reader = new FileReader()
                          reader.onload = (evt) => {
                            newFiles.push(evt.target?.result as string)
                            if (newFiles.length === files.length) {
                              setCouplePhotoFiles(prev => [...prev, ...newFiles])
                            }
                          }
                          reader.readAsDataURL(file)
                        })
                      }
                    }} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" 
                  />
                  {couplePhotoFiles.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 mb-2">已选择 {couplePhotoFiles.length} 张照片</div>
                      <div className="grid grid-cols-3 gap-2">
                        {couplePhotoFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <img src={file} alt={`预览${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                            <button
                              onClick={() => setCouplePhotoFiles(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-700 mb-2">照片描述</label>
                  <textarea value={couplePhotoDescription} onChange={(e) => setCouplePhotoDescription(e.target.value)} placeholder="描述这张照片..." className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm" rows={3} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCoupleSpaceContentType(null)} className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button">返回</button>
                  <button onClick={handleSendCouplePhoto} className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button">上传</button>
                </div>
              </>
            ) : coupleSpaceContentType === 'message' ? (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">发布留言</h3>
                <textarea value={coupleMessageContent} onChange={(e) => setCoupleMessageContent(e.target.value)} placeholder="写下你想说的话..." className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none mb-4 text-sm" rows={5} />
                <div className="flex gap-3">
                  <button onClick={() => setCoupleSpaceContentType(null)} className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button">返回</button>
                  <button onClick={handleSendCoupleMessage} className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button">发布</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">添加纪念日</h3>
                <div className="space-y-3 mb-4">
                  <div><label className="block text-sm text-gray-700 mb-2">日期</label><input type="date" value={anniversaryDate} onChange={(e) => setAnniversaryDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
                  <div><label className="block text-sm text-gray-700 mb-2">标题</label><input type="text" value={anniversaryTitle} onChange={(e) => setAnniversaryTitle(e.target.value)} placeholder="例如：第一次见面" className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
                  <div><label className="block text-sm text-gray-700 mb-2">描述（可选）</label><textarea value={anniversaryDescription} onChange={(e) => setAnniversaryDescription(e.target.value)} placeholder="记录这个特殊的日子..." className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-none text-sm" rows={3} /></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setCoupleSpaceContentType(null)} className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button">返回</button>
                  <button onClick={handleSendAnniversary} className="flex-1 px-4 py-3 rounded-full glass-card border border-white/20 text-gray-900 font-medium ios-button">添加</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ChatDetail
