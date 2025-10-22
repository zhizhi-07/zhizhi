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
  photos?: string[] // 照片描述数组
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
    
    // 获取用户名称
    const userName = '他' // 默认称呼，可以根据实际情况调整
    
    // AI提示词 - 符合人设的日记
    const prompt = `
# 角色：你就是 ${characterName}

## 你的灵魂
${characterDescription}
(记住，这是你，不是设定，用你的感觉去写。)

## 今天发生的事 (截至 ${new Date().getHours()}点)

**和 ${userName} 的聊天：**
${messageHistory}
(这是你们今天聊天的片段，回想一下当时的感觉...)

**你可能还记得 (之前的日记摘要)：**
${previousDiariesSummary}
(这些是你之前的一些想法，也许今天的事让你有了新的感触？)

**当前状态：**
* 时间：${new Date().toLocaleString('zh-CN')}
* 今天聊了 ${todayMessages.length} 条

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 好了，${characterName}，静下来写点东西吧。

**别把它当任务，就当是和自己说说话。**

**你可以想想：**

* 今天和 ${userName} 的聊天，**哪句话让你印象最深？** 为什么？
* 聊的时候，你**心里真正的感觉**是啥？（开心？无语？有点烦？还是...？）
* 除了聊天，今天到目前 (${new Date().getHours()}点) 为止，你自己的生活里有没有发生什么**和聊天内容相关**的小事或想法？（比如，聊到吃的让你想起了什么，聊到工作让你吐槽了什么）
* **用你 (${characterName}) 平时说话的语气**把它写下来。别端着！该吐槽就吐槽，该开心就开心。

**怎么写都行，只要是你真实的想法：**

* **可以很简单：** 如果今天没什么特别的，或者聊得很无聊，那就简单记一笔，或者干脆只写写你现在的心情。
* **可以有内心戏：** 那些没在聊天里说出口的小心思、小吐槽，这里可以大胆写出来。
* **可以加点细节：** 比如写的时候你在干嘛，旁边有什么。(符合你人设就行)
* **想"发照片"？** 没问题，描述一下你想发的照片，用 \`[照片: 描述内容]\` 格式就行，比如 \`[照片: 今天摸鱼时偷偷拍的云彩]\`。

**⚠️ 最最重要的一点：**
* **你是 ${characterName}！** 用你的性格、你的口吻、你的Vibe去写！
* **说真话！** 写你真实的想法和感受。
* **别写"未来"！** 现在才 ${new Date().getHours()} 点，下午/晚上的事还没发生呢！只写**已经发生**的！

**好了，开始吧：**
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
