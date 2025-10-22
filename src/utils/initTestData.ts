// 初始化测试数据 - 用于演示火花时刻和热梗功能

import { recordSparkMoment } from './sparkMoments'
import { trackMemeUsage } from './memeUsageTracker'

/**
 * 初始化火花时刻测试数据
 */
export function initSparkMomentsTestData() {
  const testMoments = [
    {
      contactId: 'char_1',
      contactName: '小美',
      contactAvatar: '/avatars/default.png',
      content: '今天和你聊天真的很开心',
      intensity: 85,
      category: 'chat' as const
    },
    {
      contactId: 'char_1',
      contactName: '小美',
      contactAvatar: '/avatars/default.png',
      content: '你说的话让我心动了',
      intensity: 92,
      category: 'chat' as const
    },
    {
      contactId: 'char_2',
      contactName: '小明',
      contactAvatar: '/avatars/default.png',
      content: '朋友圈点赞互动',
      intensity: 45,
      category: 'moments' as const
    },
    {
      contactId: 'char_1',
      contactName: '小美',
      contactAvatar: '/avatars/default.png',
      content: '收到了你的礼物，好喜欢',
      intensity: 78,
      category: 'gift' as const
    }
  ]

  testMoments.forEach(moment => {
    recordSparkMoment(
      moment.contactId,
      moment.contactName,
      moment.contactAvatar,
      moment.content,
      moment.intensity,
      moment.category
    )
  })

  console.log('✨ 火花时刻测试数据已初始化')
}

/**
 * 初始化热梗使用测试数据
 */
export function initMemeUsageTestData() {
  // 模拟一些常用热梗的使用记录
  const popularMemes = [1, 2, 5, 22, 24, 60, 33, 35]
  
  popularMemes.forEach(memeId => {
    const usageCount = Math.floor(Math.random() * 20) + 5
    for (let i = 0; i < usageCount; i++) {
      trackMemeUsage(memeId)
    }
  })

  console.log('🔥 热梗使用测试数据已初始化')
}

/**
 * 初始化所有测试数据
 */
export function initAllTestData() {
  initSparkMomentsTestData()
  initMemeUsageTestData()
  console.log('✅ 所有测试数据初始化完成')
}
