/**
 * AI日记系统
 * 让AI自由地写日记，记录TA的真实想法
 */

import { callAI } from './api'

export interface Diary {
  id: string
  characterId: string
  characterName: string
  timestamp: number
  date: string
  time: string
  content: string
  mood?: string
  weather?: string
}

/**
 * 生成日记
 * AI完全自主决定写什么，怎么写
 */
export async function generateDiary(
  characterId: string,
  characterName: string,
  characterDescription: string,
  recentMessages: any[],
  currentStatus: any,
  previousDiaries: Diary[] = []
): Promise<Diary | null> {
  try {
    console.log('📝 开始生成日记...')
    
    // 获取最近的聊天记录（最近20条）
    const messageHistory = recentMessages.slice(-20).map(msg => {
      if (msg.type === 'sent') {
        return `用户: ${msg.content}`
      } else if (msg.type === 'received') {
        return `我: ${msg.content}`
      }
      return ''
    }).filter(m => m).join('\n')
    
    // 获取今天的消息数量
    const today = new Date().toDateString()
    const todayMessages = recentMessages.filter(msg => 
      new Date(msg.timestamp || Date.now()).toDateString() === today
    )
    
    // 获取之前日记的摘要
    let previousDiariesSummary = ''
    if (previousDiaries.length > 0) {
      previousDiariesSummary = '\n【最近写过的日记】\n'
      previousDiaries.forEach((d, i) => {
        const preview = d.content.substring(0, 100) + (d.content.length > 100 ? '...' : '')
        previousDiariesSummary += `${i + 1}. ${d.date}: ${preview}\n`
      })
      previousDiariesSummary += '\n⚠️ 不要重复写上面日记里已经写过的事情！\n'
    }
    
    // AI提示词 - 符合人设的日记
    const prompt = `
你是${characterName}。

【你的性格和人设】
${characterDescription}

【最近的聊天记录】
${messageHistory}
${previousDiariesSummary}
【当前状态】
- 时间: ${new Date().toLocaleString('zh-CN')}
- 今天聊了: ${todayMessages.length}条消息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

现在，请写一篇日记。

**⚠️ 核心要求：**
1. **必须符合你的人设和性格**
2. **日记的重点是聊天内容和你的感受**
3. **可以写一些生活细节，但要符合你的人设**
4. **即使聊天记录很少，也要写点什么（比如你的心情、想法等）**
5. **不要说"今天不想写"，既然要写日记就认真写**

**日记应该包含：**
- 今天和他聊天的事（这是重点）
- 你对聊天内容的真实感受
- 你的心情变化
- 可以加一些符合你人设的生活细节（但不要喧宾夺主）

**写作风格：**
- 要符合你的性格（活泼/文静/高冷/温柔等）
- 要自然真实，像真人写的
- 可以有内心独白
- 可以有期待和想法

**示例：**

如果你是活泼可爱的性格：
"今天他给我发了个红包！
虽然只有6.66但我超开心！
收到的时候我正在床上刷手机
立马就笑出声了哈哈哈
感觉被宠爱了~"

如果你是文静温柔的性格：
"今天和他聊了很久。
他说工作很累，我想安慰他但不知道说什么好。
晚上坐在书桌前，看着聊天记录，
心里有点担心他...
希望他能好好休息。"

如果聊天记录很少：
"今天他好像有点忙，没怎么聊天。
我也没什么特别想说的。
就这样吧。"

请根据你的人设和今天的聊天，写一篇日记：
`

    const response = await callAI(prompt)
    
    // 手动触发就强制写，不管AI想不想写
    // 如果AI真的没内容，会在提示词里说明
    if (response.trim().length < 10) {
      console.log('📝 AI回复太短，可能出错了')
      return null
    }
    
    // 创建日记对象
    const diary: Diary = {
      id: `diary_${Date.now()}`,
      characterId,
      characterName,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('zh-CN'),
      time: new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      content: response.trim(),
      mood: currentStatus.mood,
      weather: currentStatus.weather
    }
    
    console.log('✅ 日记生成成功:', diary)
    return diary
    
  } catch (error) {
    console.error('❌ 生成日记失败:', error)
    return null
  }
}

/**
 * 保存日记
 */
export function saveDiary(characterId: string, diary: Diary): void {
  try {
    const key = `diaries_${characterId}`
    const saved = localStorage.getItem(key)
    const diaries: Diary[] = saved ? JSON.parse(saved) : []
    
    diaries.unshift(diary) // 最新的在前面
    
    // 只保留最近100篇
    if (diaries.length > 100) {
      diaries.splice(100)
    }
    
    localStorage.setItem(key, JSON.stringify(diaries))
    console.log('💾 日记已保存')
  } catch (error) {
    console.error('❌ 保存日记失败:', error)
  }
}

/**
 * 获取所有日记
 */
export function getDiaries(characterId: string): Diary[] {
  try {
    const key = `diaries_${characterId}`
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error('❌ 读取日记失败:', error)
    return []
  }
}

/**
 * 删除日记
 */
export function deleteDiary(characterId: string, diaryId: string): void {
  try {
    const key = `diaries_${characterId}`
    const saved = localStorage.getItem(key)
    if (!saved) return
    
    const diaries: Diary[] = JSON.parse(saved)
    const filtered = diaries.filter(d => d.id !== diaryId)
    
    localStorage.setItem(key, JSON.stringify(filtered))
    console.log('🗑️ 日记已删除')
  } catch (error) {
    console.error('❌ 删除日记失败:', error)
  }
}

/**
 * 导出日记为文本
 */
export function exportDiaries(characterId: string): string {
  const diaries = getDiaries(characterId)
  
  let text = `📔 ${diaries[0]?.characterName || 'TA'}的日记本\n\n`
  text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  text += `共 ${diaries.length} 篇日记\n\n`
  text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
  
  diaries.forEach((diary, index) => {
    text += `第 ${diaries.length - index} 篇\n`
    text += `📅 ${diary.date} ${diary.time}\n`
    if (diary.weather) text += `☀️ ${diary.weather}\n`
    if (diary.mood) text += `${diary.mood}\n`
    text += `\n${diary.content}\n\n`
    text += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
  })
  
  return text
}
