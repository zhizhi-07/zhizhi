# 🍺 SillyTavern 玩家专业建议 - 完整版

> 作为 SillyTavern 重度玩家的全面改进建议  
> 创建时间: 2024年10月24日

---

## 🔥 紧急修复：PNG 导入问题

### 当前问题
- **错误**: "Maximum call stack exceeded"
- **位置**: Character Card PNG 导入功能

### 可能原因
1. 递归调用过深
2. 循环引用（对象互相引用）
3. 数据结构过大导致 JSON.stringify 失败
4. PNG 解析时的无限循环

### 需要检查的文件
- `src/pages/CreateCharacter.tsx`
- `src/pages/CharacterDetail.tsx`
- `src/utils/characterCard.ts`（如果存在）
- PNG 解析相关代码

### 修复建议
```typescript
// 安全的 PNG 解析
async function parsePNGCharacterCard(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // 查找 tEXt chunk (避免递归)
    let textChunk = null
    for (let i = 0; i < uint8Array.length - 4; i++) {
      if (
        uint8Array[i] === 0x74 &&     // 't'
        uint8Array[i+1] === 0x45 &&   // 'E'
        uint8Array[i+2] === 0x58 &&   // 'X'
        uint8Array[i+3] === 0x74      // 't'
      ) {
        // 找到 tEXt chunk，提取数据
        // ... 提取逻辑
        break // 重要：找到后立即退出
      }
    }
    
    if (!textChunk) {
      throw new Error('不是有效的 Character Card PNG')
    }
    
    // 解码（避免循环引用）
    const jsonString = atob(textChunk)
    const card = JSON.parse(jsonString)
    
    // 清理循环引用
    return cleanCircularReferences(card)
    
  } catch (error) {
    console.error('PNG 解析失败:', error)
    throw error
  }
}

// 清理循环引用
function cleanCircularReferences(obj: any, seen = new WeakSet()): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (seen.has(obj)) {
    return undefined // 跳过循环引用
  }
  
  seen.add(obj)
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanCircularReferences(item, seen))
  }
  
  const cleaned: any = {}
  for (const key in obj) {
    cleaned[key] = cleanCircularReferences(obj[key], seen)
  }
  
  return cleaned
}
```

---

## 📊 功能优先级列表

### 🔥 P0 - 必须立即修复
1. **PNG 导入修复** - 当前已损坏
2. **Character Card V2 完整支持** - 导入/导出

### 🔥 P1 - 核心功能（1-2周内）
3. **Lorebook/World Info 系统** - 知识库
4. **Swipe 重新生成功能** - 多候选回复
5. **Token 计数器** - 上下文管理

### 🔥 P2 - 体验优化（1个月内）
6. **Instruct 模式支持** - 多种提示词格式
7. **高级采样参数** - 精细控制
8. **Regex 输出过滤** - 后处理
9. **快速回复** - 常用短语
10. **聊天分支** - 多线剧情

### 🔥 P3 - 长期优化
11. **桌面端适配**
12. **云同步**
13. **插件系统**

---

## 🎯 核心功能详细说明

### 1. Character Card V2 支持

#### 必须支持的字段
```typescript
interface CharacterCardV2 {
  spec: "chara_card_v2"
  spec_version: "2.0"
  data: {
    // 基础字段
    name: string
    description: string
    personality: string
    scenario: string
    first_mes: string
    mes_example: string
    
    // 高级字段
    creator_notes: string
    system_prompt: string
    post_history_instructions: string
    alternate_greetings: string[]
    
    // 角色书（重要！）
    character_book?: {
      entries: Array<{
        keys: string[]
        content: string
        enabled: boolean
        insertion_order: number
        case_sensitive: boolean
        priority: number
        constant: boolean
      }>
    }
    
    // 元数据
    tags: string[]
    creator: string
    character_version: string
  }
}
```

#### 导入流程
1. 读取 PNG 文件
2. 提取 tEXt chunk 中的 "chara" 数据
3. Base64 解码
4. JSON 解析
5. 验证格式
6. 导入到系统
7. 转换 character_book 为 Lorebook

#### 导出流程
1. 收集角色数据
2. 转换为 V2 格式
3. JSON 序列化
4. Base64 编码
5. 嵌入到 PNG tEXt chunk
6. 下载文件

---

### 2. Lorebook 系统

#### 核心数据结构
```typescript
interface LorebookEntry {
  id: string
  keys: string[]              // 触发关键词
  content: string             // 注入内容
  enabled: boolean
  priority: number            // 0-999
  insertion_order: number
  case_sensitive: boolean
  use_regex: boolean
  token_budget: number
  constant: boolean           // 始终注入
  position: 'before_char' | 'after_char'
}
```

#### 匹配引擎
```typescript
function matchLorebookEntries(
  lorebook: Lorebook,
  recentMessages: string
): LorebookEntry[] {
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
      const regex = entry.use_regex 
        ? new RegExp(key, entry.case_sensitive ? '' : 'i')
        : new RegExp(escapeRegex(key), entry.case_sensitive ? '' : 'i')
      
      if (regex.test(recentMessages)) {
        triggered.push(entry)
        break
      }
    }
  }
  
  return triggered
}
```

#### 集成到提示词
```typescript
function buildPromptWithLorebook(
  character: Character,
  messages: Message[],
  lorebook: Lorebook
): string {
  // 1. 扫描最近消息
  const recentText = messages.slice(-10).map(m => m.content).join('\n')
  
  // 2. 匹配条目
  const triggered = matchLorebookEntries(lorebook, recentText)
  
  // 3. 排序和预算管理
  triggered.sort((a, b) => b.priority - a.priority)
  const selected = selectWithinBudget(triggered, lorebook.token_budget)
  
  // 4. 构建提示词
  const lorebookText = selected.map(e => e.content).join('\n\n')
  
  return `
${systemPrompt}

【世界观知识】
${lorebookText}

【角色设定】
${character.description}

【对话】
${formatMessages(messages)}
`
}
```

---

### 3. Swipe 功能

#### 数据结构
```typescript
interface Message {
  id: number
  content: string
  swipes?: string[]      // 所有候选回复
  swipeIndex?: number    // 当前索引
}
```

#### 核心功能
```typescript
// 重新生成
async function regenerateMessage(messageId: number) {
  const message = messages.find(m => m.id === messageId)
  const newReply = await callAI(prompt)
  
  if (!message.swipes) {
    message.swipes = [message.content]
    message.swipeIndex = 0
  }
  
  message.swipes.push(newReply)
  message.swipeIndex = message.swipes.length - 1
  message.content = newReply
}

// 切换
function swipeMessage(messageId: number, direction: 'left' | 'right') {
  const message = messages.find(m => m.id === messageId)
  if (!message?.swipes) return
  
  if (direction === 'left') {
    message.swipeIndex = Math.max(0, message.swipeIndex! - 1)
  } else {
    message.swipeIndex = Math.min(
      message.swipes.length - 1,
      message.swipeIndex! + 1
    )
  }
  
  message.content = message.swipes[message.swipeIndex]
}
```

#### UI 设计
- 长按消息显示"重新生成"
- 左右滑动切换版本
- 显示版本号 (2/5)
- 删除不喜欢的版本

---

### 4. Token 计数器

#### 实现方案
```typescript
import { encode } from 'gpt-tokenizer'

function countTokens(text: string): number {
  try {
    return encode(text).length
  } catch {
    // 简单估算
    return Math.ceil(text.length / 2)
  }
}

function calculateContextTokens(
  systemPrompt: string,
  messages: Message[],
  lorebook: string
): TokenStats {
  return {
    system: countTokens(systemPrompt),
    lorebook: countTokens(lorebook),
    messages: messages.reduce((sum, m) => sum + countTokens(m.content), 0),
    total: /* 总和 */,
    remaining: contextLimit - total,
    percentage: (total / contextLimit) * 100
  }
}
```

#### UI 显示
```
┌─────────────────────────────┐
│ 📊 2,341 / 4,096 tokens     │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░ 57%       │
│ 系统:500 知识库:300 消息:1541│
└─────────────────────────────┘
```

---

## 🎨 UI/UX 改进

### 桌面端适配
- 左侧角色列表
- 右侧聊天区域
- 快捷键支持
- 多窗口支持

### 主题系统
- 酒馆经典主题
- 自定义 CSS
- 消息气泡样式库

### 角色管理
- 多头像/表情包
- 根据情绪切换
- GIF 支持

---

## 📦 数据管理

### 导入/导出
- Character Card PNG
- Character Card JSON
- 聊天记录 Markdown
- 完整备份 ZIP

### 云同步
- WebDAV 支持
- GitHub Gist
- 自动备份

### 搜索功能
- 全文搜索
- 按日期筛选
- 按角色筛选

---

## 🔧 技术实现建议

### 性能优化
- 虚拟滚动（长对话）
- 懒加载图片
- IndexedDB 优化
- Web Worker 处理

### 离线支持
- PWA
- Service Worker
- 本地模型（Ollama）

### 插件系统
- JS 插件 API
- 扩展功能
- 社区插件市场

---

## 📝 实现路线图

### 第一阶段（1周）
- [x] 修复 PNG 导入
- [ ] 完善 Character Card V2 支持
- [ ] 基础 Lorebook 功能

### 第二阶段（2周）
- [ ] Swipe 功能
- [ ] Token 计数器
- [ ] Instruct 模式

### 第三阶段（1个月）
- [ ] 高级采样参数
- [ ] Regex 脚本
- [ ] 快速回复
- [ ] 聊天分支

### 第四阶段（长期）
- [ ] 桌面端适配
- [ ] 云同步
- [ ] 插件系统

---

## 💡 差异化优势

### 相比 SillyTavern
✅ **移动端体验更好** - 酒馆在手机上难用  
✅ **社交生态独特** - 朋友圈、群聊  
✅ **记忆系统更智能** - 自动提取  
✅ **UI 更现代** - 微信风格  
✅ **国内用户友好** - 中文优化

### 建议保持的特色
- 朋友圈社交系统
- 红包/转账互动
- 音乐播放器
- 记账功能
- 群聊功能

---

## 🎯 总结

### 最优先实现（本周）
1. **修复 PNG 导入** - 当前已损坏
2. **Lorebook 基础功能** - 补齐核心
3. **Swipe 功能** - 体验提升巨大

### 核心竞争力
- 移动端 + 社交生态 + 智能记忆
- 补齐酒馆的核心功能
- 保持独特的社交特色

### 长期目标
- 成为最好的移动端 AI 聊天应用
- 兼容酒馆生态（Character Card）
- 建立自己的特色功能

---

**文档版本**: v1.0  
**创建时间**: 2024-10-24  
**下次更新**: 实现进度更新时
