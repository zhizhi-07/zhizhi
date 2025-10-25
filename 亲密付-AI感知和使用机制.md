# 亲密付 - AI感知和使用机制 💝

## 🎯 核心机制

### 1️⃣ 双向亲密付系统

亲密付分为两种类型：

| 类型 | 说明 | 谁可以使用 | 场景 |
|------|------|----------|------|
| `user_to_character` | 用户给AI开通 | **AI可以使用** | AI发红包、转账给用户 |
| `character_to_user` | AI给用户开通 | **用户可以使用** | 用户发红包、转账给AI |

### 2️⃣ 关键规则

✅ **用户使用AI的亲密付（character_to_user）**
- 只能在**该AI的聊天窗口**使用
- 发红包/转账时可以勾选"使用亲密付"
- AI会收到消费通知并可以感知

✅ **AI使用用户的亲密付（user_to_character）**
- AI可以在聊天中发红包/转账
- 自动从用户的零钱扣除
- 用户会看到消费记录

---

## 💝 AI感知机制

### **1. 用户消费后AI如何感知？**

当用户使用AI给自己开通的亲密付消费时（发红包/转账），系统会：

#### **Step 1: 记录消费通知**

```typescript
// walletUtils.ts - useCharacterIntimatePay()
export const useCharacterIntimatePay = (
  characterId: string,
  amount: number,
  description: string
): boolean => {
  // ... 扣除额度 ...
  
  // 记录消费通知，供AI感知
  addIntimatePayNotification(characterId, amount, description)
  
  return true
}
```

#### **Step 2: AI获取通知**

在AI准备回复时，系统会：

```typescript
// ChatDetail.tsx - getAIReply()
// 获取亲密付消费通知
if (character?.id) {
  const notifications = getUnreadIntimatePayNotifications(character.id)
  if (notifications.length > 0) {
    intimatePayContext = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💝 亲密付消费通知
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

用户使用了你为TA开通的亲密付，消费记录如下：

1. 2025-01-20 14:30:00
   消费金额：¥50.00
   消费说明：红包：恭喜发财

你可以在回复中提及这些消费，表达关心或询问详情。
`
  }
}
```

这段通知会添加到**系统提示词**中，AI能看到。

#### **Step 3: AI回复**

AI可以在回复中提及消费：

```
用户回复：谢谢红包~
AI回复：不客气呀！看你刚才用亲密付发了红包，是有什么开心的事吗？😊
```

#### **Step 4: 标记已读**

只有当AI**成功回复**后，才标记通知为已读：

```typescript
// ✅ AI成功回复后，标记亲密付通知为已读
if (character?.id) {
  const notifications = getUnreadIntimatePayNotifications(character.id)
  if (notifications.length > 0) {
    markIntimatePayNotificationsAsRead(character.id)
    console.log(`💝 已标记 ${notifications.length} 条亲密付通知为已读`)
  }
}
```

**关键点：**
- ✅ AI成功回复才标记 → 确保AI看到了通知
- ❌ 如果AI调用失败 → 通知不会标记，下次还能看到
- ✅ 防止通知丢失

---

## 🔒 使用限制机制

### **为什么只能在特定AI的聊天窗口使用？**

#### **问题场景：**

假设：
- AI-A 给用户开通了亲密付（1000元/月）
- AI-B 是另一个AI

**错误情况（如果不限制）：**
```
用户在AI-B的聊天窗口 → 发红包 → 勾选"使用亲密付"
→ 使用了AI-A的钱 ❌ （不合理！）
```

#### **正确实现：**

在 `RedEnvelopeSender.tsx` 和 `TransferSender.tsx` 中：

```typescript
// 检查是否有可用的亲密付
useEffect(() => {
  if (show && characterId) {
    const relation = getIntimatePayRelation(characterId)
    
    // ❌ 如果没有找到该AI给用户的亲密付关系
    if (!relation) {
      setIntimatePayAvailable(false)
      return
    }
    
    // ❌ 如果找到的是用户给该AI的亲密付（反向）
    if (relation.type !== 'character_to_user') {
      console.log('❌ 亲密付类型不对，type:', relation.type)
      setIntimatePayAvailable(false)
      return
    }
    
    // ✅ 只有该AI给用户开通的亲密付才能使用
    const remaining = relation.monthlyLimit - relation.usedAmount
    if (remaining > 0) {
      setIntimatePayAvailable(true)
      setIntimatePayRemaining(remaining)
    }
  }
}, [show, characterId])
```

**结果：**
```
✅ 在AI-A的聊天窗口 → 可以使用AI-A的亲密付
❌ 在AI-B的聊天窗口 → 看不到AI-A的亲密付选项
```

---

## 📊 数据结构

### **亲密付关系**

```typescript
export interface IntimatePayRelation {
  id: string
  characterId: string        // 关联的AI ID
  characterName: string
  characterAvatar?: string
  monthlyLimit: number        // 每月额度
  usedAmount: number          // 本月已用
  createdAt: number
  lastResetMonth: string      // 上次重置月份，格式：YYYY-MM
  type: 'user_to_character' | 'character_to_user'  // 关键字段！
}
```

### **亲密付通知**

```typescript
export interface IntimatePayNotification {
  id: string
  characterId: string         // 哪个AI给用户开通的
  amount: number              // 消费金额
  description: string         // 消费说明（如"红包：恭喜发财"）
  timestamp: number
  read: boolean               // AI是否已读
}
```

---

## 🎮 完整流程示例

### **场景1：用户使用AI的亲密付发红包**

```
1. AI-小雪 给用户开通亲密付（1000元/月）
   └─ 创建关系：type = 'character_to_user'

2. 用户在小雪的聊天窗口点击 + → 发红包
   └─ 系统检查：getIntimatePayRelation('小雪ID')
   └─ 找到 type='character_to_user'
   └─ 显示勾选框："使用小雪的亲密付（剩余￥1000.00）" ✅

3. 用户勾选亲密付，发送50元红包
   └─ 调用：useCharacterIntimatePay('小雪ID', 50, '红包：恭喜发财')
   └─ 扣除额度：usedAmount += 50
   └─ 创建通知：addIntimatePayNotification('小雪ID', 50, '红包：恭喜发财')

4. 小雪回复时
   └─ 获取通知：getUnreadIntimatePayNotifications('小雪ID')
   └─ 看到："用户使用了你的亲密付，消费￥50.00，说明：红包：恭喜发财"
   └─ AI回复："哇，谢谢红包！刚才看到你用了亲密付，是有什么开心的事吗？"
   └─ 标记已读：markIntimatePayNotificationsAsRead('小雪ID')

5. 用户在小明的聊天窗口点击 + → 发红包
   └─ 系统检查：getIntimatePayRelation('小明ID')
   └─ 未找到小明给用户的亲密付
   └─ 不显示亲密付选项 ❌
```

### **场景2：用户给AI开通亲密付，AI发红包**

```
1. 用户给AI-小雪开通亲密付（500元/月）
   └─ 创建关系：type = 'user_to_character'

2. 小雪想给用户发红包
   └─ AI回复：[红包:88:新年快乐]
   └─ 系统检查：有没有用户给小雪的亲密付？
   └─ 找到 type='user_to_character'，剩余额度500元
   └─ 从用户零钱扣除88元
   └─ 小雪的亲密付 usedAmount += 88

3. 用户看到交易记录
   └─ "小雪发红包 -￥88.00 (使用亲密付)"
```

---

## ⚙️ 核心函数说明

### **1. 获取亲密付关系**

```typescript
export const getIntimatePayRelation = (characterId: string): IntimatePayRelation | null => {
  const relations = getIntimatePayRelations()
  
  // ✅ 优先查找AI给用户的亲密付（用于红包、转账等场景）
  const characterToUser = relations.find(
    r => r.characterId === characterId && r.type === 'character_to_user'
  )
  if (characterToUser) return characterToUser
  
  // 如果没有，返回用户给AI的亲密付
  return relations.find(
    r => r.characterId === characterId && r.type === 'user_to_character'
  ) || null
}
```

**优先级规则：**
- 在发红包/转账场景 → 优先返回 `character_to_user`（AI给用户的）
- 如果没有 → 返回 `user_to_character`（用户给AI的）

### **2. 用户使用AI的亲密付**

```typescript
export const useCharacterIntimatePay = (
  characterId: string,
  amount: number,
  description: string
): boolean => {
  const relations = getIntimatePayRelations()
  
  // ✅ 只查找 type='character_to_user' 的关系
  const relationIndex = relations.findIndex(
    r => r.characterId === characterId && r.type === 'character_to_user'
  )
  
  if (relationIndex === -1) {
    return false // 未找到该AI给用户的亲密付
  }
  
  // ... 扣除额度 ...
  
  // 添加消费通知
  addIntimatePayNotification(characterId, amount, description)
  
  return true
}
```

---

## 🚀 后续扩展：商城支持

你提到后续会增加商城支持。这里是实现建议：

### **商城使用亲密付**

```typescript
// 在商城购买时
const handleBuyItem = (itemId: string, price: number) => {
  // 检查是否有可用的亲密付（AI给用户的）
  const relation = getIntimatePayRelation(currentAiId)
  
  if (relation && relation.type === 'character_to_user') {
    const remaining = relation.monthlyLimit - relation.usedAmount
    
    if (remaining >= price) {
      // 显示选项：使用亲密付购买
      const useIntimatePay = confirm(
        `是否使用${relation.characterName}的亲密付购买？\n` +
        `商品价格：¥${price}\n` +
        `剩余额度：¥${remaining}`
      )
      
      if (useIntimatePay) {
        // 使用亲密付
        const success = useCharacterIntimatePay(
          currentAiId, 
          price, 
          `商城购买：${itemName}`
        )
        
        if (success) {
          // 购买成功
          // AI会收到通知："用户使用了你的亲密付，消费¥XX，说明：商城购买：XXX"
        }
      }
    }
  }
}
```

---

## 📝 总结

### **核心特点：**

1. ✅ **双向系统** - 用户给AI/AI给用户都可以开通
2. ✅ **隔离使用** - 只能在特定AI的聊天窗口使用该AI的亲密付
3. ✅ **AI感知** - 用户消费后AI能收到通知并做出反应
4. ✅ **智能标记** - 只有AI成功回复后才标记已读，防止通知丢失
5. ✅ **扩展性强** - 后续可以轻松支持商城等场景

### **使用场景：**

| 场景 | 谁开通 | 谁使用 | AI感知 |
|------|-------|-------|--------|
| 发红包给AI | AI给用户 | 用户 | ✅ |
| 转账给AI | AI给用户 | 用户 | ✅ |
| AI发红包给用户 | 用户给AI | AI | ❌ |
| AI转账给用户 | 用户给AI | AI | ❌ |
| 商城购买（未来） | AI给用户 | 用户 | ✅ |

---

**更新时间**: 2025-10-25  
**版本**: v2.0 - 亲密付AI感知机制完善

**现在AI可以准确感知到用户使用亲密付的消费，并且只能在特定AI的聊天窗口使用该AI的亲密付！** 💝
