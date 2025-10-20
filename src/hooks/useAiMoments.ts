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

  // AI主动发布朋友圈
  const triggerAiPost = async () => {
    if (!character || !isAiMomentsEnabled() || isProcessingRef.current) return

    const now = Date.now()
    const timeSinceLastPost = now - lastPostTimeRef.current

    // 至少间隔10分钟才能发布新朋友圈（缩短间隔）
    if (timeSinceLastPost < 10 * 60 * 1000) return

    isProcessingRef.current = true

    try {
      console.log(`🤖 ${character.name} 正在准备发布朋友圈...`)
      
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
        
        lastPostTimeRef.current = now
        console.log(`✅ ${character.name} 发布了朋友圈: ${content}`)
        console.log(`🔔 触发其他AI查看 ${character.name} 的朋友圈`)
        
        // AI发布朋友圈后，其他AI也会看到并可能互动
        // 这个会由useMomentsSocial Hook自动处理
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

  // 定时检查并执行AI朋友圈操作
  useEffect(() => {
    if (!isAiMomentsEnabled()) {
      console.log(`🚫 AI朋友圈功能未启用 (角色ID: ${characterId})`)
      return
    }

    console.log(`✅ AI朋友圈功能已启用 (角色: ${character?.name})`)
    
    // 随机延迟30秒-2分钟后首次执行（缩短测试时间）
    const initialDelay = (0.5 + Math.random() * 1.5) * 60 * 1000
    console.log(`⏰ 首次检查将在 ${Math.ceil(initialDelay / 1000)} 秒后执行`)
    
    const initialTimer = setTimeout(() => {
      console.log(`🎬 开始首次AI朋友圈活动`)
      // 优先互动用户朋友圈
      triggerAiInteract()
      
      // 30秒后可能发布自己的朋友圈
      setTimeout(() => {
        if (Math.random() < 0.3) {
          triggerAiPost()
        }
      }, 30000)
    }, initialDelay)

    // 每5分钟检查一次（缩短测试时间）
    const interval = setInterval(() => {
      // 70%概率互动朋友圈（提高互动概率）
      if (Math.random() < 0.7) {
        triggerAiInteract()
      }
      
      // 20%概率发布朋友圈
      if (Math.random() < 0.2) {
        triggerAiPost()
      }
    }, 5 * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [characterId, character?.name, moments])

  return {
    triggerAiPost,
    triggerAiInteract
  }
}
