import { useEffect, useRef } from 'react'
import { useCharacter } from '../context/CharacterContext'
import { useMoments } from '../context/MomentsContext'
import { aiPostMoment, aiInteractWithSingleMoment } from '../utils/aiMomentsService'

// AI朋友圈管理Hook
export const useAiMoments = (characterId: string) => {
  const { getCharacter } = useCharacter()
  const { moments, addMoment, likeMoment, addComment } = useMoments()
  const lastPostTimeRef = useRef<number>(0)
  const lastInteractTimeRef = useRef<number>(0)
  const isProcessingRef = useRef(false)

  const character = getCharacter(characterId)

  // 检查是否启用了AI朋友圈功能
  const isAiMomentsEnabled = () => {
    const saved = localStorage.getItem(`ai_moments_enabled_${characterId}`)
    return saved === 'true'
  }

  // AI主动发布朋友圈（由AI自己决定是否发布）
  const triggerAiPost = async () => {
    if (!character || !isAiMomentsEnabled() || isProcessingRef.current) return

    isProcessingRef.current = true

    try {
      console.log(`🤖 ${character.name} 正在考虑是否发布朋友圈...`)
      
      const content = await aiPostMoment(
        character.id,
        character.name,
        character.avatar,
        character.description || ''
      )

      if (content) {
        addMoment({
          userId: character.id,
          userName: character.name,
          userAvatar: character.avatar,
          content,
          images: []
        })
        
        lastPostTimeRef.current = Date.now()
        console.log(`✅ ${character.name} 发布了朋友圈: ${content}`)
        console.log(`🔔 触发其他AI查看 ${character.name} 的朋友圈`)
        
        // 添加系统消息到聊天记录，让用户知道AI发布了朋友圈
        const chatMessages = localStorage.getItem(`chat_messages_${character.id}`)
        const messages = chatMessages ? JSON.parse(chatMessages) : []
        
        const systemMessage = {
          id: Date.now() + Math.random(),
          type: 'system',
          content: `📸 ${character.name} 发布了朋友圈：${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          time: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: Date.now(),
          messageType: 'system',
          isHidden: false  // 用户可见
        }
        
        messages.push(systemMessage)
        localStorage.setItem(`chat_messages_${character.id}`, JSON.stringify(messages))
        console.log(`💾 已向用户发送 ${character.name} 发布朋友圈的系统提示`)
        
        // AI发布朋友圈后，其他AI也会看到并可能互动
        // 这个会由useMomentsSocial Hook自动处理
      } else {
        console.log(`😶 ${character.name} 暂时不想发朋友圈`)
      }
    } catch (error) {
      console.error('AI发布朋友圈失败:', error)
    } finally {
      isProcessingRef.current = false
    }
  }

  // AI查看并互动用户的朋友圈
  const triggerAiInteract = async () => {
    if (!character || !isAiMomentsEnabled() || isProcessingRef.current) return

    const now = Date.now()
    const timeSinceLastInteract = now - lastInteractTimeRef.current

    // 至少间隔2分钟才能进行新的互动（大幅缩短间隔）
    if (timeSinceLastInteract < 2 * 60 * 1000) {
      console.log(`⏰ ${character.name} 互动冷却中，还需等待 ${Math.ceil((2 * 60 * 1000 - timeSinceLastInteract) / 1000)} 秒`)
      return
    }

    // 获取用户发布的朋友圈（不包括AI自己的）
    const userMoments = moments.filter(m => m.userId !== character.id)
    console.log(`📱 朋友圈总数: ${moments.length}, AI ID: ${character.id}`)
    console.log(`👤 用户发布的朋友圈数: ${userMoments.length}`)
    
    if (userMoments.length === 0) {
      console.log(`❌ ${character.name} 没有找到用户的朋友圈`)
      return
    }

    // 随机选择一条最近的朋友圈进行互动
    const recentMoments = userMoments.slice(0, 5)
    const randomMoment = recentMoments[Math.floor(Math.random() * recentMoments.length)]

    isProcessingRef.current = true

    try {
      console.log(`🤖 ${character.name} 正在查看朋友圈...`)
      
      const result = await aiInteractWithSingleMoment(
        character.name,
        character.description || '',
        randomMoment
      )

      if (result && result.action !== 'skip') {
        if (result.action === 'like') {
          // 检查是否已经点赞
          const hasLiked = randomMoment.likes.some(like => like.userId === character.id)
          if (!hasLiked) {
            likeMoment(randomMoment.id, character.id, character.name, character.avatar)
            console.log(`👍 ${character.name} 给 ${randomMoment.userName} 的朋友圈点赞了`)
          }
        } else if (result.action === 'comment' && result.comment) {
          addComment(
            randomMoment.id,
            character.id,
            character.name,
            character.avatar,
            result.comment
          )
          console.log(`💬 ${character.name} 评论了 ${randomMoment.userName} 的朋友圈: ${result.comment}`)
        }
        
        lastInteractTimeRef.current = now
      }
    } catch (error) {
      console.error('AI互动朋友圈失败:', error)
    } finally {
      isProcessingRef.current = false
    }
  }

  // 监听聊天消息，在聊天后触发AI朋友圈活动
  useEffect(() => {
    if (!isAiMomentsEnabled()) {
      console.log(`🚫 AI朋友圈功能未启用 (角色ID: ${characterId})`)
      return
    }

    console.log(`✅ AI朋友圈功能已启用 (角色: ${character?.name})`)
    
    // 监听聊天消息变化，在聊天后触发朋友圈活动
    const chatMessages = localStorage.getItem(`chat_messages_${characterId}`)
    if (chatMessages) {
      const messages = JSON.parse(chatMessages)
      const lastMessage = messages[messages.length - 1]
      
      // 如果最近有聊天（5分钟内），考虑发布朋友圈
      if (lastMessage && Date.now() - (lastMessage.timestamp || 0) < 5 * 60 * 1000) {
        // 延迟1-3分钟后考虑发布朋友圈（让AI有时间"思考"）
        const delay = (1 + Math.random() * 2) * 60 * 1000
        const timer = setTimeout(() => {
          console.log(`💭 ${character?.name} 在聊天后考虑发布朋友圈...`)
          triggerAiPost()
        }, delay)
        
        return () => clearTimeout(timer)
      }
    }
  }, [characterId, character?.name, moments])

  return {
    triggerAiPost,
    triggerAiInteract
  }
}
