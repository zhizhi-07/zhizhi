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
  const lastScriptTimeRef = useRef<{ [key: string]: number }>({}) // 记录每条朋友圈最后生成剧本的时间
  
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
      // 简化：直接返回最近20条消息的内容摘要
      return '关系摘要：' + messages.slice(-20).map((m: any) => m.content).join('; ')
    } catch (e) {
      return '聊天记录解析失败。'
    }
  }, [])

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
      
      // 处理新评论（评论区有新互动时，重新编排剧本）
      if (hasNewComments) {
        // 防抖：避免短时间内重复生成剧本
        const lastScriptTime = lastScriptTimeRef.current[currentMoment.id] || 0
        const timeSinceLastScript = Date.now() - lastScriptTime
        const MIN_INTERVAL = 10000 // 最少间隔10秒
        
        if (timeSinceLastScript < MIN_INTERVAL) {
          console.log(`⏸️ 朋友圈 ${currentMoment.id} 在 ${Math.floor(timeSinceLastScript/1000)}秒前刚生成过剧本，跳过`)
          return
        }
        
        console.log(`💬 检测到朋友圈有新评论，AI电影编剧重新编排剧本...`)
        lastScriptTimeRef.current[currentMoment.id] = Date.now()
        
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
      }
    })
    
    // 更新引用
    prevMomentsRef.current = moments
  }, [moments, characters, currentUser, likeMoment, addComment, getCharacter, momentsAPI, charactersAPI, getChatHistory])
}
