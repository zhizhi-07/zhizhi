# ChatDetail 模块使用示例

## 📚 快速开始

### 导入方式

```typescript
// 从主索引导入（推荐）
import {
  // Hooks
  useChatMessages,
  useChatScroll,
  useChatInput,
  useChatModals,
  useChatAIState,
  
  // 组件
  ChatHeader,
  ChatInput,
  MessageList,
  MessageBubble,
  AddMenu,
  MessageMenu,
  BatchDeleteToolbar,
  
  // 卡片
  TransferCard,
  RedEnvelopeCard,
  
  // 服务
  buildSystemPrompt,
  parseAIResponse,
  
  // 类型
  Message,
  TokenStats
} from '@/pages/ChatDetail'
```

---

## 🎣 Hooks 使用示例

### 1. 基础消息管理

```typescript
import { useChatMessages } from '@/pages/ChatDetail'

const ChatPage = () => {
  const { id } = useParams()
  
  // 消息管理
  const {
    messages,
    addMessage,
    updateMessage,
    deleteMessage,
    recallMessage,
    batchDeleteMessages
  } = useChatMessages(id)
  
  // 发送消息
  const handleSend = (content: string) => {
    addMessage({
      type: 'sent',
      content,
      messageType: 'text'
    })
  }
  
  // 撤回消息
  const handleRecall = (messageId: number) => {
    recallMessage(messageId)
  }
  
  return <div>{/* UI */}</div>
}
```

### 2. 滚动和分页

```typescript
import { useChatScroll } from '@/pages/ChatDetail'

const ChatPage = () => {
  const { messages } = useChatMessages(id)
  
  // 滚动管理
  const {
    displayCount,
    isLoadingMore,
    messagesContainerRef,
    scrollToBottom
  } = useChatScroll(messages.length, id)
  
  // 发送消息后滚动到底部
  const handleSend = (content: string) => {
    addMessage({ type: 'sent', content })
    scrollToBottom(true) // 平滑滚动
  }
  
  return (
    <div ref={messagesContainerRef}>
      {/* 消息列表 */}
    </div>
  )
}
```

### 3. 输入框管理

```typescript
import { useChatInput } from '@/pages/ChatDetail'

const ChatPage = () => {
  const {
    inputValue,
    setInputValue,
    quotedMessage,
    setQuote,
    cancelQuote,
    editingMessage,
    startEdit,
    cancelEdit,
    finishEdit,
    clearInput
  } = useChatInput()
  
  // 引用消息
  const handleQuote = (message: Message) => {
    setQuote(message)
  }
  
  // 编辑消息
  const handleEdit = (message: Message) => {
    startEdit(message)
  }
  
  // 完成编辑
  const handleFinishEdit = () => {
    if (editingMessage) {
      updateMessage(editingMessage.id, { content: inputValue })
      finishEdit()
    }
  }
  
  return <div>{/* UI */}</div>
}
```

### 4. 弹窗管理

```typescript
import { useChatModals } from '@/pages/ChatDetail'

const ChatPage = () => {
  const {
    showMenu,
    setShowMenu,
    showRedEnvelopeSender,
    setShowRedEnvelopeSender,
    showTransferSender,
    setShowTransferSender,
    showEmojiPanel,
    setShowEmojiPanel
  } = useChatModals()
  
  return (
    <>
      <button onClick={() => setShowMenu(true)}>打开菜单</button>
      
      {showMenu && (
        <AddMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          onSelectRedPacket={() => {
            setShowMenu(false)
            setShowRedEnvelopeSender(true)
          }}
        />
      )}
    </>
  )
}
```

---

## 🧩 组件使用示例

### 1. 完整的聊天页面结构

```typescript
import {
  useChatMessages,
  useChatScroll,
  useChatInput,
  useChatModals,
  useChatMessageActions,
  ChatHeader,
  ChatInput,
  MessageList,
  AddMenu,
  MessageMenu,
  BatchDeleteToolbar
} from '@/pages/ChatDetail'

const ChatDetail = () => {
  const { id } = useParams()
  const { character } = useCharacter()
  const { currentUser } = useUser()
  
  // Hooks
  const { messages, addMessage, deleteMessage, recallMessage } = useChatMessages(id)
  const { displayCount, messagesContainerRef, scrollToBottom } = useChatScroll(messages.length, id)
  const { inputValue, setInputValue, quotedMessage, cancelQuote } = useChatInput()
  const { showMenu, setShowMenu, showEmojiPanel, setShowEmojiPanel } = useChatModals()
  const {
    longPressedMessage,
    handleLongPressStart,
    handleLongPressEnd,
    isBatchDeleteMode,
    selectedMessageIds,
    toggleBatchDeleteMode
  } = useChatMessageActions()
  
  const handleSend = () => {
    addMessage({ type: 'sent', content: inputValue })
    setInputValue('')
    scrollToBottom(true)
  }
  
  return (
    <div className="flex flex-col h-screen">
      {/* 批量删除工具栏 */}
      <BatchDeleteToolbar
        isActive={isBatchDeleteMode}
        selectedCount={selectedMessageIds.size}
        totalCount={messages.length}
        onCancel={() => toggleBatchDeleteMode()}
        onSelectAll={() => {/* 全选逻辑 */}}
        onDelete={() => {/* 删除逻辑 */}}
      />
      
      {/* 头部 */}
      <ChatHeader
        character={character}
        onBack={() => navigate(-1)}
        onMenuClick={() => setShowMenu(true)}
      />
      
      {/* 消息列表 */}
      <MessageList
        messages={messages}
        displayCount={displayCount}
        character={character}
        currentUser={currentUser}
        userBubbleColor="#95EC69"
        aiBubbleColor="#FFFFFF"
        containerRef={messagesContainerRef}
        onLongPressStart={handleLongPressStart}
        onLongPressEnd={handleLongPressEnd}
        selectedMessageIds={selectedMessageIds}
      />
      
      {/* 输入框 */}
      <ChatInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSend={handleSend}
        onAddClick={() => setShowMenu(true)}
        onEmojiClick={() => setShowEmojiPanel(true)}
        quotedMessage={quotedMessage}
        onCancelQuote={cancelQuote}
      />
      
      {/* 添加菜单 */}
      <AddMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onSelectImage={() => {/* 选择图片 */}}
        onSelectCamera={() => {/* 拍照 */}}
        onSelectRedPacket={() => {/* 发红包 */}}
        onSelectTransfer={() => {/* 转账 */}}
      />
      
      {/* 消息菜单 */}
      <MessageMenu
        isOpen={!!longPressedMessage}
        message={longPressedMessage}
        onClose={handleLongPressEnd}
        onCopy={() => {/* 复制 */}}
        onDelete={() => deleteMessage(longPressedMessage!.id)}
        onRecall={() => recallMessage(longPressedMessage!.id)}
        onQuote={() => {/* 引用 */}}
        onEdit={() => {/* 编辑 */}}
        onBatchDelete={() => toggleBatchDeleteMode()}
      />
    </div>
  )
}
```

---

## 🔧 服务层使用示例

### 1. AI提示词构建

```typescript
import { buildSystemPrompt, buildSimplePrompt } from '@/pages/ChatDetail'

const handleAIReply = async () => {
  // 构建提示词
  const prompt = buildSystemPrompt({
    character,
    currentUser,
    messages,
    messageLimit: 20,
    enableNarration: true,
    streakDays: 7,
    hasCoupleSpace: true,
    lorebookEntries: [
      { key: '世界观', value: '现代都市' }
    ],
    memes: [
      { 梗: 'yyds', 含义: '永远的神' }
    ]
  })
  
  // 调用AI API
  const response = await callAI(prompt)
  
  // 处理响应...
}
```

### 2. AI响应解析

```typescript
import { parseAIResponse, isValidAIResponse } from '@/pages/ChatDetail'

const handleAIResponse = (response: string) => {
  // 验证响应
  if (!isValidAIResponse(response)) {
    console.error('无效的AI响应')
    return
  }
  
  // 解析响应
  const parsed = parseAIResponse(response)
  
  // 添加消息
  addMessage({
    type: 'received',
    content: parsed.text,
    narrations: parsed.narrations
  })
  
  // 处理特殊命令
  if (parsed.hasSpecialCommand) {
    switch (parsed.specialCommand?.type) {
      case 'call':
        // 处理打电话
        break
      case 'redenvelope':
        // 处理发红包
        break
      case 'transfer':
        // 处理转账
        break
    }
  }
}
```

---

## 💡 最佳实践

### 1. 组合多个Hooks

```typescript
// ✅ 推荐：组合使用多个hooks
const ChatPage = () => {
  const { messages, addMessage } = useChatMessages(id)
  const { scrollToBottom } = useChatScroll(messages.length, id)
  const { inputValue, setInputValue, clearInput } = useChatInput()
  const { isAiTyping, startAITyping, stopAITyping } = useChatAIState()
  
  const handleSend = () => {
    addMessage({ type: 'sent', content: inputValue })
    clearInput()
    scrollToBottom(true)
    
    // 触发AI回复
    startAITyping()
    // ... AI逻辑
    stopAITyping()
  }
}
```

### 2. 性能优化

```typescript
// ✅ 使用 useMemo 缓存计算结果
const visibleMessages = useMemo(() => 
  messages.filter(m => !m.isHidden).slice(-displayCount),
  [messages, displayCount]
)

// ✅ 使用 useCallback 缓存回调函数
const handleSend = useCallback(() => {
  addMessage({ type: 'sent', content: inputValue })
  clearInput()
}, [inputValue, addMessage, clearInput])
```

### 3. 类型安全

```typescript
// ✅ 使用导出的类型
import { Message, TokenStats } from '@/pages/ChatDetail'

const MyComponent = () => {
  const [message, setMessage] = useState<Message | null>(null)
  const [stats, setStats] = useState<TokenStats | null>(null)
}
```

---

## 🎯 总结

本模块提供了完整的聊天功能实现，包括：

- ✅ **12个自定义Hooks** - 覆盖所有状态管理和业务逻辑
- ✅ **9个UI组件** - 可复用的界面组件
- ✅ **2个业务服务** - AI提示词构建和响应解析
- ✅ **完整的类型定义** - TypeScript类型安全
- ✅ **工具函数库** - 常用工具函数

**使用建议**：
1. 从主索引导入所需模块
2. 组合使用多个hooks实现复杂功能
3. 使用提供的组件快速构建UI
4. 利用服务层处理AI相关逻辑
5. 遵循TypeScript类型定义确保类型安全

