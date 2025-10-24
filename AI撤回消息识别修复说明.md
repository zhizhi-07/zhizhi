# AI撤回消息识别修复说明

## 问题描述
AI把自己撤回的消息当成用户撤回的消息，无法正确区分撤回者。

## 问题根源
在撤回消息时，原始的 `msg.type` 信息（`'sent'` 或 `'received'`）被改成了 `'system'`，导致后续无法判断是谁撤回的消息。

之前的判断逻辑使用文本匹配：
```typescript
const isUserRecalled = msg.content.includes('你撤回了')
const isAIRecalled = msg.content.includes('撤回了一条消息') && !isUserRecalled
```

这种方式不够准确，容易出错。

## 修复方案

### 1. 添加 `originalType` 字段
在 `Message` 接口中添加新字段：
```typescript
originalType?: 'received' | 'sent'  // 撤回前的原始消息类型（用于判断是谁撤回的）
```

### 2. 保存原始类型
在撤回消息时保存原始的消息类型：

**用户手动撤回（ChatDetail.tsx 第1318行）：**
```typescript
originalType: msg.type as 'received' | 'sent', // 保存原始消息类型
```

**AI自动撤回（ChatDetail.tsx 第3166行）：**
```typescript
originalType: msg.type as 'received' | 'sent', // 保存原始消息类型
```

### 3. 使用 `originalType` 判断撤回者
更新判断逻辑（ChatDetail.tsx 第2174-2175行）：
```typescript
// 使用 originalType 判断是用户撤回还是AI撤回（更准确）
const isUserRecalled = msg.originalType === 'sent'
const isAIRecalled = msg.originalType === 'received'
```

### 4. 更新提示词说明
在 `prompts.ts` 中明确标注两种撤回格式：
```
[撤回了消息: "xxx"] = 用户撤回了，但你看到了原话
[我撤回了消息: "xxx"] = 你自己撤回了，这是你撤回的原话
```

在 `ChatDetail.tsx` 的提示词中也添加了清晰的说明：
```
当你看到 [撤回了消息: "xxx"] 这样的格式时，说明**用户**撤回了一条消息。
当你看到 [我撤回了消息: "xxx"] 这样的格式时，说明**你自己**撤回了一条消息。
```

## 修复效果

### 修复前
- ❌ AI看到自己撤回的消息，误以为是用户撤回的
- ❌ AI会错误地回应："你怎么撤回了？"

### 修复后
- ✅ AI能正确识别是自己撤回的消息
- ✅ AI会看到 `[我撤回了消息: "xxx"]` 格式
- ✅ AI能理解自己撤回了什么内容
- ✅ 控制台会输出：`🔄 发现撤回消息，原内容: xxx, 撤回者: AI, originalType: received`

## 技术细节

### 消息类型映射
- `type: 'sent'` → 用户发送的消息 → 撤回后显示 `[撤回了消息: "xxx"]`
- `type: 'received'` → AI发送的消息 → 撤回后显示 `[我撤回了消息: "xxx"]`
- `type: 'system'` → 系统消息（撤回后的显示类型）

### 数据结构
```typescript
{
  id: 123,
  type: 'system',              // 撤回后改为system
  originalType: 'received',    // 保存原始类型（received = AI的消息）
  isRecalled: true,
  recalledContent: "原始内容",
  content: "XX撤回了一条消息"
}
```

## 兼容性
- ✅ 旧数据没有 `originalType` 字段，会被识别为 `undefined`，不影响正常使用
- ✅ 新撤回的消息都会保存 `originalType`，能正确识别
- ✅ 不影响其他消息类型的处理

## 测试验证
1. 用户撤回消息 → AI看到 `[撤回了消息: "xxx"]`
2. AI撤回消息 → AI看到 `[我撤回了消息: "xxx"]`
3. 控制台日志会显示正确的撤回者信息

## 修复时间
2025年10月24日

## 影响范围
- ✅ 单聊场景（ChatDetail.tsx）
- ✅ 撤回消息的AI理解
- ✅ 提示词系统（prompts.ts）
- ✅ 控制台日志输出
