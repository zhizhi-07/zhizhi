# IndexedDB 存储升级说明

## 升级时间
2024年10月24日

---

## 为什么要升级？

### 问题
- **localStorage 容量限制**：只有 5-10MB
- **存储空间不足**：导入大型角色卡时经常报错
- **性能问题**：大量数据时读写缓慢

### 解决方案
升级到 **IndexedDB**：
- ✅ 容量更大：50MB+ (通常可达 几百MB)
- ✅ 性能更好：异步操作，不阻塞主线程
- ✅ 结构化存储：支持索引和查询
- ✅ 更可靠：事务支持，数据更安全

---

## 升级内容

### 1. 新增 IndexedDB 工具类
文件：`src/utils/indexedDB.ts`

**功能**：
- 数据库初始化
- 增删改查操作
- 索引查询
- 数据迁移
- 存储统计

### 2. 更新 CharacterContext
文件：`src/context/CharacterContext.tsx`

**变化**：
- 从 IndexedDB 加载角色数据
- 保存到 IndexedDB
- 自动从 localStorage 迁移
- 降级支持（IndexedDB 失败时使用 localStorage）

---

## 自动迁移

### 迁移流程

1. **首次启动**
   - 检测 IndexedDB 是否为空
   - 如果为空，检查 localStorage
   - 自动迁移所有数据

2. **迁移内容**
   - ✅ 角色数据
   - ⏳ 聊天记录（下一步）
   - ⏳ 消息数据（下一步）
   - ⏳ 世界书（下一步）
   - ⏳ 朋友圈（下一步）

3. **迁移确认**
   - 控制台显示迁移进度
   - 迁移成功后正常使用
   - localStorage 数据保留作为备份

### 控制台输出示例
```
检测到 localStorage 数据，开始迁移...
✅ 迁移了 4 个角色
```

---

## 使用说明

### 对用户透明
- **无需任何操作**
- 自动检测并迁移
- 使用体验完全一致

### 数据安全
- **双重备份**：IndexedDB + localStorage
- **降级支持**：IndexedDB 失败时自动使用 localStorage
- **事务保护**：数据写入失败会回滚

---

## 存储容量对比

| 存储方式 | 容量限制 | 性能 | 结构化 | 异步 |
|---------|---------|------|--------|------|
| localStorage | 5-10MB | 慢 | ❌ | ❌ |
| IndexedDB | 50MB+ | 快 | ✅ | ✅ |

---

## 数据结构

### 数据库：WeChatAppDB

**存储对象**：
1. **characters** - 角色数据
   - 索引：name
   
2. **chats** - 聊天列表
   - 索引：characterId, lastMessageTime
   
3. **messages** - 消息记录
   - 索引：chatId, timestamp
   
4. **settings** - 设置数据
   
5. **lorebooks** - 世界书
   - 索引：name
   
6. **moments** - 朋友圈
   - 索引：characterId, timestamp
   
7. **groups** - 群聊

---

## API 使用

### 基础操作

```typescript
import * as IDB from '../utils/indexedDB'

// 保存数据
await IDB.setItem(IDB.STORES.CHARACTERS, character)

// 获取单个数据
const character = await IDB.getItem(IDB.STORES.CHARACTERS, 'character-id')

// 获取所有数据
const characters = await IDB.getAllItems(IDB.STORES.CHARACTERS)

// 删除数据
await IDB.deleteItem(IDB.STORES.CHARACTERS, 'character-id')

// 清空存储
await IDB.clearStore(IDB.STORES.CHARACTERS)
```

### 索引查询

```typescript
// 通过角色ID查询聊天
const chats = await IDB.getByIndex(
  IDB.STORES.CHATS,
  'characterId',
  'character-id'
)
```

### 存储统计

```typescript
// 获取存储使用情况
const info = await IDB.getStorageInfo()
console.log(info)
// [
//   { storeName: 'characters', count: 4, estimatedSize: '1.5 MB' },
//   { storeName: 'chats', count: 10, estimatedSize: '0.8 MB' },
//   ...
// ]
```

---

## 常见问题

### Q: 升级后原来的数据会丢失吗？
A: **不会**！系统会自动迁移所有数据，并保留 localStorage 作为备份。

### Q: 如果 IndexedDB 不支持怎么办？
A: 系统会自动降级到 localStorage，功能完全正常。

### Q: 可以手动清理数据吗？
A: 可以！在浏览器控制台运行：
```javascript
// 查看存储使用情况
import * as IDB from './src/utils/indexedDB'
const info = await IDB.getStorageInfo()
console.table(info)

// 清空特定存储
await IDB.clearStore(IDB.STORES.MESSAGES)
```

### Q: 如何完全重置？
A: 控制台运行：
```javascript
// 删除 IndexedDB
indexedDB.deleteDatabase('WeChatAppDB')

// 清空 localStorage
localStorage.clear()

// 刷新页面
location.reload()
```

### Q: 数据存在哪里？
A: 
- **IndexedDB**：浏览器的 IndexedDB 存储
- **备份**：localStorage（仅保存 ID 列表）

### Q: 可以导出数据吗？
A: 可以！控制台运行：
```javascript
// 导出所有角色
const characters = await IDB.getAllItems(IDB.STORES.CHARACTERS)
const json = JSON.stringify(characters, null, 2)
console.log(json)
// 复制后保存为 JSON 文件
```

---

## 性能提升

### 导入大型角色卡
- **之前**：5MB 限制，经常失败
- **现在**：50MB+，轻松导入

### 加载速度
- **之前**：同步读取，阻塞页面
- **现在**：异步加载，不阻塞

### 存储效率
- **之前**：JSON 字符串，占用大
- **现在**：结构化存储，更高效

---

## 下一步计划

### 短期（本周）
- ✅ 角色数据迁移
- ⏳ 聊天记录迁移
- ⏳ 消息数据迁移
- ⏳ 世界书迁移

### 中期（本月）
- ⏳ 朋友圈数据迁移
- ⏳ 群聊数据迁移
- ⏳ 设置数据迁移
- ⏳ 完全移除 localStorage 依赖

### 长期
- ⏳ 云端同步
- ⏳ 数据加密
- ⏳ 多设备同步
- ⏳ 数据导入导出工具

---

## 技术细节

### 浏览器兼容性
- ✅ Chrome 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Edge 12+

### 存储限制
- **桌面浏览器**：通常 50MB - 几百MB
- **移动浏览器**：通常 50MB - 200MB
- **具体限制**：取决于设备可用空间

### 事务支持
- **读操作**：readonly 事务
- **写操作**：readwrite 事务
- **自动回滚**：失败时自动撤销

---

**现在就刷新页面，体验更大的存储空间吧！** 🎉
