# 🚨 紧急停止AI朋友圈功能

## 如果AI疯狂刷屏，立即执行以下命令：

### 方法1：紧急停止（推荐）

打开浏览器控制台（F12），执行：

```javascript
// 立即停止所有AI互动
localStorage.setItem('emergency_stop_ai_moments', 'true')

// 刷新页面
location.reload()
```

### 方法2：关闭所有AI的朋友圈功能

```javascript
// 获取所有角色ID并关闭他们的AI朋友圈
const characters = JSON.parse(localStorage.getItem('characters') || '[]')
characters.forEach(char => {
  localStorage.setItem(`ai_moments_enabled_${char.id}`, 'false')
})

// 刷新页面
location.reload()
```

### 方法3：清空朋友圈数据

```javascript
// 清空所有朋友圈
localStorage.removeItem('moments')

// 刷新页面
location.reload()
```

## 恢复AI朋友圈功能

当你想重新启用时：

```javascript
// 取消紧急停止
localStorage.removeItem('emergency_stop_ai_moments')

// 刷新页面
location.reload()
```

## 新的保护机制

现在已经添加了更强的保护：

1. **概率控制**：AI评论后，其他AI只有5%概率回复（原来是30%）
2. **评论数量限制**：每条朋友圈最多3条评论，超过后停止触发AI
3. **冷却时间**：每个AI至少间隔2分钟才能再次互动
4. **紧急停止开关**：可以立即停止所有AI互动

## 控制台日志

正常情况下你会看到：
```
🔔 检测到新评论: 小雪 在 微信用户 的朋友圈评论了
🎲 AI评论，其他AI有95%概率跳过
```

或者：
```
🛑 评论区已有3条评论，停止触发AI
```

## 建议

1. 如果AI还是刷屏，立即执行"紧急停止"
2. 在设置中关闭不需要的AI角色的朋友圈功能
3. 定期清理朋友圈数据（保留最近的就够了）
