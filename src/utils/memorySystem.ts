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
      
      const prompt = `你是一个专业的记忆提取和总结助手。你的任务是分析对话，提取关于**用户**的信息。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 对话内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

用户: ${userMessage}
AI: ${aiResponse}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 分析步骤（必须按顺序执行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

第一步：理解对话逻辑
1. 用户在说什么？是陈述、疑问、还是回应？
2. AI 在说什么？是回答、提问、还是陈述？
3. 谁在描述谁的信息？

第二步：判断信息归属（需要理解情感和关系）
- 如果用户说"我..."，这是用户的信息 ✅
- 如果用户说"你..."，需要判断：
  • "你真好"、"我喜欢你" → 这是用户的情感，可以记录 ✅
  • "你几点下班？" → 这是在问 AI，不记录 ❌
  • "你对我真好" → 这是用户对关系的感受，可以记录 ✅
- 如果 AI 说"我..."，这是 AI 的信息，不要记录 ❌
- 如果 AI 说"你..."，这可能是 AI 在描述用户，需要验证用户是否确认 ⚠️

第三步：验证信息来源
- 用户明确说过的 ✅ 可以记录
- 用户暗示的 ❌ 不要记录（不要推测）
- AI 说的 ❌ 绝对不要记录
- 用户的疑问句 ❌ 不要记录（疑问不是陈述）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 记忆类型
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请提取以下类型的记忆（如果有的话）：

1. **事实记忆** (fact)：关于用户的基本信息
   - 姓名、年龄、职业、学校
   - 居住地、家庭成员
   - 作息时间（几点上班/上学/下班等）
   - 重要的个人信息
   
2. **偏好记忆** (preference)：用户的喜好和厌恶
   - 喜欢/不喜欢的东西
   - 兴趣爱好
   - 愿望、梦想
   
3. **事件记忆** (event)：重要的事件
   - 重大生活事件（分手、恋爱、毕业、入职等）
   - 今天/最近发生的事
   - 计划要做的事
   
4. **情绪记忆** (emotion)：明显的情绪状态
   - 开心、难过、生气、焦虑等
   
5. **关系记忆** (relationship)：关系互动
   - 重要的感谢、道歉
   - 关系的变化（成为朋友、分手等）

⚠️ 重要原则：
- 只提取**真正重要**的信息，不要记录无意义的客套话
- "谢谢"这种普通客套话**不要记录**
- 重大事件（分手、恋爱、毕业等）**必须记录**，重要度设为 9-10
- 作息时间（几点上班/上学）**必须记录**，重要度设为 8
- 如果没有重要信息，返回空数组

🚨 **严格禁止规则**：
- **只能提取用户明确说过的信息**
- **绝对不能提取 AI 说的内容**（AI 可能在瞎编）
- **绝对不能推测、想象、猜测用户的信息**
- **如果用户没有明确说，就不要记录**
- **用户的疑问句不是陈述句**：问"你七点下班？"不等于"我七点下班"

❌ 错误示例1：
用户: "但我不喜欢吃榴莲"
AI: "我今天吃了榴莲"
→ 不要记录 "用户喜欢榴莲"（这是 AI 说的！）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 逻辑分析示例（必读！）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

示例1：疑问句陷阱
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: "我刚下班"
用户: "你七点才下班？"

❌ 错误分析：
- 看到"七点下班"就记录 "用户七点下班"

✅ 正确分析：
1. AI 说"我刚下班" → AI 在说自己下班
2. 用户说"你七点才下班？" → 用户在问 AI 几点下班
3. "你"指的是 AI，不是用户自己
4. 这是疑问句，不是陈述句
5. 结论：不记录任何信息

示例2：AI 信息陷阱
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: "我喜欢打篮球"
用户: "是吗"

❌ 错误分析：
- 看到"喜欢打篮球"就记录 "用户喜欢打篮球"

✅ 正确分析：
1. AI 说"我喜欢打篮球" → 这是 AI 的信息
2. 用户说"是吗" → 用户只是回应，没有说自己的信息
3. 结论：不记录任何信息

示例3：正确的陈述句
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: "你几点下班？"
用户: "我七点下班"

✅ 正确分析：
1. AI 问"你几点下班？" → AI 在询问用户
2. 用户说"我七点下班" → 用户在陈述自己的信息
3. "我"指的是用户自己
4. 这是陈述句，明确说了自己的作息时间
5. 结论：记录 "用户七点下班"

示例4：复杂对话逻辑
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
用户: "你喜欢吃什么？"
AI: "我喜欢吃火锅"

❌ 错误分析：
- 看到"喜欢吃火锅"就记录 "用户喜欢吃火锅"

✅ 正确分析：
1. 用户问"你喜欢吃什么？" → 用户在问 AI
2. AI 说"我喜欢吃火锅" → AI 在说自己的喜好
3. 没有任何关于用户的信息
4. 结论：不记录任何信息

示例5：用户明确陈述
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: "你喜欢吃什么？"
用户: "我喜欢吃火锅，但不喜欢吃榴莲"

✅ 正确分析：
1. AI 问"你喜欢吃什么？" → AI 在询问用户
2. 用户说"我喜欢吃火锅" → 用户明确说了自己的喜好
3. 用户说"但不喜欢吃榴莲" → 用户明确说了自己的厌恶
4. 结论：记录两条信息
   - "用户喜欢吃火锅"
   - "用户不喜欢吃榴莲"

示例6：情感表达（重要！）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: "怎么了？"
用户: "你真好，我好喜欢你"

✅ 正确分析：
1. 用户说"你真好" → 这是用户对 AI 的评价和情感
2. 用户说"我好喜欢你" → 这是用户的情感表达
3. 虽然有"你"，但这是在表达用户自己的感受
4. 结论：记录情感信息
   - "用户觉得 AI 很好"
   - "用户喜欢 AI"

示例7：关系感受（重要！）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: "我会一直陪着你的"
用户: "你对我真好，我很感动"

✅ 正确分析：
1. 用户说"你对我真好" → 这是用户对关系的感受
2. 用户说"我很感动" → 这是用户的情绪状态
3. 这些都是用户的真实感受，可以记录
4. 结论：记录情感和关系信息
   - "用户觉得 AI 对自己很好"
   - "用户感到感动"

示例8：纯粹的询问（不记录）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI: "我今天加班到很晚"
用户: "你几点下班的？"

✅ 正确分析：
1. 用户说"你几点下班的？" → 这是在询问 AI
2. 没有表达用户自己的信息或感受
3. 这只是一个问题，不是情感表达
4. 结论：不记录任何信息

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 判断标准总结
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 可以记录：
- 用户说"我..."（陈述自己）
- 用户明确陈述的事实
- 用户的情感表达（"你真好"、"我喜欢你"）
- 用户对关系的感受（"你对我真好"）
- 用户的情绪状态（"我很感动"、"我很开心"）

❌ 不能记录：
- 纯粹的询问（"你几点下班？"）
- AI 说的任何内容
- 用户的简单回应（"是吗"、"真的"、"哦"）
- 推测、暗示、猜测的内容

⚠️ 关键区别：
- "你真好" = 情感表达 = 可以记录 ✅
- "你几点下班？" = 纯粹询问 = 不能记录 ❌
- "你对我真好" = 关系感受 = 可以记录 ✅
- "你吃了吗？" = 纯粹询问 = 不能记录 ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
任务 2：生成记忆总结
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请用自然语言总结用户在对话中透露的所有重要信息。

⚠️ 总结的核心原则：
1. **浓缩，不是扩写**：总结必须比原文短
2. **只提取明确的信息**：不要推测、脑补、想象
3. **只记录用户说的**：不要记录 AI 说的内容
4. **信息不足就不总结**：如果对话太简短，返回空总结

示例格式：

【信息丰富的对话 - 需要总结】
对话内容：用户说了很多关于自己的信息（姓名、年龄、职业、爱好等）
总结：用户叫小明，25岁，是程序员，在北京工作。他喜欢打篮球和看电影，不喜欢吃榴莲。

【信息较少的对话 - 可以简短总结】
对话内容：用户透露了一些基本信息
总结：用户是学生，喜欢打游戏。

【非常简短的对话 - 不需要总结】
对话内容：只有"666"、"哈哈"、"好的"等简短回复
总结：（返回空字符串）

⚠️ 重要规则：
- 如果用户只说了1-2句简短的话（如"666"、"哈哈"），不要总结
- 不要从语气、态度推断性格（这是脑补，不是总结）
- 总结的字数应该远少于原对话的字数
- 宁可不总结，也不要瞎编

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
输出格式
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

请按以下格式返回：

\`\`\`json
{
  "memories": [
    {
      "type": "fact|preference|event|emotion|relationship",
      "content": "记忆内容",
      "importance": 1-10,
      "tags": ["标签1", "标签2"]
    }
  ],
  "summary": "用户是一个25岁的程序员，在北京工作。他喜欢打篮球和看电影，不喜欢吃榴莲。\\n\\n他的性格比较内向，但和熟悉的人会很放松。工作压力比较大，经常加班到很晚。"
}
\`\`\`

如果对话太简短，没有足够信息：
\`\`\`json
{
  "memories": [],
  "summary": ""
}
\`\`\`

⚠️ 注意：summary 为空字符串表示没有足够的信息生成总结（不是"暂无足够的信息"这种文字）`

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
      console.log('💭 初始记忆已提取过，跳过')
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
