# ChatDetail 模块使用指南

## 📚 快速开始

### 导入方式

```typescript
// 方式1: 从主索引导入
import { 
  useChatMessages, 
  useChatScroll,
  ChatHeader,
  MessageBubble,
  Message,
  formatTimestamp
} from '@/pages/ChatDetail'

// 方式2: 从子模块导入
import { useChatMessages } from '@/pages/ChatDetail/hooks'
import { ChatHeader } from '@/pages/ChatDetail/components'
import { Message } from '@/pages/ChatDetail/types'
import { formatTimestamp } from '@/pages/ChatDetail/utils'
```

## 🎣 Hooks 使用指南

### 1. useChatMessages - 消息管理

```typescript
const { 
  messages,           // 消息列表
  addMessage,         // 添加消息
  updateMessage,      // 更新消息
  deleteMessage,      // 删除消息
  recallMessage,      // 撤回消息
  batchDeleteMessages // 批量删除
} = useChatMessages(chatId)

// 添加消息
addMessage({
  type: 'sent',
  content: 'Hello!',
  messageType: 'text'
})

// 撤回消息
recallMessage(messageId)

// 批量删除
batchDeleteMessages([id1, id2, id3])
```

### 2. useChatScroll - 滚动管理

```typescript
const {
  displayCount,        // 当前显示的消息数量
  isLoadingMore,       // 是否正在加载更多
  messagesContainerRef,// 消息容器ref
  scrollToBottom       // 滚动到底部
} = useChatScroll(totalMessageCount, chatId)

// 滚动到底部
scrollToBottom(true) // 平滑滚动
scrollToBottom(false) // 立即滚动

// 使用ref
<div ref={messagesContainerRef}>
  {/* 消息列表 */}
</div>
```

### 3. useChatInput - 输入管理

```typescript
const {
  inputValue,      // 输入框内容
  setInputValue,   // 设置输入内容
  quotedMessage,   // 引用的消息
  setQuote,        // 设置引用
  cancelQuote,     // 取消引用
  editingMessage,  // 正在编辑的消息
  startEdit,       // 开始编辑
  cancelEdit,      // 取消编辑
  finishEdit,      // 完成编辑
  clearInput       // 清空输入
} = useChatInput()

// 引用消息
setQuote(message)

// 编辑消息
startEdit(message)
finishEdit(newContent)
```

### 4. useChatModals - 弹窗管理

```typescript
const {
  showMenu,
  setShowMenu,
  showRedEnvelopeSender,
  setShowRedEnvelopeSender,
  // ... 20+ 个弹窗状态
} = useChatModals()

// 打开红包发送弹窗
setShowRedEnvelopeSender(true)

// 关闭菜单
setShowMenu(false)
```

### 5. useChatBackground - 背景管理

```typescript
const {
  background,      // 当前背景
  setBackground,   // 设置背景
  backgroundStyle  // 背景样式对象
} = useChatBackground(chatId)

// 设置背景
setBackground('url(/images/bg.jpg)')

// 应用背景样式
<div style={backgroundStyle}>
  {/* 内容 */}
</div>
```

### 6. useChatBubbles - 气泡样式

```typescript
const {
  userBubbleColor,    // 用户气泡颜色
  aiBubbleColor,      // AI气泡颜色
  setUserBubbleColor, // 设置用户气泡颜色
  setAIBubbleColor,   // 设置AI气泡颜色
  userBubbleCSS,      // 用户气泡CSS
  aiBubbleCSS,        // AI气泡CSS
  redEnvelopeCover,   // 红包封面
  transferCover       // 转账封面
} = useChatBubbles(chatId)

// 设置气泡颜色
setUserBubbleColor('#95EC69')
setAIBubbleColor('#FFFFFF')
```

### 7. useChatNotifications - 通知管理

```typescript
useChatNotifications({
  chatId,
  character,
  messages
})

// 自动处理:
// - 页面可见性监听
// - 未读消息计数
// - 后台通知发送
```

### 8. useChatSettings - 设置管理

```typescript
const {
  enableNarration,      // 是否启用旁白
  setEnableNarration,   // 设置旁白
  aiMessageLimit,       // AI消息读取数量
  setAIMessageLimit,    // 设置消息数量
  hasCoupleSpaceActive  // 情侣空间是否激活
} = useChatSettings(chatId)

// 切换旁白
setEnableNarration(!enableNarration)

// 设置AI读取消息数量
setAIMessageLimit(50)
```

### 9. useChatMessageActions - 消息操作

```typescript
const {
  longPressedMessage,      // 长按的消息
  handleLongPressStart,    // 长按开始
  handleLongPressEnd,      // 长按结束
  isBatchDeleteMode,       // 批量删除模式
  selectedMessageIds,      // 选中的消息ID
  toggleBatchDeleteMode,   // 切换批量删除模式
  toggleMessageSelection   // 切换消息选中
} = useChatMessageActions()

// 长按消息
<div
  onTouchStart={(e) => handleLongPressStart(message, e)}
  onTouchEnd={handleLongPressEnd}
>
  {/* 消息内容 */}
</div>

// 批量删除
toggleBatchDeleteMode()
toggleMessageSelection(messageId)
```

### 10. useChatAIState - AI状态

```typescript
const {
  isAiTyping,      // AI是否正在输入
  startAITyping,   // 开始AI输入
  stopAITyping     // 停止AI输入
} = useChatAIState()

// 开始AI回复
startAITyping()
// ... AI处理
stopAITyping()
```

## 🧩 组件使用指南

### 1. ChatHeader - 聊天头部

```typescript
<ChatHeader
  character={character}
  onBack={() => navigate(-1)}
  onMenuClick={() => setShowMenu(true)}
  onStatusClick={() => setShowCharacterStatus(true)}
  tokenStats={tokenStats}
  showTokenStats={true}
/>
```

### 2. ChatInput - 输入框

```typescript
<ChatInput
  inputValue={inputValue}
  onInputChange={setInputValue}
  onSend={handleSend}
  onAIReply={handleAIReply}
  onAddClick={() => setShowAddMenu(true)}
  onEmojiClick={() => setShowEmojiPanel(true)}
  isAiTyping={isAiTyping}
  quotedMessage={quotedMessage}
  onCancelQuote={cancelQuote}
  editingMessage={editingMessage}
  onCancelEdit={cancelEdit}
/>
```

### 3. MessageBubble - 消息气泡

```typescript
<MessageBubble
  message={message}
  character={character}
  currentUser={currentUser}
  userBubbleColor={userBubbleColor}
  aiBubbleColor={aiBubbleColor}
  onLongPressStart={handleLongPressStart}
  onLongPressEnd={handleLongPressEnd}
  onClick={handleMessageClick}
  isSelected={selectedMessageIds.has(message.id)}
/>
```

## 🛠️ 工具函数使用指南

### 时间处理 (timeHelpers)

```typescript
import { 
  formatTimestamp, 
  getCurrentTime,
  shouldShowTimeDivider,
  formatCallDuration
} from '@/pages/ChatDetail/utils'

// 格式化时间戳
formatTimestamp(Date.now()) // "14:30"

// 获取当前时间
getCurrentTime() // "14:30"

// 判断是否显示时间分隔线
shouldShowTimeDivider(currentMsg, prevMsg) // true/false

// 格式化通话时长
formatCallDuration(125) // "2:05"
```

### 消息处理 (messageHelpers)

```typescript
import {
  createMessage,
  createSystemMessage,
  createTransferMessage,
  createRedEnvelopeMessage,
  canRecallMessage,
  recallMessage
} from '@/pages/ChatDetail/utils'

// 创建文本消息
const msg = createMessage('sent', 'Hello!')

// 创建系统消息
const sysMsg = createSystemMessage('用户加入了聊天')

// 创建转账消息
const transferMsg = createTransferMessage('sent', 100, '请收款')

// 检查是否可撤回
if (canRecallMessage(message)) {
  const recalled = recallMessage(message)
}
```

### 存储处理 (storageHelpers)

```typescript
import {
  loadChatMessages,
  saveChatMessages,
  debouncedSaveChatMessages,
  getBubbleColor,
  setBubbleColor
} from '@/pages/ChatDetail/utils'

// 加载消息
const messages = loadChatMessages('chat-1')

// 保存消息
saveChatMessages('chat-1', messages)

// 防抖保存
debouncedSaveChatMessages('chat-1', messages)

// 获取气泡颜色
const color = getBubbleColor('chat-1', 'user')

// 设置气泡颜色
setBubbleColor('chat-1', 'user', '#95EC69')
```

## 📦 类型定义

### Message 类型

```typescript
interface Message {
  id: number
  type: 'received' | 'sent' | 'system'
  content: string
  time: string
  timestamp?: number
  messageType?: 'text' | 'transfer' | 'redenvelope' | 'emoji' | 'photo' | 'voice' | 'location' | 'intimate_pay' | 'couple_space_invite' | 'xiaohongshu' | 'image' | 'musicInvite' | 'musicShare'
  
  // 引用消息
  quotedMessage?: {
    id: number
    content: string
    senderName: string
    type: 'received' | 'sent'
  }
  
  // 撤回相关
  isRecalled?: boolean
  recalledContent?: string
  
  // 转账相关
  transfer?: {
    amount: number
    message: string
    status: 'pending' | 'received' | 'expired'
  }
  
  // 红包相关
  redEnvelopeId?: string
  
  // 旁白
  narrations?: Array<{
    type: 'action' | 'thought'
    content: string
  }>
  
  // ... 更多字段
}
```

### TokenStats 类型

```typescript
interface TokenStats {
  total: number
  remaining: number
  percentage: number
  systemPrompt: number
  lorebook: number
  messages: number
}
```

## 💡 最佳实践

### 1. 组合使用多个Hooks

```typescript
const ChatDetail = () => {
  // 消息管理
  const { messages, addMessage } = useChatMessages(id)
  
  // 滚动管理
  const { displayCount, scrollToBottom } = useChatScroll(messages.length, id)
  
  // 输入管理
  const { inputValue, setInputValue } = useChatInput()
  
  // AI状态
  const { isAiTyping, startAITyping } = useChatAIState()
  
  // 组合使用
  const handleSend = () => {
    addMessage({ type: 'sent', content: inputValue })
    scrollToBottom(true)
    setInputValue('')
  }
}
```

### 2. 性能优化

```typescript
// 使用 useMemo 缓存计算结果
const visibleMessages = useMemo(() => 
  messages.filter(m => !m.isHidden).slice(-displayCount),
  [messages, displayCount]
)

// 使用 useCallback 缓存函数
const handleSend = useCallback(() => {
  // ...
}, [dependencies])
```

### 3. 错误处理

```typescript
try {
  await addMessage(message)
} catch (error) {
  console.error('发送消息失败:', error)
  // 显示错误提示
}
```

## 🔍 调试技巧

### 1. 查看消息状态

```typescript
console.log('当前消息:', messages)
console.log('显示数量:', displayCount)
console.log('AI状态:', isAiTyping)
```

### 2. 监听存储变化

```typescript
useEffect(() => {
  const handler = () => {
    console.log('存储已更新')
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}, [])
```

---

**版本**: 1.0.0  
**最后更新**: 2025-11-02  
**维护者**: ChatDetail 重构团队

