# 🧠 AI 记忆系统使用说明

## 📋 功能概述

AI 记忆系统让 AI 能够真正"记住"你，包括：
- 你的基本信息（名字、年龄、职业等）
- 你的喜好偏好（喜欢什么、讨厌什么）
- 发生的事件（今天做了什么、计划做什么）
- 你的情绪状态（开心、难过、生气等）
- 你们的关系互动（感谢、道歉等）

## ✨ 核心特性

### 1. 自动提取记忆 🤖
AI 会自动从对话中提取重要信息并记住：

**示例对话**:
```
用户: 我叫小明，今年25岁，在北京工作
AI: 好的小明！我记住了~ （自动记录：名字、年龄、工作地点）

用户: 我最喜欢吃草莓了
AI: 草莓很好吃呢！（自动记录：喜好偏好）

用户: 我今天考试考得很好！
AI: 太棒了！（自动记录：事件+情绪）
```

### 2. 智能遗忘机制 ⏰
- 重要的记忆保留更久
- 不重要的记忆会逐渐遗忘
- 经常访问的记忆不容易忘记

**记忆类型遗忘速度**:
- 关系记忆：最慢（几乎不忘）
- 偏好记忆：很慢
- 事实记忆：慢
- 事件记忆：中等
- 情绪记忆：快

### 3. 记忆重要度 ⭐
每条记忆都有重要度评分（1-10）：
- 10分：非常重要（名字、关键信息）
- 7-9分：重要（喜好、工作等）
- 4-6分：一般（日常事件）
- 1-3分：不重要（临时情绪）

### 4. 上下文关联 🔗
AI 会在对话中自然地运用记忆：

**示例**:
```
[第一天]
用户: 我喜欢吃草莓
AI: 好的，我记住了！

[一周后]
用户: 今天吃什么好呢？
AI: 要不要吃草莓？我记得你很喜欢吃呢~ 🍓
```

## 📊 记忆类型详解

### 1. 事实记忆 (fact) 📝
**存储内容**: 客观事实信息
- 名字、年龄、性别
- 职业、学校
- 居住地
- 家庭成员
- 宠物

**提取模式**:
```
"我叫..." → 记录名字
"我今年...岁" → 记录年龄
"我在...工作" → 记录职业
"我住在..." → 记录居住地
"我有..." → 记录拥有物
```

### 2. 偏好记忆 (preference) ❤️
**存储内容**: 喜好和厌恶
- 喜欢/讨厌的食物
- 喜欢/讨厌的活动
- 兴趣爱好
- 恐惧害怕的事物

**提取模式**:
```
"我喜欢..." → 记录喜好
"我讨厌..." → 记录厌恶
"我想要..." → 记录愿望
"我害怕..." → 记录恐惧
```

### 3. 事件记忆 (event) 📅
**存储内容**: 发生的事情
- 今天做了什么
- 计划做什么
- 重要事件

**提取模式**:
```
"我今天..." → 记录当天事件
"我昨天..." → 记录过去事件
"我要..." → 记录计划
```

### 4. 情绪记忆 (emotion) 😊
**存储内容**: 情绪状态
- 开心、快乐
- 难过、伤心
- 生气、愤怒
- 害怕、担心
- 疲惫、困倦

**提取模式**:
```
"开心|高兴|快乐" → 开心
"难过|伤心|沮丧" → 难过
"生气|愤怒|烦躁" → 生气
"害怕|担心|焦虑" → 担心
"累|疲惫|困" → 疲惫
```

### 5. 关系记忆 (relationship) 🤝
**存储内容**: 互动关系
- 感谢
- 道歉
- 关心
- 亲密互动

**提取模式**:
```
"谢谢|感谢" → 表达感谢
"对不起|抱歉" → 表达歉意
```

## 💻 如何在 ChatDetail 中集成

### 第1步：导入 Hook
```typescript
import { useMemory } from '../hooks/useMemory'
```

### 第2步：初始化
```typescript
const { 
  extractMemories, 
  getMemorySummary,
  getRelevantMemories 
} = useMemory(id || '')
```

### 第3步：在 AI 回复后提取记忆
```typescript
// 在 getAIReply 函数中，AI 回复后
const aiReply = await callAI(prompt)

// 提取记忆
if (id) {
  const newMemories = extractMemories(userMessage, aiReply)
  console.log(`💭 提取了 ${newMemories.length} 条新记忆`)
}
```

### 第4步：在提示词中添加记忆
```typescript
// 构建提示词时
const memorySummary = getMemorySummary()

const fullPrompt = `
${systemPrompt}

${memorySummary}

【当前对话】
用户: ${userMessage}
`
```

## 🎯 完整集成示例

```typescript
// 在 ChatDetail.tsx 中
import { useMemory } from '../hooks/useMemory'

const ChatDetail = () => {
  const { id } = useParams()
  const { extractMemories, getMemorySummary } = useMemory(id || '')
  
  const getAIReply = async (userMessage: string) => {
    setIsAiTyping(true)
    
    try {
      // 1. 获取记忆摘要
      const memorySummary = getMemorySummary()
      
      // 2. 构建提示词
      const prompt = `
${systemPrompt}

${memorySummary}

【用户消息】
${userMessage}

请根据你对用户的记忆，给出自然的回复。
`
      
      // 3. 调用 AI
      const aiReply = await callAI(prompt)
      
      // 4. 提取新记忆
      const newMemories = extractMemories(userMessage, aiReply)
      console.log(`💭 提取了 ${newMemories.length} 条新记忆`)
      
      // 5. 添加消息
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'received',
        content: aiReply,
        time: new Date().toLocaleTimeString()
      }])
      
    } catch (error) {
      console.error('AI 回复失败:', error)
    } finally {
      setIsAiTyping(false)
    }
  }
  
  return (
    // ... 组件 JSX
  )
}
```

## 📱 记忆查看器

### 访问方式
```
聊天设置 → 查看记忆
或直接访问: /memory/:characterId
```

### 功能
- 📊 记忆统计（按类型分类）
- 🔍 搜索记忆
- 🏷️ 按类型筛选
- 🗑️ 删除记忆
- 📤 导出记忆

## 🎨 使用技巧

### 1. 主动告诉 AI 重要信息
```
❌ 不好: "嗯"
✅ 好: "我叫小明，今年25岁"
```

### 2. 明确表达喜好
```
❌ 不好: "还行吧"
✅ 好: "我很喜欢这个！"
```

### 3. 描述具体事件
```
❌ 不好: "今天还可以"
✅ 好: "我今天考试考得很好！"
```

### 4. 表达真实情绪
```
❌ 不好: "..."
✅ 好: "我今天很开心！"
```

## 🔧 高级功能

### 1. 手动添加记忆
```typescript
const { addMemory } = useMemory(characterId)

// 添加事实记忆
addMemory('fact', '用户的生日是10月1日', 9)

// 添加偏好记忆
addMemory('preference', '用户喜欢看科幻电影', 7)
```

### 2. 搜索记忆
```typescript
const { searchMemories } = useMemory(characterId)

// 搜索包含"草莓"的记忆
const results = searchMemories('草莓')
```

### 3. 获取统计
```typescript
const { getStatistics } = useMemory(characterId)

const stats = getStatistics()
console.log(`共有 ${stats.total} 条记忆`)
console.log(`事实记忆: ${stats.byType.fact} 条`)
```

## 📊 记忆示例

### 完整对话示例

```
[第1天 - 初次见面]
用户: 你好！我叫小明，今年25岁
AI: 你好小明！很高兴认识你~
💭 记忆: [事实] 用户名字是小明 (重要度: 9)
💭 记忆: [事实] 用户25岁 (重要度: 8)

用户: 我在北京工作，是个程序员
AI: 哇，程序员很厉害呢！
💭 记忆: [事实] 用户在北京工作 (重要度: 7)
💭 记忆: [事实] 用户是程序员 (重要度: 7)

用户: 我最喜欢吃草莓了
AI: 草莓很好吃呢！我记住了~
💭 记忆: [偏好] 用户喜欢草莓 (重要度: 7)

[第2天]
用户: 我今天加班到很晚，好累
AI: 辛苦了小明！早点休息吧~
💭 记忆: [事件] 今天加班到很晚 (重要度: 6)
💭 记忆: [情绪] 用户感到疲惫 (重要度: 4)

[第7天]
用户: 今天吃什么好呢？
AI: 要不要吃草莓？我记得你很喜欢吃呢~ 🍓
（AI 使用了第1天的偏好记忆）

用户: 好主意！你还记得我喜欢吃草莓啊
AI: 当然记得啦！小明喜欢的东西我都会记住的~
（AI 使用了名字记忆）
```

## 🎯 最佳实践

### 1. 对话中自然提及信息
- ✅ 在聊天中自然地分享信息
- ✅ 让 AI 自动提取记忆
- ❌ 不要刻意"填表"

### 2. 定期查看记忆
- 检查 AI 记住了什么
- 删除错误的记忆
- 补充重要信息

### 3. 利用记忆增强互动
- 提及过去的对话
- 测试 AI 是否记得
- 享受被记住的感觉

## 🔮 未来扩展

### 计划中的功能
- 🔗 记忆关联图谱
- 📈 记忆重要度自动调整
- 🎯 基于记忆的主动关心
- 💬 记忆触发的话题
- 📊 记忆可视化

## ❓ 常见问题

### Q: AI 会忘记我吗？
A: 重要的记忆（如名字、喜好）几乎不会忘记。临时的情绪和事件会随时间淡化。

### Q: 可以删除记忆吗？
A: 可以！在记忆查看器中可以删除任何记忆。

### Q: 记忆存储在哪里？
A: 存储在浏览器的 localStorage 中，只在本地，不会上传。

### Q: 记忆会占用很多空间吗？
A: 不会。系统会自动清理低重要度的记忆。

### Q: 可以导出记忆吗？
A: 可以！在记忆查看器中点击"导出"即可。

---

**开始使用**: 现在就和 AI 聊天，让它记住你吧！💭

**查看记忆**: 聊天设置 → 查看记忆

**技术支持**: 查看 `src/utils/memorySystem.ts` 了解实现细节
