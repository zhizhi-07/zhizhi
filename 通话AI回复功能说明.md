# 通话 AI 回复功能实现说明

## ✅ 已完成的功能

### 1. **AI 回复按钮**
在通话界面的输入框旁边添加了 **"🤖 AI回复"** 按钮，点击后会调用 AI API 生成回复。

### 2. **完整的 AI 调用逻辑**
参考了 digital-life 项目的 `call-system.js` 实现，包含：

#### 提示词设计
- ✅ **时间感知**：根据当前时间（早上/中午/晚上等）调整 AI 回复
- ✅ **聊天历史**：AI 能看到最近 30 条聊天记录
- ✅ **通话记录**：AI 能看到通话中的对话历史
- ✅ **角色信息**：包含角色性格、关系、好感度
- ✅ **通话类型区分**：语音通话和视频通话有不同的描述规则

#### 语音通话规则
```
- 必须描述声音变化
- 不能描述任何视觉内容（表情、动作）
- 只能描述听到的内容
- 示例："声音突然变得很温柔"、"说到一半笑了出来"
```

#### 视频通话规则
```
- 必须描述动作和表情
- 要有画面感
- 示例："歪着头，一脸疑惑地看着镜头"、"笑着摆了摆手"
```

### 3. **消息管理**
- ✅ 用户发送的消息会添加到 `callMessages` 状态
- ✅ AI 回复会逐句显示（每句间隔 800ms）
- ✅ 消息自动滚动到底部
- ✅ 通话结束时清空消息

### 4. **AI 回复流程**

```typescript
1. 用户输入消息 → 点击发送
2. 消息显示在对话区域
3. 点击 "🤖 AI回复" 按钮
4. 调用 callAI API，传入完整提示词
5. 解析 AI 返回的 JSON 格式回复
6. 逐句显示 AI 消息
```

## 📝 提示词结构

### 基础信息
```
- 角色名字
- 性格描述
- 关系（朋友/恋人等）
- 好感度（0-100）
- 当前时间段
```

### 上下文信息
```
- 最近的聊天记录（30条）
- 通话中的对话（5条）
- 用户刚才说的话
```

### 通话规则
```
1. 必须立刻回应
2. 用口语，像真的在说话
3. 多用语气词（"喂？"、"嗯..."、"啊？"）
4. 回复要简短
5. 根据通话类型描述声音或动作
```

### 输出格式
```json
{
  "messages": [
    {"type": "voice_desc", "content": "声音描述或动作描述"},
    {"type": "voice_text", "content": "你说的话1"},
    {"type": "voice_text", "content": "你说的话2"}
  ]
}
```

## 🎯 使用方法

### 发起通话
1. 打开聊天界面
2. 点击 "+" 按钮
3. 选择"语音通话"或"视频通话"

### 对话流程
1. **输入消息**：在输入框输入文字
2. **发送**：点击绿色发送按钮或按 Enter
3. **AI 回复**：点击 "🤖 AI回复" 按钮
4. **等待**：AI 会逐句显示回复内容

### 注意事项
- ⚠️ 必须先发送消息，才能点击 AI 回复
- ⚠️ 如果 AI 已经回复，需要先发送新消息
- ⚠️ 通话结束后，消息会被清空

## 🔧 技术实现

### ChatDetail.tsx
```typescript
// 通话消息状态
const [callMessages, setCallMessages] = useState<Array<{
  id: number, 
  type: 'user' | 'ai', 
  content: string, 
  time: string
}>>([])

// 发送消息
const handleCallSendMessage = (message: string) => {
  const newMessage = {
    id: Date.now(),
    type: 'user' as const,
    content: message,
    time: new Date().toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
  setCallMessages(prev => [...prev, newMessage])
}

// AI 回复
const handleCallAIReply = async () => {
  // 构建提示词
  const prompt = `你是${character.name}，现在正在和用户进行${callType}...`
  
  // 调用 AI API
  const aiResponse = await callAI(prompt)
  
  // 解析并显示回复
  const response = JSON.parse(jsonMatch[0])
  for (const msg of response.messages) {
    if (msg.type === 'voice_text') {
      setCallMessages(prev => [...prev, aiMessage])
      await new Promise(resolve => setTimeout(resolve, 800))
    }
  }
}
```

### CallScreen.tsx
```typescript
// 接收外部消息
const messages = externalMessages || []

// AI 回复按钮
<button
  onClick={onRequestAIReply}
  className="glass-dark px-4 py-2 rounded-full text-white text-sm"
>
  🤖 AI回复
</button>
```

## 📊 AI 提示词示例

### 语音通话提示词
```
你是小美，现在正在和用户进行语音通话。现在是晚上 22:30。

【重要：你现在在语音通话中！】
📞 语音通话：对方只能听到声音，要描述声音变化

【你的角色】
名字：小美
性格：活泼开朗
关系：朋友
好感度：75/100

【最近的聊天记录】
用户: 今天好累啊
小美: 怎么了？工作不顺利吗？
用户: 嗯，加班到现在

【通话中的对话】
用户: 喂？
小美: 嗨~怎么啦？
用户: 想找你聊聊天

【用户刚才说】
"你在干嘛呢？"

【语音通话-必须描述声音】
- 声音状态 → "声音有点沙哑"、"越说越小声"
- 情绪变化 → "语气缓和下来"、"说话带着笑意"
- 背景声音 → "那边很安静"、"有电视的声音"

❌ 语音通话中绝对不能说：
- "看到"、"看见"任何东西
- 描述表情、动作
- 只能描述声音！

【输出格式（只返回JSON）】
{
  "messages": [
    {"type": "voice_desc", "content": "声音描述（旁白形式）"},
    {"type": "voice_text", "content": "你说的话1"},
    {"type": "voice_text", "content": "你说的话2"}
  ]
}
```

### AI 回复示例
```json
{
  "messages": [
    {
      "type": "voice_desc", 
      "content": "声音听起来很放松，背景有轻微的音乐声"
    },
    {
      "type": "voice_text", 
      "content": "嗯...刚在听歌呢"
    },
    {
      "type": "voice_text", 
      "content": "你呢？这么晚还没睡啊？"
    }
  ]
}
```

## 🎨 界面效果

### 通话界面布局
```
┌─────────────────────────────────┐
│  [最小化]  [头像 名字 时长]  [📹] │  ← 顶部
├─────────────────────────────────┤
│                                 │
│   用户: 你在干嘛呢？              │  ← 对话区
│   AI: 嗯...刚在听歌呢             │
│   AI: 你呢？这么晚还没睡啊？       │
│                                 │
├─────────────────────────────────┤
│  [输入框.........][发送] [🤖AI回复] │  ← 输入区
│  [🎤]    [挂断]    [🔊]         │  ← 控制按钮
└─────────────────────────────────┘
```

## 🚀 后续可扩展

1. **自动 AI 回复**：发送消息后自动触发 AI 回复
2. **打字动画**：显示"正在输入..."提示
3. **语音描述显示**：将 voice_desc 以旁白形式显示
4. **表情动作动画**：视频通话中显示动作描述
5. **通话记录保存**：将通话内容保存到聊天历史
6. **AI 主动来电**：AI 可以主动发起通话

## ✨ 核心特点

1. **完整的提示词系统**：参考 digital-life 项目，包含所有必要的上下文
2. **区分通话类型**：语音和视频有不同的描述规则
3. **逐句显示**：AI 回复逐句弹出，更自然
4. **时间感知**：根据当前时间调整回复风格
5. **记忆聊天历史**：AI 能记住之前的对话内容

现在你可以在通话中正常使用 AI 回复功能了！🎉
