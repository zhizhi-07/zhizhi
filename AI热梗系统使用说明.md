# AI动态热梗系统 - 使用说明

## 📋 系统概述

AI动态热梗系统会自动检测用户消息中的关键词，并为AI提供相关的网络热梗建议，让AI的回复更加生动、有趣、贴近网络文化。

## 🎯 核心功能

### 1. 自动检索热梗
- 系统会分析用户的每条消息
- 根据关键词匹配梗库中的热梗
- 最多返回3个相关热梗

### 2. 智能提示
- 将匹配到的热梗以提示词形式提供给AI
- AI可以根据人设和情境选择是否使用
- 不会强制AI使用热梗

### 3. 自然融入
- 热梗的使用完全由AI根据人设决定
- 符合角色性格和当前对话情境
- 避免生硬和刻意

## 📁 文件结构

```
src/utils/memesRetrieval.ts    # 热梗检索模块
src/pages/ChatDetail.tsx        # 单聊页面（已集成）
```

## 🔧 技术实现

### 1. 数据结构

```typescript
export interface Meme {
  id: number
  '梗': string
  '含义': string
  keywords: string[]
}
```

### 2. 核心函数

#### `retrieveMemes(userMessage: string, maxResults?: number)`
- **功能**：检索匹配的热梗
- **参数**：
  - `userMessage`: 用户消息内容
  - `maxResults`: 最多返回的梗数量（默认3个）
- **返回**：`Promise<Meme[]>` 匹配到的梗数组

#### `generateMemesPrompt(memes: Meme[])`
- **功能**：生成热梗提示词
- **参数**：`memes` - 梗对象数组
- **返回**：格式化的提示词字符串

### 3. 集成方式

在 `ChatDetail.tsx` 的 `getAIReply` 函数中：

```typescript
// 🔥 检索热梗
const { retrieveMemes, generateMemesPrompt } = await import('../utils/memesRetrieval')
const lastUserMessage = currentMessages.filter(m => m.type === 'sent').slice(-1)[0]
const userMessageContent = lastUserMessage?.content || ''
const matchedMemes = await retrieveMemes(userMessageContent, 3)
const memesPrompt = generateMemesPrompt(matchedMemes)

if (matchedMemes.length > 0) {
  console.log('🔥 检测到热梗:', matchedMemes.map(m => m['梗']).join(', '))
}

// 将热梗提示词添加到系统提示中
let fullSystemPrompt = systemPrompt + ... + memesPrompt + ...
```

## 📝 梗库示例

当前梗库包含以下热梗（部分）：

1. **n✅** - "嗯对"的高级用法
2. **无可奉告！** - 不想回答时使用
3. **尊嘟假嘟** - "真的假的"
4. **我不行了** - 表示累了、顶不住了
5. **宝子** - 阴阳怪气的称呼
6. **救命宝子你要干嘛** - 表示惊讶
7. **你们那边不回信息判几年** - 催促回消息
8. **听话乖，咱不活了** - 幽默的绝望表达
9. **别太邪门** - 形容事情离谱
10. **那咋了** - 不纠结、不焦虑的态度

## 🎭 使用效果

### 示例1：用户说"真的吗？"

**系统检测**：
- 匹配到关键词："真的"
- 推荐热梗：【尊嘟假嘟】

**AI提示词**：
```
🔥 热梗提示（可选使用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

检测到用户消息可能适合使用以下热梗，你可以自然地使用它们：

1. 【尊嘟假嘟】
   含义：真的假的

⚠️ 使用建议：
• 只在合适的时候使用，不要强行使用
• 要符合你的人设和当前情境
• 可以不用，正常回复也完全OK
• 使用时要自然，不要显得刻意
```

**AI可能的回复**：
- 活泼型：`尊嘟假嘟！这也太离谱了吧`
- 正常型：`真的啊，我没骗你`
- 高冷型：`嗯，真的`

### 示例2：用户说"你怎么不回我消息"

**系统检测**：
- 匹配到关键词："不回"、"消息"
- 推荐热梗：【你们那边不回信息判几年】

**AI可能的回复**：
- 调皮型：`你们那边不回信息判几年啊哈哈哈`
- 正常型：`抱歉刚才在忙`
- 傲娇型：`我就是不想回，怎么了`

## ⚙️ 配置说明

### 修改梗库

在 `src/utils/memesRetrieval.ts` 中的 `memesData` 数组中添加或修改梗：

```typescript
{
  id: 新ID,
  '梗': "梗的内容",
  '含义': "梗的含义和使用场景",
  keywords: ["关键词1", "关键词2", "关键词3"]
}
```

### 调整返回数量

修改 `retrieveMemes` 函数调用时的 `maxResults` 参数：

```typescript
const matchedMemes = await retrieveMemes(userMessageContent, 5) // 返回最多5个梗
```

### 禁用热梗系统

注释掉 `ChatDetail.tsx` 中的热梗检索代码：

```typescript
// const { retrieveMemes, generateMemesPrompt } = await import('../utils/memesRetrieval')
// const matchedMemes = await retrieveMemes(userMessageContent, 3)
// const memesPrompt = generateMemesPrompt(matchedMemes)
const memesPrompt = '' // 设置为空字符串
```

## 🎯 最佳实践

### 1. 关键词设置
- 每个梗至少设置5-10个关键词
- 包含同义词、相关词、使用场景词
- 关键词要具体、准确

### 2. 梗的选择
- 选择流行度高、使用广泛的梗
- 避免过于小众或过时的梗
- 考虑不同年龄层和文化背景

### 3. 提示词设计
- 明确告诉AI这是"可选"使用
- 强调要符合人设和情境
- 避免强制AI使用热梗

## 🐛 故障排除

### 问题1：热梗没有被检测到
**原因**：关键词匹配不到
**解决**：
1. 检查用户消息内容
2. 查看梗库中的关键词设置
3. 添加更多相关关键词

### 问题2：AI不使用推荐的热梗
**原因**：AI根据人设判断不合适
**解决**：
1. 这是正常现象，AI有自主判断权
2. 检查AI的人设是否适合使用热梗
3. 调整提示词，增加使用建议

### 问题3：热梗使用过于频繁
**原因**：关键词设置过于宽泛
**解决**：
1. 精简关键词，提高匹配精度
2. 减少返回的梗数量
3. 在提示词中强调"适度使用"

## 📊 性能优化

### 1. 异步加载
使用动态导入避免影响页面加载速度：
```typescript
const { retrieveMemes, generateMemesPrompt } = await import('../utils/memesRetrieval')
```

### 2. 缓存优化
可以考虑缓存最近匹配的热梗，避免重复检索。

### 3. 梗库大小
当前梗库包含15个热梗，可以根据需要扩展到100+个。

## 🔮 未来扩展

### 1. 动态梗库
- 从API获取最新热梗
- 定期更新梗库内容
- 支持用户自定义梗

### 2. 智能推荐
- 根据AI人设推荐合适的梗
- 根据对话历史推荐梗
- 学习用户偏好

### 3. 多场景支持
- 群聊热梗推荐
- 朋友圈热梗推荐
- 不同场景不同梗库

## 📞 技术支持

如有问题或建议，请查看项目文档或提交Issue。

---

**版本**：v1.0.0  
**最后更新**：2025-01-22  
**作者**：汁汁项目团队
