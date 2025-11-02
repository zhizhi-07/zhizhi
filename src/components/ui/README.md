# UI 组件库使用指南

## 📦 组件列表

### 1. Card - 卡片组件

**用途**: 替代重复的卡片样式代码

**使用示例**:
```tsx
import { Card } from '@/components/ui'

// 默认卡片
<Card>
  <h3>标题</h3>
  <p>内容</p>
</Card>

// 毛玻璃效果
<Card variant="glass">
  <p>毛玻璃卡片</p>
</Card>

// 大尺寸卡片
<Card size="lg">
  <p>大卡片</p>
</Card>

// 可点击卡片
<Card onClick={() => navigate('/detail')}>
  <p>点击跳转</p>
</Card>
```

**Props**:
- `variant`: 'default' | 'glass' | 'elevated' | 'outlined' | 'flat'
- `size`: 'sm' | 'md' | 'lg'
- `className`: 自定义类名
- `onClick`: 点击事件

---

### 2. Button - 按钮组件

**用途**: 替代重复的按钮样式代码

**使用示例**:
```tsx
import { Button } from '@/components/ui'

// 主要按钮
<Button variant="primary">
  确认
</Button>

// 危险按钮
<Button variant="danger">
  删除
</Button>

// 加载状态
<Button loading>
  提交中...
</Button>

// 带图标
<Button icon={<SendIcon />}>
  发送
</Button>

// 全宽按钮
<Button fullWidth>
  登录
</Button>
```

**Props**:
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean
- `icon`: ReactNode
- 支持所有原生 button 属性

---

### 3. Input - 输入框组件

**用途**: 替代重复的输入框样式代码

**使用示例**:
```tsx
import { Input } from '@/components/ui'

// 基础输入框
<Input 
  placeholder="请输入内容"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// 带标签
<Input 
  label="用户名"
  placeholder="请输入用户名"
/>

// 带错误提示
<Input 
  label="邮箱"
  error="邮箱格式不正确"
/>

// 带辅助文本
<Input 
  label="密码"
  helperText="至少8个字符"
  type="password"
/>

// 带图标
<Input 
  leftIcon={<SearchIcon />}
  placeholder="搜索..."
/>

// 全宽输入框
<Input fullWidth />
```

**Props**:
- `label`: string
- `error`: string
- `helperText`: string
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `fullWidth`: boolean
- 支持所有原生 input 属性

---

### 4. Modal - 弹窗组件

**用途**: 替代重复的弹窗样式代码

**使用示例**:
```tsx
import { Modal } from '@/components/ui'

const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="确认删除"
>
  <p>确定要删除这条消息吗？</p>
  <div className="flex gap-2 mt-4">
    <Button onClick={() => setIsOpen(false)}>取消</Button>
    <Button variant="danger" onClick={handleDelete}>删除</Button>
  </div>
</Modal>

// 大尺寸弹窗
<Modal size="lg" title="详情">
  {/* 内容 */}
</Modal>

// 全屏弹窗
<Modal size="full">
  {/* 内容 */}
</Modal>

// 不显示关闭按钮
<Modal showCloseButton={false}>
  {/* 内容 */}
</Modal>

// 点击遮罩不关闭
<Modal closeOnOverlayClick={false}>
  {/* 内容 */}
</Modal>
```

**Props**:
- `isOpen`: boolean (必需)
- `onClose`: () => void (必需)
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `showCloseButton`: boolean (默认 true)
- `closeOnOverlayClick`: boolean (默认 true)

---

## 🎨 设计系统

### 颜色规范

```tsx
// 主色
bg-blue-500    // 主要按钮
bg-red-500     // 危险操作
bg-gray-200    // 次要按钮

// 文字
text-gray-900  // 主要文字
text-gray-700  // 次要文字
text-gray-500  // 辅助文字
text-gray-400  // 禁用文字

// 边框
border-gray-200  // 默认边框
border-gray-300  // 输入框边框
border-blue-500  // 聚焦边框
border-red-500   // 错误边框
```

### 圆角规范

```tsx
rounded-xl   // 按钮、输入框 (12px)
rounded-2xl  // 卡片、弹窗 (16px)
rounded-full // 圆形头像
```

### 阴影规范

```tsx
shadow-md    // 默认卡片
shadow-lg    // 毛玻璃卡片
shadow-xl    // 悬浮卡片
shadow-2xl   // 弹窗
```

### 间距规范

```tsx
// 内边距
p-3   // 小 (12px)
p-4   // 中 (16px)
p-6   // 大 (24px)

// 外边距
gap-2  // 小间距 (8px)
gap-3  // 中间距 (12px)
gap-4  // 大间距 (16px)
```

---

## 🔄 迁移指南

### 旧代码（不推荐）

```tsx
// ❌ 重复的样式代码
<div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300">
  <h3 className="text-lg font-semibold">标题</h3>
  <p className="text-gray-600">内容</p>
</div>

<button className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 active:bg-blue-700 shadow-md transition-all">
  确认
</button>

<input className="px-4 py-2.5 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none" />
```

### 新代码（推荐）

```tsx
// ✅ 使用 UI 组件
import { Card, Button, Input } from '@/components/ui'

<Card variant="glass" size="lg">
  <h3 className="text-lg font-semibold">标题</h3>
  <p className="text-gray-600">内容</p>
</Card>

<Button variant="primary">
  确认
</Button>

<Input placeholder="请输入内容" />
```

---

## 📊 收益

### 代码量减少
- **旧方式**: 平均每个卡片 150+ 字符
- **新方式**: 平均每个卡片 30 字符
- **减少**: **80%**

### 可维护性提升
- ✅ 统一的样式规范
- ✅ 易于修改和扩展
- ✅ 减少样式不一致
- ✅ 提升开发效率

### 性能优化
- ✅ 减少重复的 CSS 类
- ✅ 更好的 Tree Shaking
- ✅ 更小的打包体积

---

## 🚀 下一步

### 逐步迁移
1. 新功能优先使用 UI 组件
2. 重构时替换旧代码
3. 不需要一次性全部替换

### 扩展组件库
根据需要添加更多组件：
- Badge - 徽章
- Avatar - 头像
- Tooltip - 提示
- Dropdown - 下拉菜单
- Tabs - 标签页
- Toast - 消息提示

---

## 💡 最佳实践

1. **优先使用 UI 组件** - 避免重复样式
2. **保持一致性** - 使用设计系统规范
3. **适当自定义** - 使用 className 扩展样式
4. **性能优先** - 避免过度嵌套

```tsx
// ✅ 好的做法
<Card variant="glass">
  <h3>标题</h3>
</Card>

// ❌ 避免过度自定义
<Card className="bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_50px_rgba(255,0,255,0.5)] transform rotate-3 scale-110">
  {/* 过度自定义，失去了组件的意义 */}
</Card>
```

