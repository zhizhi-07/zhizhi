import { createContext, useContext, useState, ReactNode } from 'react'

interface CallMessage {
  id: number
  type: 'user' | 'ai' | 'narrator'
  content: string
  time: string
}

interface CallState {
  isActive: boolean
  isVideoCall: boolean
  isMinimized: boolean
  character: {
    id: string
    name: string
    avatar?: string
    profile?: string
    relationship?: string
    favorability?: number
  } | null
  messages: CallMessage[]
  isAITyping: boolean
  startTime?: number // 通话开始时间戳
  isAIInitiated?: boolean // 是否由AI主动发起
}

interface CallContextType {
  callState: CallState
  startCall: (character: CallState['character'], isVideo: boolean, isAIInitiated?: boolean) => void
  endCall: (onSaveRecord?: (messages: CallMessage[], duration: number, isVideo: boolean, characterId: string) => void) => void
  minimizeCall: () => void
  maximizeCall: () => void
  sendMessage: (message: string) => void
  addAIMessage: (message: string) => void
  addNarratorMessage: (message: string) => void
  setAITyping: (typing: boolean) => void
  getCallMessages: () => CallMessage[]
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isVideoCall: false,
    isMinimized: false,
    character: null,
    messages: [],
    isAITyping: false,
    startTime: undefined,
    isAIInitiated: false
  })

  const startCall = (character: CallState['character'], isVideo: boolean, isAIInitiated: boolean = false) => {
    console.log('📞 启动通话:', character?.name, isVideo ? '视频' : '语音', isAIInitiated ? '(AI主动)' : '(用户主动)')
    setCallState({
      isActive: true,
      isVideoCall: isVideo,
      isMinimized: false,
      character,
      messages: [],
      isAITyping: false,
      startTime: Date.now(),
      isAIInitiated
    })
  }

  const endCall = (onSaveRecord?: (messages: CallMessage[], duration: number, isVideo: boolean, characterId: string) => void) => {
    console.log('📞 结束通话')
    
    // 保存通话记录
    if (onSaveRecord && callState.character && callState.messages.length > 0 && callState.startTime) {
      const duration = Math.floor((Date.now() - callState.startTime) / 1000) // 秒
      console.log('💾 保存通话记录:', callState.messages.length, '条消息，时长:', duration, '秒')
      onSaveRecord(callState.messages, duration, callState.isVideoCall, callState.character.id)
    }
    
    setCallState({
      isActive: false,
      isVideoCall: false,
      isMinimized: false,
      character: null,
      messages: [],
      isAITyping: false,
      startTime: undefined,
      isAIInitiated: false
    })
  }

  const minimizeCall = () => {
    console.log('📞 最小化通话')
    setCallState(prev => ({ ...prev, isMinimized: true }))
  }

  const maximizeCall = () => {
    console.log('📞 最大化通话')
    setCallState(prev => ({ ...prev, isMinimized: false }))
  }

  const sendMessage = (message: string) => {
    const newMessage: CallMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setCallState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }))
  }

  const addAIMessage = (message: string) => {
    const newMessage: CallMessage = {
      id: Date.now(),
      type: 'ai',
      content: message,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setCallState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }))
  }

  const addNarratorMessage = (message: string) => {
    const newMessage: CallMessage = {
      id: Date.now(),
      type: 'narrator',
      content: message,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    setCallState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }))
  }

  const setAITyping = (typing: boolean) => {
    setCallState(prev => ({ ...prev, isAITyping: typing }))
  }

  const getCallMessages = () => {
    return callState.messages
  }

  return (
    <CallContext.Provider
      value={{
        callState,
        startCall,
        endCall,
        minimizeCall,
        maximizeCall,
        sendMessage,
        addAIMessage,
        addNarratorMessage,
        setAITyping,
        getCallMessages
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export const useCall = () => {
  const context = useContext(CallContext)
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider')
  }
  return context
}
