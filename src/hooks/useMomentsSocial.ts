import { useEffect, useRef, useCallback } from 'react'
import { useMoments } from '../context/MomentsContext'
import { useCharacter } from '../context/CharacterContext'
import { generateMovieScript, executeMovieScript } from '../utils/aiSocialDirector'
import { useUser } from '../context/UserContext'

// 监听朋友圈评论变化和新朋友圈，触发AI互动
export const useMomentsSocial = () => {
  const momentsAPI = useMoments()
  const { moments, likeMoment, addComment } = momentsAPI
  const charactersAPI = useCharacter()
  const { characters, getCharacter } = charactersAPI
  const { currentUser } = useUser()
  const prevMomentsRef = useRef(moments)
  const processedMomentsRef = useRef(new Set<string>())
  
  // 🚨 紧急停止开关：如果设置为true，完全停止AI互动
  const emergencyStop = localStorage.getItem('emergency_stop_ai_moments') === 'true'
  
  if (emergencyStop) {
    console.log('🚨 紧急停止：AI朋友圈功能已被禁用')
    return
  }

  //获取聊天历史（分析角色关系）
  const getChatHistory = useCallback((characterId: string, authorName: string): string => {
    const saved = localStorage.getItem(`chat_messages_${characterId}`)
    if (!saved) return `与 ${authorName} 之间没有聊天记录。`
    
    try {
      const messages = JSON.parse(saved)
      const character = getCharacter(characterId)
      if (!character) return '未知角色。'
      
      // 过滤掉系统消息（如朋友圈同步消息），只保留真实对话
      const realMessages = messages.filter((m: any) => 
        m.type !== 'system' && m.messageType !== 'system'
      )
      
      // 获取最近30条真实对话
      const recentMessages = realMessages.slice(-30)
      
      if (recentMessages.length === 0) {
        return `与 ${authorName} 之间还没有实际对话，只有系统消息。`
      }
      
      // 格式化为对话形式
      const formatted = recentMessages.map((msg: any) => {
        const speaker = msg.type === 'sent' ? authorName : character.name
        return `${speaker}: ${msg.content}`
      }).join('\n')
      
      return `最近的聊天记录（共${recentMessages.length}条）：\n${formatted}`
    } catch (e) {
      return '聊天记录解析失败。'
    }
  }, [getCharacter])

  useEffect(() => {
    const prevMoments = prevMomentsRef.current
    
    // 检测新发布的朋友圈和评论变化
    moments.forEach((currentMoment) => {
      const prevMoment = prevMoments.find(m => m.id === currentMoment.id)
      const isNewMoment = !prevMoment
      const hasNewComments = prevMoment && currentMoment.comments.length > prevMoment.comments.length
      
      // 处理新朋友圈
      if (isNewMoment && !processedMomentsRef.current.has(currentMoment.id)) {
        processedMomentsRef.current.add(currentMoment.id)
        
        console.log(`🎬 检测到新朋友圈: "${currentMoment.content.substring(0, 20)}..."，移交AI社交总监处理。`)

        // 获取发布者信息
        const authorIsAI = characters.some(c => c.id === currentMoment.userId)
        const momentAuthor = authorIsAI 
          ? getCharacter(currentMoment.userId)
          : (currentUser ? { id: currentUser.id, name: currentUser.name } : null)

        if (!momentAuthor) {
          console.error('❌ 找不到朋友圈发布者信息')
          return
        }

        // 延迟执行，给系统一点反应时间
        setTimeout(async () => {
          // 1. 调用AI电影编剧生成完整剧本
          const script = await generateMovieScript(
            currentMoment,
            characters,
            momentAuthor,
            (charId) => getChatHistory(charId, momentAuthor.name)
          )

          if (script) {
            // 2. 执行电影剧本
            executeMovieScript(
              script,
              currentMoment,
              momentsAPI,
              charactersAPI
            )
          }
        }, 2000 + Math.random() * 3000) // 2-5秒后AI开始有反应
      }
      
      // 评论变化处理：只对用户的新评论做出反应
      if (hasNewComments) {
        // 检查是否有用户的新评论（非AI评论）
        const prevMoment = prevMoments.find(m => m.id === currentMoment.id)
        if (prevMoment) {
          const newComments = currentMoment.comments.slice(prevMoment.comments.length)
          const hasUserComment = newComments.some(comment => 
            !characters.some(char => char.id === comment.userId)
          )
          
          if (hasUserComment) {
            console.log(`💬 检测到用户的新评论，AI电影编剧重新编排剧本...`)
            
            const authorIsAI = characters.some(c => c.id === currentMoment.userId)
            const momentAuthor = authorIsAI 
              ? getCharacter(currentMoment.userId)
              : (currentUser ? { id: currentUser.id, name: currentUser.name } : null)
            
            if (!momentAuthor) {
              console.error('❌ 找不到朋友圈发布者信息')
              return
            }
            
            // 延迟执行，让评论先显示出来
            setTimeout(async () => {
              const script = await generateMovieScript(
                currentMoment,
                characters,
                momentAuthor,
                (charId) => getChatHistory(charId, momentAuthor.name)
              )
              
              if (script) {
                executeMovieScript(
                  script,
                  currentMoment,
                  momentsAPI,
                  charactersAPI
                )
              }
            }, 1500 + Math.random() * 2000) // 1.5-3.5秒后AI开始反应
          } else {
            console.log(`💬 检测到新评论（AI自己的对话，无需重新生成）`)
          }
        }
      }
    })
    
    // 更新引用
    prevMomentsRef.current = moments
  }, [moments, characters, currentUser, likeMoment, addComment, getCharacter, momentsAPI, charactersAPI, getChatHistory])
}
