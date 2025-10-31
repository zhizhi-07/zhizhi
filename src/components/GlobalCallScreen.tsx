import { useCall } from '../context/CallContext'
import CallScreen from './CallScreen'
import { callAI } from '../utils/api'
import { useUser } from '../context/UserContext'

/**
 * 全局通话界面组件
 * 可以在任何页面显示和最小化
 */
const GlobalCallScreen = () => {
  const { callState, endCall, sendMessage: sendCallMessage, addAIMessage, addNarratorMessage, setAITyping } = useCall()
  const { currentUser } = useUser()

  if (!callState.isActive || !callState.character) {
    return null
  }

  const handleSendMessage = (message: string) => {
    sendCallMessage(message)
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

      const prompt = `你是 ${character.name}。
${character.profile || ''}

现在是${timeString}，你正在和${currentUser?.name || '用户'}${callType}。

你们的关系：${relationship}
当前好感度：${favorability}/100

最近的通话内容：
${recentChats || '（刚开始通话）'}

请自然地继续对话。注意：
1. 这是实时${callType}，要像真人一样自然交流
2. 可以表达情绪、语气、停顿
3. 如果是视频通话，可以描述你的表情、动作
4. 保持角色性格一致
5. 回复要简短自然，不要太长

只返回你说的话，不要加任何前缀或标记。如果需要描述动作或表情，用括号标注，如：(笑着说) 或 (认真地看着你)`

      const response = await callAI([{ role: 'user', content: prompt }])
      
      // 检查是否有旁白内容（括号内的描述）
      const narratorMatch = response.match(/^\((.+?)\)/)
      if (narratorMatch) {
        addNarratorMessage(narratorMatch[1])
        const cleanedResponse = response.replace(/^\(.+?\)\s*/, '').trim()
        if (cleanedResponse) {
          addAIMessage(cleanedResponse)
        }
      } else {
        addAIMessage(response)
      }
    } catch (error) {
      console.error('AI回复失败:', error)
      addAIMessage('抱歉，刚才没听清...')
    } finally {
      setAITyping(false)
    }
  }

  return (
    <CallScreen
      show={callState.isActive}
      character={callState.character}
      isVideoCall={callState.isVideoCall}
      onEnd={endCall}
      onSendMessage={handleSendMessage}
      onRequestAIReply={handleRequestAIReply}
      messages={callState.messages}
      isAITyping={callState.isAITyping}
    />
  )
}

export default GlobalCallScreen
