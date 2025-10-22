// AI 记忆系统 - 让 AI 真正记住你

export interface Memory {
  id: string
  type: 'fact' | 'event' | 'preference' | 'emotion' | 'relationship'
  content: string
  importance: number  // 1-10，重要程度
  timestamp: number
  relatedMemories?: string[]  // 关联记忆 ID
  tags: string[]
  decayRate: number  // 遗忘速率
  lastAccessed: number  // 最后访问时间
  accessCount: number  // 访问次数
}

export interface MemoryQuery {
  keyword?: string
  type?: Memory['type']
  minImportance?: number
  limit?: number
}

export class MemorySystem {
  private memories: Map<string, Memory> = new Map()
  private characterId: string
  private initialMemoriesExtracted: boolean = false

  constructor(characterId: string) {
    this.characterId = characterId
    this.loadMemories()
    this.loadInitialMemoriesFlag()
  }

  // 添加记忆
  addMemory(
    type: Memory['type'],
    content: string,
    importance: number = 5,
    tags: string[] = []
  ): Memory {
    const memory: Memory = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      importance: Math.max(1, Math.min(10, importance)),
      timestamp: Date.now(),
      tags,
      decayRate: this.calculateDecayRate(type, importance),
      lastAccessed: Date.now(),
      accessCount: 0
    }

    this.memories.set(memory.id, memory)
    this.saveMemories()
    
    console.log(`💭 新记忆: [${type}] ${content} (重要度: ${importance})`)
    
    return memory
  }

  // 计算遗忘速率
  private calculateDecayRate(type: Memory['type'], importance: number): number {
    // 重要程度越高，遗忘越慢
    const baseRate = {
      fact: 0.1,        // 事实记忆遗忘慢
      event: 0.2,       // 事件记忆中等
      preference: 0.05, // 偏好记忆很慢
      emotion: 0.3,     // 情绪记忆快
      relationship: 0.02 // 关系记忆最慢
    }

    return baseRate[type] * (11 - importance) / 10
  }

  // 从对话中提取记忆（使用 AI 分析）
  async extractMemoriesFromConversation(
    userMessage: string,
    aiResponse: string
  ): Promise<{ memories: Memory[], summary: string }> {
    const newMemories: Memory[] = []
    let summary = ''

    try {
      // 调用 AI 分析对话并提取记忆
      const { callAI } = await import('./api')
      
      const prompt = `
# 角色
你是一个聪明的记忆提取和分析助手。你的任务是仔细阅读【对话内容】，准确提取并结构化【用户】透露的**有价值信息**。

# 输入
【对话内容】
用户: ${userMessage}
AI: ${aiResponse}

# 核心规则 (请灵活运用！)

1.  **只关注用户**: 你的目标是了解【用户】。**只记录用户自己表达或确认的信息**。AI说的话仅供理解上下文，**绝对不能**记录为用户信息。
2.  **理解比字面更重要**: 不仅仅看陈述句。用户在问句、感叹句、甚至否定句中也可能透露信息。
    * 例子1: 用户问 "我7点下班后你有空吗？" -> **提取**: "用户7点下班" (fact)
    * 例子2: 用户说 "我才不喜欢吃辣呢！" -> **提取**: "用户不喜欢吃辣" (preference)
    * 例子3: 用户说 "谢谢你啊" -> **忽略** (只是客套)
    * 例子4: 用户问 "你觉得我穿这件红裙子好看吗？" -> **提取**: "用户有一件红裙子" (fact, 如果之前不知道) & "用户在意AI对其穿着的看法" (relationship, 重要度较低)
3.  **允许合理推断，禁止脑补**:
    * 可以推断: 用户说 "下周要去日本玩了！" -> 记录 "用户计划下周去日本旅行" (event)
    * 禁止脑补: 用户说 "今天好累" -> **不能**记录 "用户工作很辛苦" (除非用户明确说了原因)
4.  **提取关键信息，过滤噪音**: 只记录对**长期了解用户**有帮助的信息。日常寒暄、无意义的附和、简单的确认 ("嗯"、"好的") **通常不需要记录**。
5.  **关注变化和新信息**: 如果用户重复已知信息，可以不记或降低重要度。重点记录**新发现**或**与之前记忆冲突**的信息。
6.  **总结要精炼**: \`summary\` 字段应该**只**总结**本次对话中新提取到的最重要的1-2条信息**，而不是重复所有\`memories\`。

# 记忆类型 (请准确分类)

* **fact**: 关于用户的客观事实 (姓名、职业、住址、日程安排、拥有物品等)。
    * 例子: "用户住在北京", "用户周末通常要加班", "用户有一只叫'咪咪'的猫"
* **preference**: 用户的喜好、厌恶、价值观、观点。
    * 例子: "用户喜欢看科幻电影", "用户讨厌下雨天", "用户认为诚信最重要"
* **event**: 用户经历或计划的特定事件 (过去、现在或未来)。
    * 例子: "用户昨天和朋友吵架了", "用户正在准备考试", "用户下个月计划搬家"
* **emotion**: 用户在对话中**明确**表达的**较强**情绪状态 (短暂的"开心"、"难过"通常不记，除非特别强调或与事件相关)。
    * 例子: "用户对即将到来的旅行感到非常兴奋", "用户因为考试失利而感到沮丧"
* **relationship**: 用户如何看待与AI的关系，或对AI的特定行为/特质的反应。
    * 例子: "用户觉得AI很贴心", "用户希望AI更主动一点", "用户对AI的某个笑话觉得很无语"

# 重要度评估 (1-10，请审慎打分)

* **9-10 (关键记忆)**: 重大生活事件 (恋爱、分手、换工作、搬家、家庭变故)、核心价值观、长期目标、反复提及的强烈好恶。
* **7-8 (重要信息)**: 较重要的个人信息 (职业、主要日程安排如上下班时间)、重要的兴趣爱好、近期发生的有影响的事件。
* **4-6 (一般信息)**: 普通的喜好、日常活动、临时情绪、对AI的一般看法。
* **1-3 (低价值信息)**: 琐碎细节、模糊不清的信息、可能很快会变的偏好 (通常可以忽略不记)。
* **0 (无需记录)**: 客套话、寒暄、无信息量的附和。

# 输出格式 (必须严格遵守 JSON)

\`\`\`json
{
  "memories": [
    {
      "type": "(fact | preference | event | emotion | relationship)",
      "content": "(简洁、客观地描述用户信息的句子，第三人称)",
      "importance": (1-10的数字),
      "tags": ["(1-3个相关关键词，方便检索，如：工作, 爱好, 情绪, 关系)"]
    }
  ],
  "summary": "(一句话总结本次对话【新】提取到的【最重要】信息，如果没有新信息则为空字符串)"
}
\`\`\`

# 特殊情况

* 如果分析后认为用户**没有透露任何有价值的新信息**，则返回：
    \`\`\`json
    {
      "memories": [],
      "summary": ""
    }
    \`\`\`

# 现在请分析【对话内容】并输出JSON：
`

      const response = await callAI([
        { role: 'user', content: prompt }
      ])

      // 解析 AI 返回的 JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1])
        
        // 提取记忆
        if (result.memories && Array.isArray(result.memories)) {
          result.memories.forEach((mem: any) => {
            if (mem.type && mem.content && mem.importance) {
              newMemories.push(
                this.addMemory(
                  mem.type,
                  mem.content,
                  mem.importance,
                  mem.tags || []
                )
              )
            }
          })
        }
        
        // 提取总结
        if (result.summary) {
          summary = result.summary
        }
      }

      console.log(`💭 AI 提取了 ${newMemories.length} 条记忆`)
      console.log(`📝 生成了记忆总结`)
      
    } catch (error) {
      console.error('❌ AI 记忆提取失败:', error)
      // 失败时返回空数据，不影响正常对话
    }

    return { memories: newMemories, summary }
  }

  // 搜索记忆
  searchMemories(query: MemoryQuery): Memory[] {
    let results = Array.from(this.memories.values())

    // 应用遗忘机制
    results = results.map(memory => this.applyDecay(memory))

    // 过滤
    if (query.type) {
      results = results.filter(m => m.type === query.type)
    }

    if (query.minImportance !== undefined) {
      results = results.filter(m => m.importance >= query.minImportance)
    }

    if (query.keyword) {
      const keyword = query.keyword.toLowerCase()
      results = results.filter(m => 
        m.content.toLowerCase().includes(keyword) ||
        m.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    }

    // 按重要度和新鲜度排序
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a)
      const scoreB = this.calculateRelevanceScore(b)
      return scoreB - scoreA
    })

    // 限制数量
    if (query.limit) {
      results = results.slice(0, query.limit)
    }

    // 更新访问记录
    results.forEach(memory => {
      memory.lastAccessed = Date.now()
      memory.accessCount++
    })

    this.saveMemories()

    return results
  }

  // 应用遗忘机制
  private applyDecay(memory: Memory): Memory {
    const daysPassed = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24)
    const decayFactor = Math.exp(-memory.decayRate * daysPassed)
    
    // 访问次数可以减缓遗忘
    const accessBonus = Math.min(memory.accessCount * 0.1, 2)
    
    const adjustedImportance = memory.importance * decayFactor + accessBonus
    
    return {
      ...memory,
      importance: Math.max(1, Math.min(10, adjustedImportance))
    }
  }

  // 计算相关性分数
  private calculateRelevanceScore(memory: Memory): number {
    const importanceScore = memory.importance * 10
    const recencyScore = Math.max(0, 100 - (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24))
    const accessScore = Math.min(memory.accessCount * 5, 50)
    
    return importanceScore + recencyScore + accessScore
  }

  // 获取相关记忆（用于生成回复）
  getRelevantMemories(context: string, limit: number = 5): Memory[] {
    // 提取关键词
    const keywords = this.extractKeywords(context)
    
    let relevantMemories: Memory[] = []
    
    // 搜索每个关键词
    keywords.forEach(keyword => {
      const memories = this.searchMemories({ keyword, limit: 3 })
      relevantMemories.push(...memories)
    })

    // 去重
    const uniqueMemories = Array.from(
      new Map(relevantMemories.map(m => [m.id, m])).values()
    )

    // 按相关性排序
    uniqueMemories.sort((a, b) => 
      this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a)
    )

    return uniqueMemories.slice(0, limit)
  }

  // 提取关键词
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取（可以使用更复杂的 NLP 算法）
    const words = text.split(/[\s，。！？、]+/)
    return words.filter(word => word.length >= 2)
  }

  // 生成记忆摘要（用于 AI 提示词）
  generateMemorySummary(): string {
    const memories = Array.from(this.memories.values())
      .map(m => this.applyDecay(m))
      .filter(m => m.importance >= 3)
      .sort((a, b) => this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a))
      .slice(0, 20)

    if (memories.length === 0) {
      return '暂无重要记忆。'
    }

    const grouped = {
      fact: memories.filter(m => m.type === 'fact'),
      preference: memories.filter(m => m.type === 'preference'),
      event: memories.filter(m => m.type === 'event'),
      emotion: memories.filter(m => m.type === 'emotion'),
      relationship: memories.filter(m => m.type === 'relationship')
    }

    let summary = '【关于用户的记忆】\n\n'

    if (grouped.fact.length > 0) {
      summary += '基本信息：\n'
      grouped.fact.forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.preference.length > 0) {
      summary += '偏好喜好：\n'
      grouped.preference.forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.event.length > 0) {
      summary += '最近事件：\n'
      grouped.event.slice(0, 5).forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.emotion.length > 0) {
      summary += '情绪状态：\n'
      grouped.emotion.slice(0, 3).forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    if (grouped.relationship.length > 0) {
      summary += '关系互动：\n'
      grouped.relationship.slice(0, 3).forEach(m => summary += `- ${m.content}\n`)
      summary += '\n'
    }

    summary += '⚠️ 请在对话中自然地运用这些记忆，让用户感受到你真的记得他们！'

    return summary
  }

  // 清理低重要度记忆
  cleanupMemories() {
    const memories = Array.from(this.memories.values())
      .map(m => this.applyDecay(m))

    // 删除重要度低于 1 的记忆
    memories.forEach(memory => {
      if (memory.importance < 1) {
        this.memories.delete(memory.id)
        console.log(`🗑️ 遗忘记忆: ${memory.content}`)
      }
    })

    this.saveMemories()
  }

  // 保存记忆到 localStorage
  private saveMemories() {
    try {
      const data = Array.from(this.memories.entries())
      localStorage.setItem(`memories_${this.characterId}`, JSON.stringify(data))
    } catch (error) {
      console.error('保存记忆失败:', error)
    }
  }

  // 从 localStorage 加载记忆
  private loadMemories() {
    try {
      const saved = localStorage.getItem(`memories_${this.characterId}`)
      if (saved) {
        const data = JSON.parse(saved)
        this.memories = new Map(data)
        console.log(`💭 加载了 ${this.memories.size} 条记忆`)
      }
    } catch (error) {
      console.error('加载记忆失败:', error)
    }
  }

  // 加载初始记忆提取标记
  private loadInitialMemoriesFlag() {
    try {
      const flag = localStorage.getItem(`initial_memories_extracted_${this.characterId}`)
      this.initialMemoriesExtracted = flag === 'true'
    } catch (error) {
      console.error('加载初始记忆标记失败:', error)
    }
  }

  // 保存初始记忆提取标记
  private saveInitialMemoriesFlag() {
    try {
      localStorage.setItem(`initial_memories_extracted_${this.characterId}`, 'true')
      this.initialMemoriesExtracted = true
    } catch (error) {
      console.error('保存初始记忆标记失败:', error)
    }
  }

  // 从角色描述中提取初始记忆
  async extractInitialMemories(characterDescription: string): Promise<void> {
    if (this.initialMemoriesExtracted) {
      return
    }

    if (!characterDescription || characterDescription.trim().length === 0) {
      console.log('💭 角色描述为空，跳过初始记忆提取')
      this.saveInitialMemoriesFlag()
      return
    }

    try {
      const { callAI } = await import('./api')
      
      const prompt = `你是一个记忆提取助手。分析以下角色描述，提取关于用户的初始记忆。

角色描述：
${characterDescription}

⚠️ 格式说明：
- {{user}} 或 {{User}} 代表用户
- {{char}} 或 {{Char}} 代表 AI 角色
- 请提取所有关于 {{user}} 的信息

请提取描述中提到的关于用户的信息，例如：
- 用户的基本信息（姓名、年龄、职业等）
- 用户的偏好喜好
- 用户和角色的关系
- 其他重要信息

⚠️ 重要原则：
- 只提取关于 {{user}} 的信息，不要提取关于 {{char}} 的信息
- 只提取明确提到的信息
- 不要推测或想象
- 如果没有关于用户的信息，返回空数组

请以 JSON 格式返回：
\`\`\`json
[
  {
    "type": "fact|preference|event|emotion|relationship",
    "content": "记忆内容（用"用户"代替{{user}}）",
    "importance": 1-10,
    "tags": ["标签1", "标签2"]
  }
]
\`\`\`

如果没有需要记录的信息，返回：
\`\`\`json
[]
\`\`\``

      const response = await callAI([
        { role: 'user', content: prompt }
      ])

      // 解析 AI 返回的 JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        const extractedMemories = JSON.parse(jsonMatch[1])
        
        if (Array.isArray(extractedMemories)) {
          extractedMemories.forEach((mem: any) => {
            if (mem.type && mem.content && mem.importance) {
              this.addMemory(
                mem.type,
                mem.content,
                mem.importance,
                [...(mem.tags || []), '初始记忆']
              )
            }
          })
          
          console.log(`💭 从角色描述中提取了 ${extractedMemories.length} 条初始记忆`)
        }
      }

      this.saveInitialMemoriesFlag()
      
    } catch (error) {
      console.error('❌ 初始记忆提取失败:', error)
    }
  }

  // 导出记忆
  exportMemories(): string {
    const memories = Array.from(this.memories.values())
      .map(m => this.applyDecay(m))
      .sort((a, b) => b.importance - a.importance)

    return JSON.stringify(memories, null, 2)
  }

  // 获取统计信息
  getStatistics() {
    const memories = Array.from(this.memories.values())
    
    return {
      total: memories.length,
      byType: {
        fact: memories.filter(m => m.type === 'fact').length,
        preference: memories.filter(m => m.type === 'preference').length,
        event: memories.filter(m => m.type === 'event').length,
        emotion: memories.filter(m => m.type === 'emotion').length,
        relationship: memories.filter(m => m.type === 'relationship').length
      },
      avgImportance: memories.reduce((sum, m) => sum + m.importance, 0) / memories.length,
      oldestMemory: Math.min(...memories.map(m => m.timestamp)),
      newestMemory: Math.max(...memories.map(m => m.timestamp))
    }
  }
}

// 单例管理器
class MemoryManager {
  private systems: Map<string, MemorySystem> = new Map()

  getSystem(characterId: string): MemorySystem {
    if (!this.systems.has(characterId)) {
      this.systems.set(characterId, new MemorySystem(characterId))
    }
    return this.systems.get(characterId)!
  }

  // 定期清理所有角色的记忆
  cleanupAll() {
    this.systems.forEach(system => system.cleanupMemories())
  }
}

export const memoryManager = new MemoryManager()

// 每天自动清理一次
setInterval(() => {
  memoryManager.cleanupAll()
}, 24 * 60 * 60 * 1000)
