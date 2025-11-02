# ChatDetail 组件拆分计划

## 📊 当前状态

- **原文件**: `src/pages/ChatDetail.tsx` (7702行)
- **目标**: 拆分为多个小于500行的模块化文件
- **已完成**: 类型定义、部分hooks、工具函数

## ✅ 已完成的工作

### 1. 类型定义 ✅
- **文件**: `src/pages/ChatDetail/types.ts`
- **内容**: Message、TokenStats、LorebookEntry、MusicInfo、CoupleSpaceContent

### 2. 工具函数 ✅
- **文件**: `src/pages/ChatDetail/utils/`
  - `storageHelpers.ts` - 存储相关工具函数
  - `timeHelpers.ts` - 时间格式化函数
  - `messageHelpers.ts` - 消息处理辅助函数

### 3. 自定义Hooks（部分完成）✅
- **文件**: `src/pages/ChatDetail/hooks/`
  - `useChatMessages.ts` - 消息管理
  - `useChatModals.ts` - 弹窗状态管理
  - `useChatBackground.ts` - 背景管理
  - `useChatBubbles.ts` - 气泡样式管理

## 🚧 待完成的工作

### Phase 1: 完善自定义Hooks

#### 1.1 创建 `useChatScroll.ts`
**功能**: 管理消息滚动和分页加载
- 滚动到底部逻辑
- 上拉加载更多消息
- 保持滚动位置
- displayCount 状态管理

#### 1.2 创建 `useChatNotifications.ts`
**功能**: 管理未读消息和通知
- 监听页面可见性
- 增加/清除未读消息
- 发送后台通知
- 更新聊天列表

#### 1.3 创建 `useChatAI.ts`
**功能**: AI回复核心逻辑
- AI打字状态
- 构建提示词
- 调用AI API
- 处理AI响应
- Token计数
- 记忆系统集成

#### 1.4 创建 `useChatInput.ts`
**功能**: 输入框状态管理
- 输入值状态
- 引用消息
- 编辑消息
- 发送消息逻辑

#### 1.5 创建 `useChatMedia.ts`
**功能**: 媒体消息处理
- 图片/拍照
- 语音消息
- 位置消息
- 表情包

#### 1.6 创建 `useChatPayment.ts`
**功能**: 支付相关功能
- 红包发送/接收
- 转账处理
- 亲密付
- 钱包余额

#### 1.7 创建 `useChatCoupleSpace.ts`
**功能**: 情侣空间功能
- 邀请状态
- 内容管理
- 表单数据

#### 1.8 创建 `useChatMusic.ts`
**功能**: 音乐相关功能
- 音乐邀请
- 音乐分享
- 音乐详情

#### 1.9 创建 `useChatXiaohongshu.ts`
**功能**: 小红书功能
- 笔记选择
- 链接输入

#### 1.10 创建 `useChatCall.ts`
**功能**: 通话功能
- 来电处理
- 通话记录
- 通话详情展开

#### 1.11 创建 `useChatMessageActions.ts`
**功能**: 消息操作
- 长按菜单
- 撤回消息
- 删除消息
- 批量删除

### Phase 2: 拆分UI组件

#### 2.1 创建 `components/ChatHeader.tsx`
**功能**: 聊天页面头部
- 返回按钮
- 角色名称/头像
- 更多菜单按钮
- Token统计显示

#### 2.2 创建 `components/MessageList.tsx`
**功能**: 消息列表容器
- 消息滚动容器
- 加载更多提示
- 时间分隔线
- 消息渲染

#### 2.3 创建 `components/MessageBubble.tsx`
**功能**: 单条消息气泡
- 文本消息
- 系统消息
- 撤回消息
- 引用消息显示

#### 2.4 创建 `components/MessageCard/`
**功能**: 各种特殊消息卡片
- `RedEnvelopeCard.tsx` - 红包卡片（已存在）
- `TransferCard.tsx` - 转账卡片
- `IntimatePayCard.tsx` - 亲密付卡片
- `CoupleSpaceCard.tsx` - 情侣空间卡片
- `MusicInviteCard.tsx` - 音乐邀请卡片（已存在）
- `MusicShareCard.tsx` - 音乐分享卡片（已存在）
- `XiaohongshuCard.tsx` - 小红书卡片（已存在）
- `LocationCard.tsx` - 位置卡片
- `VoiceCard.tsx` - 语音卡片
- `PhotoCard.tsx` - 图片卡片
- `CallRecordCard.tsx` - 通话记录卡片

#### 2.5 创建 `components/ChatInput.tsx`
**功能**: 输入框区域
- 文本输入框
- 发送按钮
- 附加功能按钮（+、表情）
- 引用消息预览
- 编辑消息提示

#### 2.6 创建 `components/ChatToolbar.tsx`
**功能**: 工具栏（点击+按钮显示）
- 图片选择
- 拍照
- 红包
- 转账
- 亲密付
- 情侣空间
- 音乐邀请
- 小红书
- 位置
- 语音

#### 2.7 创建 `components/MessageMenu.tsx`
**功能**: 长按消息菜单
- 复制
- 删除
- 撤回
- 引用
- 编辑
- 查看原文（撤回消息）

#### 2.8 创建 `components/ChatModals/`
**功能**: 各种弹窗组件
- `CameraModal.tsx` - 拍照弹窗
- `VoiceModal.tsx` - 语音输入弹窗
- `LocationModal.tsx` - 位置选择弹窗
- `RecallReasonModal.tsx` - 撤回理由弹窗
- `CoupleSpaceContentModal.tsx` - 情侣空间内容弹窗
- `TokenDetailModal.tsx` - Token详情弹窗

### Phase 3: 提取业务逻辑函数

#### 3.1 创建 `utils/aiPromptBuilder.ts`
**功能**: AI提示词构建
- 构建系统提示词
- 构建对话历史
- 集成记忆系统
- 集成Lorebook
- 集成朋友圈上下文
- 集成黑名单

#### 3.2 创建 `utils/aiResponseParser.ts`
**功能**: AI响应解析
- 解析旁白
- 解析特殊指令（打电话、发红包等）
- 提取账单信息
- 处理换头像指令

#### 3.3 创建 `utils/messageBuilder.ts`
**功能**: 消息构建
- 创建文本消息
- 创建系统消息
- 创建特殊消息（红包、转账等）
- 生成消息ID和时间戳

#### 3.4 创建 `utils/chatListSync.ts`（已存在）
**功能**: 聊天列表同步
- 更新最后一条消息
- 更新时间戳

#### 3.5 创建 `utils/avatarRecognition.ts`
**功能**: 头像识别
- 识别AI头像
- 缓存识别结果
- 检测头像变化

### Phase 4: 重构主组件

#### 4.1 简化 `ChatDetail.tsx`
**目标**: 将主组件精简到 < 500 行
**结构**:
```tsx
const ChatDetail = () => {
  // 1. 路由和基础状态 (20行)
  const { id } = useParams()
  const navigate = useNavigate()
  const character = getCharacter(id)

  // 2. 使用自定义Hooks (50行)
  const messages = useChatMessages(id)
  const modals = useChatModals()
  const background = useChatBackground(id)
  const bubbles = useChatBubbles(id)
  const scroll = useChatScroll()
  const notifications = useChatNotifications(id)
  const ai = useChatAI(id, character)
  const input = useChatInput()
  const media = useChatMedia()
  const payment = useChatPayment()
  const coupleSpace = useChatCoupleSpace()
  const music = useChatMusic()
  const xiaohongshu = useChatXiaohongshu()
  const call = useChatCall()
  const messageActions = useChatMessageActions()

  // 3. 事件处理函数 (100行)
  const handleSendMessage = () => { ... }
  const handleAIReply = () => { ... }
  ...

  // 4. 渲染 (300行)
  return (
    <div>
      <ChatHeader />
      <MessageList />
      <ChatInput />
      {/* 各种弹窗和模态框 */}
    </div>
  )
}
```

## 📋 执行顺序

1. ✅ **Phase 0**: 类型定义和基础工具函数（已完成）
2. 🔄 **Phase 1**: 完善所有自定义Hooks（进行中）
3. ⏳ **Phase 2**: 拆分UI组件
4. ⏳ **Phase 3**: 提取业务逻辑函数
5. ⏳ **Phase 4**: 重构主组件

## 🎯 预期成果

- **主组件**: < 500 行
- **单个Hook**: < 200 行
- **单个组件**: < 300 行
- **工具函数**: < 100 行/文件
- **总文件数**: 约 40-50 个文件
- **可维护性**: ⭐⭐⭐⭐⭐
- **可测试性**: ⭐⭐⭐⭐⭐

## 📝 注意事项

1. **保持向后兼容**: 所有功能必须正常工作
2. **性能优化**: 使用 useMemo、useCallback 避免不必要的重渲染
3. **类型安全**: 所有函数和组件都要有完整的TypeScript类型
4. **代码复用**: 提取公共逻辑到工具函数
5. **测试**: 每完成一个模块就测试功能是否正常
