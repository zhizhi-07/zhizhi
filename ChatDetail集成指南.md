# ChatDetail.tsx 情侣空间集成指南

## ✅ 已完成部分

1. ✅ 亲密付Bug修复（页面可见性监听）
2. ✅ 情侣空间页面完整UI
3. ✅ 情侣空间工具函数
4. ✅ 邀请卡片组件
5. ✅ AI Prompt更新

---

## 📝 ChatDetail.tsx 需要添加的代码

由于文件较大容易出错，建议**手动添加**以下代码：

---

### **1. 更新Message接口（2个位置）**

#### 位置1：第51行
**查找：**
```typescript
messageType?: 'text' | 'transfer' | 'system' | 'redenvelope' | 'emoji' | 'photo' | 'voice' | 'location' | 'intimate_pay'
```

**替换为：**
```typescript
messageType?: 'text' | 'transfer' | 'system' | 'redenvelope' | 'emoji' | 'photo' | 'voice' | 'location' | 'intimate_pay' | 'couple_space'
```

#### 位置2：第82行（intimatePay后面）
**在这段代码后：**
```typescript
intimatePay?: {
  monthlyLimit: number
  characterId: string
  characterName: string
  status: 'pending' | 'accepted' | 'rejected'
}
```

**添加：**
```typescript
coupleSpace?: {
  characterId: string
  characterName: string
  status: 'pending' | 'accepted' | 'rejected'
}
```

---

### **2. 添加导入（第18-19行之后）**

**在这行后：**
```typescript
import IntimatePaySender from '../components/IntimatePaySender'
```

**添加：**
```typescript
import CoupleSpaceInviteCard from '../components/CoupleSpaceInviteCard'
import { acceptCoupleSpaceInvite, rejectCoupleSpaceInvite } from '../utils/coupleSpaceUtils'
```

---

### **3. 自动发送邀请useEffect（第787行后）**

**在这段代码后：**
```typescript
}, [location.state?.sendIntimatePay, location.state?.monthlyLimit, id, character])
```

**添加：**
```typescript
// 处理从情侣空间页面跳转过来的邀请
useEffect(() => {
  const coupleSpaceInvite = location.state?.sendCoupleSpaceInvite
  
  if (coupleSpaceInvite && id && character && !hasProcessedIntimatePayRef.current) {
    console.log('💑 自动发送情侣空间邀请卡片')
    hasProcessedIntimatePayRef.current = true
    
    const now = Date.now()
    const coupleSpaceMsg: Message = {
      id: now,
      type: 'sent',
      content: '',
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: now,
      messageType: 'couple_space',
      coupleSpace: {
        characterId: character.id,
        characterName: character.name,
        status: 'pending'
      }
    }
    
    setMessages(prev => [...prev, coupleSpaceMsg])
    window.history.replaceState({}, document.title)
    
    setTimeout(() => {
      hasProcessedIntimatePayRef.current = false
      console.log('🔄 情侣空间邀请标记已重置')
    }, 1000)
  }
}, [location.state?.sendCoupleSpaceInvite, id, character])
```

---

### **4. 消息渲染（第3808行附近）**

**查找这段代码：**
```typescript
                    </div>
                  ) : (
                   <div style={{ maxWidth: '280px', display: 'inline-block', wordBreak: 'break-word' }}>
                      {/* 文字内容 */}
```

**在 `) : (` 之前添加：**
```typescript
) : message.messageType === 'couple_space' && message.coupleSpace ? (
  <CoupleSpaceInviteCard
    senderName={message.type === 'sent' ? (currentUser?.name || '我') : (character?.name || 'AI')}
    senderAvatar={message.type === 'sent' ? currentUser?.avatar : character?.avatar}
    status={message.coupleSpace.status}
    isReceived={message.type === 'received'}
    onAccept={() => {
      if (acceptCoupleSpaceInvite(message.coupleSpace!.characterId)) {
        setMessages(prev => prev.map(m => 
          m.id === message.id && m.coupleSpace
            ? { ...m, coupleSpace: { ...m.coupleSpace, status: 'accepted' } }
            : m
        ))
      }
    }}
    onReject={() => {
      if (rejectCoupleSpaceInvite(message.coupleSpace!.characterId)) {
        setMessages(prev => prev.map(m => 
          m.id === message.id && m.coupleSpace
            ? { ...m, coupleSpace: { ...m.coupleSpace, status: 'rejected' } }
            : m
        ))
      }
    }}
  />
```

---

### **5. AI响应解析（2个位置）**

#### 位置A：第2651行后（亲密付解析后）

**在这段代码后：**
```typescript
if (intimatePayMatch) {
  aiIntimatePayLimit = parseFloat(intimatePayMatch[1])
  cleanedResponse = cleanedResponse.replace(/\[亲密付:\d+\.?\d*\]/g, '').trim()
  console.log('💝 AI开通亲密付，月额度:', aiIntimatePayLimit)
}
```

**添加：**
```typescript
// 检查AI是否要发送情侣空间邀请或响应
const coupleSpaceInviteMatch = aiResponse.match(/\[情侣空间邀请\]/)
const coupleSpaceAcceptMatch = aiResponse.match(/\[接受情侣空间\]/)
const coupleSpaceRejectMatch = aiResponse.match(/\[拒绝情侣空间\]/)
let aiCoupleSpaceAction: 'invite' | 'accept' | 'reject' | null = null

if (coupleSpaceInviteMatch) {
  aiCoupleSpaceAction = 'invite'
  cleanedResponse = cleanedResponse.replace(/\[情侣空间邀请\]/g, '').trim()
  console.log('💑 AI发送情侣空间邀请')
} else if (coupleSpaceAcceptMatch) {
  aiCoupleSpaceAction = 'accept'
  cleanedResponse = cleanedResponse.replace(/\[接受情侣空间\]/g, '').trim()
  console.log('💑 AI接受情侣空间邀请')
} else if (coupleSpaceRejectMatch) {
  aiCoupleSpaceAction = 'reject'
  cleanedResponse = cleanedResponse.replace(/\[拒绝情侣空间\]/g, '').trim()
  console.log('💑 AI拒绝情侣空间邀请')
}
```

#### 位置B：第2787行后（亲密付处理逻辑后）

**在这段代码的最后一个 `}` 后：**
```typescript
      }
    }
  }
}
```

**添加：**
```typescript
// 如果AI对情侣空间做出决定，更新状态
if ((aiCoupleSpaceAction === 'accept' || aiCoupleSpaceAction === 'reject') && id && character) {
  for (let i = currentMessages.length - 1; i >= 0; i--) {
    const msg = currentMessages[i]
    if (msg.messageType === 'couple_space' && 
        msg.type === 'sent' && 
        msg.coupleSpace?.status === 'pending') {
      
      const updatedMessages = [...currentMessages]
      updatedMessages[i] = {
        ...updatedMessages[i],
        coupleSpace: {
          ...updatedMessages[i].coupleSpace!,
          status: aiCoupleSpaceAction === 'accept' ? 'accepted' : 'rejected'
        }
      }
      
      // 如果AI接受，创建情侣空间关系
      if (aiCoupleSpaceAction === 'accept') {
        acceptCoupleSpaceInvite(character.id)
      }
      
      // 添加系统提示
      const systemMessage: Message = {
        id: Date.now(),
        type: 'system',
        content: aiCoupleSpaceAction === 'accept'
          ? `${character.name}接受了你的情侣空间邀请`
          : `${character.name}拒绝了你的情侣空间邀请`,
        time: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        messageType: 'system'
      }
      updatedMessages.push(systemMessage)
      
      setMessages(updatedMessages)
      currentMessages = updatedMessages
      break
    }
  }
}
```

#### 位置C：在处理AI回复的地方（查找 `let newMessages = [...currentMessages]`）

**在这行后立即添加：**
```typescript
// 如果AI发送情侣空间邀请
if (aiCoupleSpaceAction === 'invite' && id && character) {
  const inviteMsg: Message = {
    id: Date.now(),
    type: 'received',
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    timestamp: Date.now(),
    messageType: 'couple_space',
    coupleSpace: {
      characterId: character.id,
      characterName: character.name,
      status: 'pending'
    }
  }
  newMessages.push(inviteMsg)
}
```

---

## 🎯 测试步骤

完成后测试：

1. **用户发送邀请**
   - 进入发现 → 情侣空间 → 邀请TA
   - 选择角色 → 自动跳转聊天
   - ✅ 应该自动发送邀请卡片

2. **AI接受邀请**
   - 等待AI回复包含 `[接受情侣空间]`
   - ✅ 卡片状态变为"已接受"
   - ✅ 显示系统提示

3. **AI发送邀请**
   - AI回复包含 `[情侣空间邀请]`
   - ✅ 显示邀请卡片
   - 点击接受 → ✅ 状态更新

---

## ⚠️ 注意事项

1. **保存前备份**
   - 建议先用git commit保存当前状态
   - 或者复制一份ChatDetail.tsx

2. **逐步添加**
   - 一次添加一个部分
   - 每次添加后保存并检查无语法错误

3. **使用VS Code搜索**
   - Ctrl+F 搜索关键代码
   - 确保在正确位置添加

4. **检查缩进**
   - 保持与周围代码一致的缩进
   - TypeScript对缩进不敏感但影响可读性

---

## ✅ 完成标志

全部添加完成后：

- ✅ 无TypeScript错误
- ✅ 可以从情侣空间发送邀请
- ✅ 聊天中显示邀请卡片
- ✅ 可以接受/拒绝邀请
- ✅ AI可以响应邀请

---

**预计时间：** 15-20分钟  
**难度：** ⭐⭐☆☆☆  

**加油！只差这最后一步了！** 💪
