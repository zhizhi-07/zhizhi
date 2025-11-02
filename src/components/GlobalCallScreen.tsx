import { useCall } from '../context/CallContext'
import CallScreen from './CallScreen'
import { callAI } from '../utils/api'
import { useUser } from '../context/ContactsContext'
import { useEffect, useRef } from 'react'

/**
 * 全局通话界面组件
 * 可以在任何页面显示和最小化
 */
const GlobalCallScreen = () => {
  const { callState, endCall, sendMessage: sendCallMessage, addAIMessage, addNarratorMessage, setAITyping } = useCall()
  const { currentUser } = useUser()
  const hasInitiatedAIGreeting = useRef(false) // 防止重复触发

  const handleSendMessage = (message: string) => {
    sendCallMessage(message)
  }

  // 保存通话记录到聊天消息
  const handleSaveCallRecord = (messages: any[], duration: number, isVideo: boolean, characterId: string) => {
    console.log('💾 开始保存通话记录:', { characterId, duration, messageCount: messages.length })

    const callRecord = {
      id: Date.now(),
      type: 'system' as const,
      content: `${isVideo ? '视频' : '语音'}通话 ${Math.floor(duration / 60)}分${duration % 60}秒`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      isCallRecord: true,
      callDuration: duration,
      callMessages: messages,
      messageType: 'system' as const
    }

    // 获取当前聊天记录
    const savedMessages = localStorage.getItem(`chat_messages_${characterId}`)
    const currentMessages = savedMessages ? JSON.parse(savedMessages) : []
    
    // 添加通话记录
    const newMessages = [...currentMessages, callRecord]
    localStorage.setItem(`chat_messages_${characterId}`, JSON.stringify(newMessages))
    
    console.log('✅ 通话记录已保存到聊天消息，共', newMessages.length, '条消息')
    
    // 触发自定义事件通知聊天页面刷新
    const event = new CustomEvent('callRecordSaved', { 
      detail: { characterId, messageCount: newMessages.length } 
    })
    window.dispatchEvent(event)
    console.log('📡 已发送 callRecordSaved 事件')
  }

  const handleRequestAIReply = async () => {
    setAITyping(true)

    try {
      const now = new Date()
      const timeString = now.toLocaleString('zh-CN', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      const character = callState.character
      if (!character) return
      
      const relationship = character.relationship || '朋友'
      const favorability = character.favorability || 50
      const callType = callState.isVideoCall ? '视频通话' : '语音通话'

      // 获取最近5条消息作为上下文
      const recentMessages = callState.messages.slice(-5)
      const recentChats = recentMessages
        .map(m => {
          if (m.type === 'user') return `${currentUser?.name || '用户'}: ${m.content}`
          if (m.type === 'ai') return `${character.name}: ${m.content}`
          if (m.type === 'narrator') return `[${m.content}]`
          return ''
        })
        .join('\n')

      // 判断是否是AI主动打来的第一句话
      const isFirstGreeting = callState.isAIInitiated && callState.messages.length === 0
      
      const prompt = `你是 ${character.name}。
${character.profile || ''}

现在是${timeString}，你正在和${currentUser?.name || '用户'}${callType}。

你们的关系：${relationship}
当前好感度：${favorability}/100

${isFirstGreeting ? '**情况说明**：是你主动打电话给对方的，对方刚接通电话。请说开场白，告诉TA你为什么打电话来。' : `最近的通话内容：
${recentChats || '（刚开始通话）'}`}

请自然地继续对话。注意：
1. 这是实时${callType}，要像真人一样自然交流，**分段回复**让对话更真实
2. 将你的回复分成多个片段，每个片段用 ||| 分隔
3. 每个片段可以是：
   - 简短的话语（如："嗯..."、"就是..."、"我觉得..."）
   - 旁白描述（只在必要时用括号，如：(沉默了几秒)、(叹了口气)）
   - 完整的句子
4. **重要**：不要每句话都加旁白，只在关键时刻加旁白（停顿、情绪变化等）
5. 如果是视频通话，可以描述表情、动作
6. 保持角色性格一致

**示例格式：**
嗯...|||就是...|||（停顿了一下）|||我想说的是...|||其实挺想你的

只返回分段内容，用|||分隔每一段，不要加任何其他前缀或说明。`

      const response = await callAI([{ role: 'user', content: prompt }])
      
      // 将回复按|||分割成多个片段
      const segments = response.split('|||').map(s => s.trim()).filter(s => s.length > 0)
      
      // 逐条添加消息，每条之间有延迟
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i]
        
        // 添加延迟，模拟真人说话的节奏
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 800)) // 0.8-1.6秒随机延迟
        }
        
        // 检查是否是旁白（括号内容）
        const narratorMatch = segment.match(/^[\(（](.+?)[\)）]$/)
        if (narratorMatch) {
          addNarratorMessage(narratorMatch[1])
        } else {
          // 普通消息
          addAIMessage(segment)
        }
      }
    } catch (error) {
      console.error('AI回复失败:', error)
      addAIMessage('抱歉，刚才没听清...')
    } finally {
      setAITyping(false)
    }
  }

  // AI主动打电话时，自动说第一句话
  useEffect(() => {
    if (callState.isActive && callState.isAIInitiated && !hasInitiatedAIGreeting.current && callState.messages.length === 0) {
      hasInitiatedAIGreeting.current = true
      console.log('📞 AI主动打来电话，准备说第一句话...')
      
      // 延迟一下再让AI说话，模拟接通的感觉
      setTimeout(() => {
        handleRequestAIReply()
      }, 800)
    }
    
    // 当通话结束时重置标志
    if (!callState.isActive) {
      hasInitiatedAIGreeting.current = false
    }
  }, [callState.isActive, callState.isAIInitiated, callState.messages.length])

  if (!callState.isActive || !callState.character) {
    return null
  }

  return (
    <CallScreen
      show={callState.isActive}
      character={callState.character}
      isVideoCall={callState.isVideoCall}
      onEnd={() => endCall(handleSaveCallRecord)}
      onSendMessage={handleSendMessage}
      onRequestAIReply={handleRequestAIReply}
      messages={callState.messages}
      isAITyping={callState.isAITyping}
    />
  )
}

export default GlobalCallScreen
