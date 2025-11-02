# 重构后快速开始指南

## 🎯 重构概述

本次重构优化了项目的代码结构，主要改进：
1. ✅ 简化了 Context Provider 嵌套（13层 → 11层）
2. ✅ 统一了工具函数导出
3. ✅ 提升了代码可读性和可维护性
4. ✅ 100% 向后兼容，无需修改现有代码

---

## 🚀 立即使用

### 1. 使用新的 ContactsContext

ContactsContext 合并了 UserContext 和 CharacterContext，提供统一的联系人管理。

#### 推荐方式（新）
```tsx
import { useContacts } from '@/context/ContactsContext'

function MyComponent() {
  const { 
    // 用户相关
    users, 
    currentUser, 
    currentUserId,
    addUser,
    updateUser,
    switchUser,
    
    // 角色相关
    characters,
    addCharacter,
    updateCharacter,
    getCharacter
  } = useContacts()
  
  return (
    <div>
      <p>当前用户: {currentUser?.name}</p>
      <p>角色数量: {characters.length}</p>
    </div>
  )
}
```

#### 兼容方式（旧）
```tsx
// 仍然可以使用旧的 hooks
import { useUser } from '@/context/ContactsContext'
import { useCharacter } from '@/context/ContactsContext'

function MyComponent() {
  const { currentUser, users } = useUser()
  const { characters, getCharacter } = useCharacter()
  
  // 代码保持不变
}
```

### 2. 使用统一的工具函数导出

#### 推荐方式（新）
```tsx
import { 
  callAI,           // AI API调用
  memorySystem,     // 记忆系统
  compressImage,    // 图片压缩
  getBalance,       // 获取余额
  incrementUnread   // 增加未读消息
} from '@/utils'

async function handleSendMessage() {
  const response = await callAI(messages)
  await memorySystem.addMemory(response)
  incrementUnread(chatId)
}
```

#### 兼容方式（旧）
```tsx
// 仍然可以使用旧的导入方式
import { callAI } from '@/utils/api'
import { memorySystem } from '@/utils/memorySystem'
import { compressImage } from '@/utils/imageUtils'
```

---

## 📦 新增文件

### 1. ContactsContext.tsx
**路径**: `src/context/ContactsContext.tsx`

**功能**: 统一管理用户和角色

**导出**:
- `ContactsProvider` - Provider 组件
- `useContacts()` - 主 hook（推荐）
- `useUser()` - 用户 hook（兼容）
- `useCharacter()` - 角色 hook（兼容）

### 2. AppProviders.tsx
**路径**: `src/context/AppProviders.tsx`

**功能**: 统一管理所有 Context Provider

**使用**:
```tsx
// App.tsx
import { AppProviders } from './context/AppProviders'

function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <Routes>
          {/* 路由 */}
        </Routes>
      </AppProviders>
    </ErrorBoundary>
  )
}
```

### 3. utils/index.ts
**路径**: `src/utils/index.ts`

**功能**: 统一导出所有工具函数

**分类**:
- AI 相关: `callAI`, `memorySystem`, `lorebookManager`
- 存储相关: `getItem`, `setItem`, `IDB`, `storageObserver`
- 社交功能: `generateAIMoment`, `recordSparkMoment`
- 支付相关: `sendRedEnvelope`, `getBalance`
- 媒体处理: `compressImage`, `getAvatarUrl`
- 聊天相关: `incrementUnread`, `updateChatListLastMessage`

---

## 🔄 迁移步骤（可选）

如果你想使用新的 API，可以按以下步骤迁移：

### 步骤 1: 更新 Context 导入

```tsx
// 旧代码
import { useUser } from '@/context/UserContext'
import { useCharacter } from '@/context/CharacterContext'

// 新代码
import { useContacts } from '@/context/ContactsContext'
```

### 步骤 2: 更新 Hook 使用

```tsx
// 旧代码
const { currentUser } = useUser()
const { characters } = useCharacter()

// 新代码
const { currentUser, characters } = useContacts()
```

### 步骤 3: 更新工具函数导入

```tsx
// 旧代码
import { callAI } from '@/utils/api'
import { memorySystem } from '@/utils/memorySystem'

// 新代码
import { callAI, memorySystem } from '@/utils'
```

---

## ⚠️ 注意事项

### 1. 向后兼容
- ✅ 所有旧的 API 仍然可用
- ✅ 不需要立即迁移
- ✅ 可以渐进式迁移

### 2. 性能优化
- ✅ 新的 ContactsContext 使用了 `useMemo` 优化
- ✅ 减少了不必要的重渲染
- ✅ 提升了整体性能

### 3. 代码风格
- ✅ 推荐使用新的 API
- ✅ 新代码应该使用新的导入方式
- ✅ 旧代码可以保持不变

---

## 📚 完整示例

### 示例 1: 聊天组件

```tsx
import { useContacts } from '@/context/ContactsContext'
import { callAI, memorySystem, incrementUnread } from '@/utils'

function ChatComponent({ chatId }: { chatId: string }) {
  const { currentUser, getCharacter } = useContacts()
  const character = getCharacter(chatId)
  
  const handleSendMessage = async (content: string) => {
    // 调用 AI
    const response = await callAI([
      { role: 'user', content }
    ])
    
    // 保存记忆
    await memorySystem.addMemory({
      content: response,
      characterId: chatId,
      timestamp: Date.now()
    })
    
    // 增加未读消息
    incrementUnread(chatId)
  }
  
  return (
    <div>
      <h1>与 {character?.name} 聊天</h1>
      <p>当前用户: {currentUser?.name}</p>
      {/* 聊天界面 */}
    </div>
  )
}
```

### 示例 2: 联系人列表

```tsx
import { useContacts } from '@/context/ContactsContext'

function ContactsList() {
  const { users, characters, currentUserId, switchUser } = useContacts()
  
  return (
    <div>
      <h2>用户列表</h2>
      {users.map(user => (
        <div 
          key={user.id}
          onClick={() => switchUser(user.id)}
          className={user.id === currentUserId ? 'active' : ''}
        >
          {user.name}
        </div>
      ))}
      
      <h2>AI 角色列表</h2>
      {characters.map(char => (
        <div key={char.id}>
          {char.name}
        </div>
      ))}
    </div>
  )
}
```

---

## 🎓 最佳实践

### 1. 使用新的 API
```tsx
// ✅ 推荐
import { useContacts } from '@/context/ContactsContext'
import { callAI, memorySystem } from '@/utils'

// ❌ 不推荐（虽然仍然可用）
import { useUser } from '@/context/UserContext'
import { callAI } from '@/utils/api'
```

### 2. 按需导入
```tsx
// ✅ 推荐 - 只导入需要的
import { callAI, memorySystem } from '@/utils'

// ❌ 不推荐 - 导入全部
import * as Utils from '@/utils'
```

### 3. 使用 TypeScript
```tsx
// ✅ 推荐 - 利用类型提示
import { useContacts } from '@/context/ContactsContext'
import type { Character, User } from '@/context/ContactsContext'

const { characters } = useContacts()
const character: Character = characters[0]
```

---

## 🐛 常见问题

### Q: 我需要修改现有代码吗？
**A**: 不需要。所有旧的 API 仍然可用，代码可以正常运行。

### Q: 新的 API 有什么优势？
**A**: 
- 更好的性能（使用 useMemo 优化）
- 更清晰的代码结构
- 更好的类型提示
- 更少的导入语句

### Q: 如何逐步迁移？
**A**: 
1. 新功能使用新 API
2. 修改旧代码时顺便更新
3. 不着急一次性全部迁移

### Q: 遇到问题怎么办？
**A**: 
1. 查看 [重构总结](./REFACTORING_SUMMARY.md)
2. 查看 [重构计划](./REFACTORING_PLAN.md)
3. 检查类型定义和注释

---

## 📖 相关文档

- [重构计划](./REFACTORING_PLAN.md) - 详细的重构计划
- [重构进度](./REFACTORING_PROGRESS.md) - 实时更新的进度
- [重构总结](./REFACTORING_SUMMARY.md) - 完整的总结报告

---

**最后更新**: 2025-11-02  
**版本**: 1.0.0

