import { useEffect, useRef } from 'react'
import { memoryManager } from '../utils/memorySystem'

// Hook 用于在聊天中自动提取和使用记忆
export const useMemory = (characterId: string) => {
  const memorySystem = useRef(memoryManager.getSystem(characterId))

  // 从对话中提取记忆和总结（异步）
  const extractMemories = async (userMessage: string, aiResponse: string) => {
    return await memorySystem.current.extractMemoriesFromConversation(userMessage, aiResponse)
  }

  // 从角色描述中提取初始记忆（异步）
  const extractInitialMemories = async (characterDescription: string) => {
    return await memorySystem.current.extractInitialMemories(characterDescription)
  }

  // 获取相关记忆用于生成回复
  const getRelevantMemories = (context: string, limit: number = 5) => {
    return memorySystem.current.getRelevantMemories(context, limit)
  }

  // 生成记忆摘要用于 AI 提示词
  const getMemorySummary = () => {
    return memorySystem.current.generateMemorySummary()
  }

  // 手动添加记忆
  const addMemory = (
    type: 'fact' | 'event' | 'preference' | 'emotion' | 'relationship',
    content: string,
    importance: number = 5
  ) => {
    return memorySystem.current.addMemory(type, content, importance)
  }

  // 搜索记忆
  const searchMemories = (keyword: string) => {
    return memorySystem.current.searchMemories({ keyword })
  }

  // 获取统计信息
  const getStatistics = () => {
    return memorySystem.current.getStatistics()
  }

  return {
    extractMemories,
    extractInitialMemories,
    getRelevantMemories,
    getMemorySummary,
    addMemory,
    searchMemories,
    getStatistics
  }
}
