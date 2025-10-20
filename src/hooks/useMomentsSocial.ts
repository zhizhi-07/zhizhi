import { useEffect, useRef } from 'react'
import { useMoments } from '../context/MomentsContext'
import { useCharacter } from '../context/CharacterContext'
import { triggerAIReactToComment, aiInteractWithMomentSocial } from '../utils/aiMomentsSocial'

// 监听朋友圈评论变化和新朋友圈，触发AI互动
export const useMomentsSocial = () => {
  const { moments, likeMoment, addComment } = useMoments()
  const { characters } = useCharacter()
  const prevMomentsRef = useRef(moments)
  const processedMomentsRef = useRef(new Set<string>())
  const processedCommentsRef = useRef(new Set<string>()) // 记录已处理的评论
  const momentInteractionCountRef = useRef<{ [key: string]: number }>({}) // 记录每条朋友圈的互动轮数
  
  // 🚨 紧急停止开关：如果设置为true，完全停止AI互动
  const emergencyStop = localStorage.getItem('emergency_stop_ai_moments') === 'true'
  
  if (emergencyStop) {
    console.log('🚨 紧急停止：AI朋友圈功能已被禁用')
    return
  }

  // 获取聊天记录的辅助函数
  const getChatMessages = (characterId: string) => {
    const chatMessages = localStorage.getItem(`chat_messages_${characterId}`)
    return chatMessages 
      ? JSON.parse(chatMessages).slice(-10).map((msg: any) => ({
          role: msg.type === 'sent' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }))
      : []
  }

  useEffect(() => {
    const prevMoments = prevMomentsRef.current
    
    moments.forEach((currentMoment) => {
      const prevMoment = prevMoments.find(m => m.id === currentMoment.id)
      
      // 检测新朋友圈（AI发布的）
      if (!prevMoment && !processedMomentsRef.current.has(currentMoment.id)) {
        // 这是一条新朋友圈
        processedMomentsRef.current.add(currentMoment.id)
        
        // 如果是AI发布的，暂时不触发其他AI（避免复杂性）
        const isAIMoment = characters.some(c => c.id === currentMoment.userId)
        if (isAIMoment) {
          console.log(`📭 ${currentMoment.userName} 发布了新朋友圈（AI发布的朋友圈暂不触发其他AI）`)
        }
      }
      
      // 检测朋友圈评论的变化
      if (prevMoment && currentMoment.comments.length > prevMoment.comments.length) {
        // 有新评论
        const newComments = currentMoment.comments.slice(prevMoment.comments.length)
        
        newComments.forEach((newComment) => {
          // 生成评论的唯一ID，防止重复处理
          const commentKey = `${currentMoment.id}-${newComment.id}`
          if (processedCommentsRef.current.has(commentKey)) {
            console.log(`⏭️ 评论已处理过，跳过: ${commentKey}`)
            return
          }
          
          processedCommentsRef.current.add(commentKey)
          console.log(`🔔 检测到新评论: ${newComment.userName} 在 ${currentMoment.userName} 的朋友圈评论了`)
          
          // 检查评论中是否@了某个AI
          const mentionMatch = newComment.content.match(/@(\S+)/)
          let mentionedAIName: string | null = null
          
          if (mentionMatch) {
            const mentionedName = mentionMatch[1]
            const mentionedAI = characters.find(c => c.name === mentionedName)
            if (mentionedAI) {
              mentionedAIName = mentionedName
              console.log(`👤 评论中@了 ${mentionedName}`)
            }
          }
          
          // 等待一下，确保状态已更新，并且localStorage中的聊天记录也已更新
          setTimeout(() => {
            // 从最新的moments中获取这条朋友圈，确保包含所有最新评论
            const latestMoment = moments.find(m => m.id === currentMoment.id)
            if (latestMoment) {
              console.log(`📝 传递给AI的朋友圈包含 ${latestMoment.comments.length} 条评论`)
              
              // 检查这条朋友圈的互动轮数，防止无限循环（限制改为20轮）
              const interactionCount = momentInteractionCountRef.current[currentMoment.id] || 0
              if (interactionCount >= 20) {
                console.log(`🛑 朋友圈 ${currentMoment.id} 已经互动了${interactionCount}轮，停止触发`)
                return
              }
              
              // 记录互动轮数
              momentInteractionCountRef.current[currentMoment.id] = interactionCount + 1
              console.log(`🔄 第 ${interactionCount + 1} 轮互动`)
              
              // 如果评论中@了某个AI，优先触发那个AI（但不排除其他AI）
              if (mentionedAIName) {
                console.log(`🎯 评论中@了 ${mentionedAIName}，该AI会优先看到`)
              }
              
              triggerAIReactToComment(
                latestMoment.id,
                latestMoment,
                newComment.userName,
                characters,
                getChatMessages,
                likeMoment,
                addComment
              )
            }
          }, 500)
        })
      }
    })
    
    // 更新引用
    prevMomentsRef.current = moments
  }, [moments, characters, likeMoment, addComment, getChatMessages])
}
