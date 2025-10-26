/**
 * Lorebook / World Info 系统
 * 基于关键词触发的知识库管理
 */

export interface LorebookEntry {
  id: string
  name: string
  keys: string[]              // 触发关键词
  content: string             // 注入内容
  enabled: boolean            // 是否启用
  
  // 高级选项
  priority: number            // 优先级 0-999
  insertion_order: number     // 插入顺序
  case_sensitive: boolean     // 大小写敏感
  use_regex: boolean          // 使用正则表达式
  
  // Token 管理
  token_budget: number        // Token 预算
  
  // 触发条件
  constant: boolean           // 始终注入
  selective: boolean          // 仅在相关时注入
  
  // 位置控制
  position: 'before_char' | 'after_char' | 'top' | 'bottom'
  
  // 元数据
  comment: string             // 备注
  category: string            // 分类
  created_at: number
  updated_at: number
}

export interface Lorebook {
  id: string
  name: string
  description: string
  entries: LorebookEntry[]
  
  // 全局设置
  scan_depth: number          // 扫描深度（最近N条消息）
  token_budget: number        // 总 Token 预算
  recursive_scanning: boolean // 递归扫描
  
  // 元数据
  is_global: boolean          // 是否为全局世界书
  character_ids: string[]     // 关联的角色ID（空表示全局）
  created_at: number
  updated_at: number
}

// 存储键
const STORAGE_KEY_LOREBOOKS = 'lorebooks'
const STORAGE_KEY_GLOBAL_LOREBOOK = 'global_lorebook_id'

/**
 * Lorebook 管理器
 */
class LorebookManager {
  /**
   * 获取所有世界书
   */
  getAllLorebooks(): Lorebook[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOREBOOKS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取世界书失败:', error)
      return []
    }
  }

  /**
   * 获取单个世界书
   */
  getLorebook(id: string): Lorebook | null {
    const lorebooks = this.getAllLorebooks()
    return lorebooks.find(lb => lb.id === id) || null
  }

  /**
   * 创建世界书
   */
  createLorebook(data: Omit<Lorebook, 'id' | 'created_at' | 'updated_at'>): Lorebook {
    const lorebook: Lorebook = {
      ...data,
      id: `lorebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      updated_at: Date.now()
    }

    const lorebooks = this.getAllLorebooks()
    lorebooks.push(lorebook)
    localStorage.setItem(STORAGE_KEY_LOREBOOKS, JSON.stringify(lorebooks))

    return lorebook
  }

  /**
   * 更新世界书
   */
  updateLorebook(id: string, updates: Partial<Lorebook>): boolean {
    try {
      const lorebooks = this.getAllLorebooks()
      const index = lorebooks.findIndex(lb => lb.id === id)
      
      if (index === -1) return false

      lorebooks[index] = {
        ...lorebooks[index],
        ...updates,
        updated_at: Date.now()
      }

      localStorage.setItem(STORAGE_KEY_LOREBOOKS, JSON.stringify(lorebooks))
      return true
    } catch (error) {
      console.error('更新世界书失败:', error)
      return false
    }
  }

  /**
   * 删除世界书
   */
  deleteLorebook(id: string): boolean {
    try {
      const lorebooks = this.getAllLorebooks()
      const filtered = lorebooks.filter(lb => lb.id !== id)
      
      if (filtered.length === lorebooks.length) return false

      localStorage.setItem(STORAGE_KEY_LOREBOOKS, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('删除世界书失败:', error)
      return false
    }
  }

  /**
   * 添加条目
   */
  addEntry(lorebookId: string, entry: Omit<LorebookEntry, 'id' | 'created_at' | 'updated_at'>): LorebookEntry | null {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return null

    const newEntry: LorebookEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: Date.now(),
      updated_at: Date.now()
    }

    lorebook.entries.push(newEntry)
    this.updateLorebook(lorebookId, { entries: lorebook.entries })

    return newEntry
  }

  /**
   * 更新条目
   */
  updateEntry(lorebookId: string, entryId: string, updates: Partial<LorebookEntry>): boolean {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return false

    const entryIndex = lorebook.entries.findIndex(e => e.id === entryId)
    if (entryIndex === -1) return false

    lorebook.entries[entryIndex] = {
      ...lorebook.entries[entryIndex],
      ...updates,
      updated_at: Date.now()
    }

    return this.updateLorebook(lorebookId, { entries: lorebook.entries })
  }

  /**
   * 删除条目
   */
  deleteEntry(lorebookId: string, entryId: string): boolean {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return false

    const filtered = lorebook.entries.filter(e => e.id !== entryId)
    if (filtered.length === lorebook.entries.length) return false

    return this.updateLorebook(lorebookId, { entries: filtered })
  }

  /**
   * 获取全局世界书
   */
  getGlobalLorebook(): Lorebook | null {
    const globalId = localStorage.getItem(STORAGE_KEY_GLOBAL_LOREBOOK)
    if (!globalId) return null
    return this.getLorebook(globalId)
  }

  /**
   * 设置全局世界书
   */
  setGlobalLorebook(lorebookId: string): boolean {
    const lorebook = this.getLorebook(lorebookId)
    if (!lorebook) return false

    localStorage.setItem(STORAGE_KEY_GLOBAL_LOREBOOK, lorebookId)
    return this.updateLorebook(lorebookId, { is_global: true })
  }

  /**
   * 获取角色关联的世界书
   */
  getCharacterLorebooks(characterId: string): Lorebook[] {
    const lorebooks = this.getAllLorebooks()
    return lorebooks.filter(lb => 
      lb.character_ids.includes(characterId) || lb.is_global
    )
  }

  /**
   * 匹配触发的条目
   */
  matchEntries(lorebook: Lorebook, recentMessages: string): LorebookEntry[] {
    const triggered: LorebookEntry[] = []

    for (const entry of lorebook.entries) {
      if (!entry.enabled) continue

      // 始终注入
      if (entry.constant) {
        triggered.push(entry)
        continue
      }

      // 关键词匹配
      for (const key of entry.keys) {
        let matched = false

        if (entry.use_regex) {
          try {
            const regex = new RegExp(key, entry.case_sensitive ? '' : 'i')
            matched = regex.test(recentMessages)
          } catch (error) {
            console.warn(`正则表达式错误: ${key}`, error)
          }
        } else {
          const searchText = entry.case_sensitive ? recentMessages : recentMessages.toLowerCase()
          const searchKey = entry.case_sensitive ? key : key.toLowerCase()
          matched = searchText.includes(searchKey)
        }

        if (matched) {
          triggered.push(entry)
          break
        }
      }
    }

    return triggered
  }

  /**
   * 构建世界书上下文（返回详细信息）
   */
  buildContextWithStats(
    characterId: string,
    recentMessages: string,
    maxTokens: number = 2000
  ): { context: string; triggeredEntries: Array<{ name: string; tokens: number }> } {
    const lorebooks = this.getCharacterLorebooks(characterId)
    if (lorebooks.length === 0) return { context: '', triggeredEntries: [] }

    const allTriggered: LorebookEntry[] = []

    // 收集所有触发的条目
    for (const lorebook of lorebooks) {
      const triggered = this.matchEntries(lorebook, recentMessages)
      allTriggered.push(...triggered)
    }

    if (allTriggered.length === 0) return { context: '', triggeredEntries: [] }

    // 按优先级和插入顺序排序
    allTriggered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // 高优先级在前
      }
      return a.insertion_order - b.insertion_order
    })

    // Token 预算管理（简单估算）
    const selected: LorebookEntry[] = []
    const triggeredEntries: Array<{ name: string; tokens: number }> = []
    let currentTokens = 0

    for (const entry of allTriggered) {
      const estimatedTokens = Math.ceil(entry.content.length / 2)
      
      if (currentTokens + estimatedTokens <= maxTokens) {
        selected.push(entry)
        triggeredEntries.push({ name: entry.key, tokens: estimatedTokens })
        currentTokens += estimatedTokens
      }
    }

    // 按位置分组
    const byPosition: Record<string, LorebookEntry[]> = {
      top: [],
      before_char: [],
      after_char: [],
      bottom: []
    }

    for (const entry of selected) {
      byPosition[entry.position].push(entry)
    }

    // 构建文本
    const parts: string[] = []

    if (byPosition.top.length > 0) {
      parts.push(byPosition.top.map(e => e.content).join('\n\n'))
    }
    if (byPosition.before_char.length > 0) {
      parts.push(byPosition.before_char.map(e => e.content).join('\n\n'))
    }
    if (byPosition.after_char.length > 0) {
      parts.push(byPosition.after_char.map(e => e.content).join('\n\n'))
    }
    if (byPosition.bottom.length > 0) {
      parts.push(byPosition.bottom.map(e => e.content).join('\n\n'))
    }

    return { 
      context: parts.filter(Boolean).join('\n\n'),
      triggeredEntries
    }
  }

  /**
   * 构建世界书上下文
   */
  buildContext(
    characterId: string,
    recentMessages: string,
    maxTokens: number = 2000
  ): string {
    const lorebooks = this.getCharacterLorebooks(characterId)
    if (lorebooks.length === 0) return ''

    const allTriggered: LorebookEntry[] = []

    // 收集所有触发的条目
    for (const lorebook of lorebooks) {
      const triggered = this.matchEntries(lorebook, recentMessages)
      allTriggered.push(...triggered)
    }

    if (allTriggered.length === 0) return ''

    // 按优先级和插入顺序排序
    allTriggered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // 高优先级在前
      }
      return a.insertion_order - b.insertion_order
    })

    // Token 预算管理（简单估算）
    const selected: LorebookEntry[] = []
    let currentTokens = 0

    for (const entry of allTriggered) {
      const estimatedTokens = Math.ceil(entry.content.length / 2)
      
      if (currentTokens + estimatedTokens <= maxTokens) {
        selected.push(entry)
        currentTokens += estimatedTokens
      }
    }

    // 按位置分组
    const byPosition: Record<string, LorebookEntry[]> = {
      top: [],
      before_char: [],
      after_char: [],
      bottom: []
    }

    for (const entry of selected) {
      byPosition[entry.position].push(entry)
    }

    // 构建文本
    const parts: string[] = []

    if (byPosition.top.length > 0) {
      parts.push(byPosition.top.map(e => e.content).join('\n\n'))
    }
    if (byPosition.before_char.length > 0) {
      parts.push(byPosition.before_char.map(e => e.content).join('\n\n'))
    }
    if (byPosition.after_char.length > 0) {
      parts.push(byPosition.after_char.map(e => e.content).join('\n\n'))
    }
    if (byPosition.bottom.length > 0) {
      parts.push(byPosition.bottom.map(e => e.content).join('\n\n'))
    }

    return parts.filter(Boolean).join('\n\n')
  }

  /**
   * 导出世界书（JSON）
   */
  exportLorebook(id: string): string | null {
    const lorebook = this.getLorebook(id)
    if (!lorebook) return null

    return JSON.stringify(lorebook, null, 2)
  }

  /**
   * 导入世界书（JSON）
   * 支持本系统格式和 SillyTavern 格式
   */
  importLorebook(jsonString: string): Lorebook | null {
    try {
      const data = JSON.parse(jsonString)
      
      // 检测是否为 SillyTavern 格式
      if (this.isSillyTavernFormat(data)) {
        return this.importFromSillyTavern(data)
      }
      
      // 本系统格式
      if (!data.name || !Array.isArray(data.entries)) {
        throw new Error('无效的世界书格式')
      }

      // 创建新的世界书
      return this.createLorebook({
        name: data.name,
        description: data.description || '',
        entries: data.entries || [],
        scan_depth: data.scan_depth || 10,
        token_budget: data.token_budget || 2000,
        recursive_scanning: data.recursive_scanning || false,
        is_global: false,
        character_ids: []
      })
    } catch (error) {
      console.error('导入世界书失败:', error)
      return null
    }
  }

  /**
   * 检测是否为 SillyTavern 格式
   */
  private isSillyTavernFormat(data: any): boolean {
    // SillyTavern 格式特征：
    // 1. 有 entries（可能是数组或对象）
    // 2. entries 中的对象有 key/keys 和 content
    // 3. 可能没有 name 字段（使用文件名）
    
    if (!data.entries) return false
    
    // entries 是数组
    if (Array.isArray(data.entries)) {
      return (
        data.entries.length > 0 &&
        (data.entries[0].keys !== undefined || data.entries[0].key !== undefined) &&
        data.entries[0].content !== undefined
      )
    }
    
    // entries 是对象（数字键）
    if (typeof data.entries === 'object') {
      const firstKey = Object.keys(data.entries)[0]
      if (firstKey) {
        const firstEntry = data.entries[firstKey]
        return (
          (firstEntry.keys !== undefined || firstEntry.key !== undefined) &&
          firstEntry.content !== undefined
        )
      }
    }
    
    return false
  }

  /**
   * 从 SillyTavern 格式导入
   */
  private importFromSillyTavern(data: any): Lorebook {
    console.log('检测到 SillyTavern 格式，开始转换...')
    
    // 将 entries 转换为数组（如果是对象格式）
    let entriesArray: any[] = []
    if (Array.isArray(data.entries)) {
      entriesArray = data.entries
    } else if (typeof data.entries === 'object') {
      // 对象格式，转换为数组
      entriesArray = Object.values(data.entries)
    }
    
    console.log(`找到 ${entriesArray.length} 个条目`)
    
    // 转换条目
    const baseTimestamp = Date.now()
    const entries: LorebookEntry[] = entriesArray.map((stEntry: any, index: number) => {
      // 合并主关键词和次要关键词
      const primaryKeys = Array.isArray(stEntry.keys) ? stEntry.keys : (Array.isArray(stEntry.key) ? stEntry.key : [])
      const secondaryKeys = Array.isArray(stEntry.keysecondary) ? stEntry.keysecondary : []
      const allKeys = [...primaryKeys, ...secondaryKeys].filter(k => k && k.trim())
      
      return {
        id: `entry_${baseTimestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        name: stEntry.comment || stEntry.name || `条目 ${index + 1}`,
        keys: allKeys,
        content: stEntry.content || '',
        // 支持 enabled 或 disable 字段
        enabled: stEntry.disable === true ? false : (stEntry.enabled !== false),
        
        // 优先级和顺序
        priority: stEntry.priority !== undefined ? stEntry.priority : 500,
        insertion_order: stEntry.insertion_order !== undefined ? stEntry.insertion_order : (stEntry.order !== undefined ? stEntry.order : index),
        
        // 匹配选项（支持下划线和驼峰命名）
        case_sensitive: stEntry.case_sensitive === true || stEntry.caseSensitive === true,
        use_regex: false, // SillyTavern 默认不用正则
        
        // Token 管理
        token_budget: 200,
        
        // 触发条件
        constant: stEntry.constant === true,
        selective: stEntry.selective === true,
        
        // 位置 - SillyTavern 使用数字，需要转换
        position: this.convertSTPosition(stEntry.position),
        
        // 元数据
        comment: stEntry.comment || '',
        category: stEntry.secondary_keys?.[0] || '',
        created_at: Date.now(),
        updated_at: Date.now()
      }
    })

    // 创建世界书
    return this.createLorebook({
      name: data.name || '导入的世界书',
      description: data.description || '从 SillyTavern 导入',
      entries: entries,
      scan_depth: data.scan_depth || data.scanDepth || 10,
      token_budget: data.token_budget || data.tokenBudget || 2000,
      recursive_scanning: data.recursive_scanning === true || data.recursiveScanning === true,
      is_global: false,
      character_ids: []
    })
  }

  /**
   * 转换 SillyTavern 的位置值
   * SillyTavern: 0=after_char, 1=before_char, 2=top, 3=bottom
   */
  private convertSTPosition(position: any): 'before_char' | 'after_char' | 'top' | 'bottom' {
    if (position === 0 || position === 'after_char') return 'after_char'
    if (position === 1 || position === 'before_char') return 'before_char'
    if (position === 2 || position === 'top') return 'top'
    if (position === 3 || position === 'bottom') return 'bottom'
    return 'before_char' // 默认
  }
}

// 导出单例
export const lorebookManager = new LorebookManager()
