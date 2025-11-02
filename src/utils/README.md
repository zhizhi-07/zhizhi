# Utils 工具函数库 - 使用指南

## 📁 新的组织结构

```
utils/
├── ai/              # AI 相关功能
├── social/          # 社交功能
├── storage/         # 存储相关
├── media/           # 媒体处理
├── features/        # 特色功能
├── parsers/         # 解析器
├── games/           # 游戏相关
├── external/        # 外部API
├── dev/             # 开发工具
└── index.ts         # 统一导出
```

---

## 🎯 使用方式

### 方式1: 从分类模块导入（推荐）

```typescript
// AI 相关
import { callAI, memorySystem, lorebookSystem } from '@/utils/ai'

// 社交功能
import { generateAIMoment, forumAI } from '@/utils/social'

// 存储相关
import { storage, storageObserver } from '@/utils/storage'

// 媒体处理
import { compressImage, parseEmoji } from '@/utils/media'

// 特色功能
import { accountingAssistant, walletUtils } from '@/utils/features'
```

### 方式2: 从主入口导入（向后兼容）

```typescript
// 仍然支持旧的导入方式
import { callAI, memorySystem, compressImage } from '@/utils'
```

---

## 📦 各模块详细说明

### 1. ai/ - AI 相关功能

**包含文件:**
- `api.ts` - AI API 调用
- `apiWithRetry.ts` - 带重试的 API 调用
- `aiResponseParser.ts` - AI 响应解析
- `memorySystem.ts` - 记忆系统
- `memoryCleanup.ts` - 记忆清理
- `lorebookSystem.ts` - Lorebook 系统
- `prompts.ts` - 提示词模板
- `tokenCounter.ts` - Token 计数
- `aiProactiveMessage.ts` - AI 主动消息
- `aiPhoneGenerator.ts` - AI 电话生成
- `backgroundPhoneGenerator.ts` - 后台电话生成
- `phoneContentParser.ts` - 电话内容解析
- `backgroundAI.ts` - 后台 AI
- `groupAIChat.ts` - 群聊 AI

**主要功能:**
```typescript
import {
  callAI,              // 调用 AI API
  memorySystem,        // 记忆系统
  lorebookSystem,      // Lorebook 系统
  countTokens,         // Token 计数
  parseAIResponse      // 解析 AI 响应
} from '@/utils/ai'
```

---

### 2. social/ - 社交功能

**包含文件:**
- `aiMomentsService.ts` - AI 朋友圈服务
- `aiMomentsSocial.ts` - AI 朋友圈社交
- `aiMomentsWithContext.ts` - 带上下文的 AI 朋友圈
- `aiSocialDirector.ts` - AI 社交导演
- `sparkMoments.ts` - Spark 朋友圈
- `momentsContext.ts` - 朋友圈上下文
- `momentsNotification.ts` - 朋友圈通知
- `forumAI.ts` - 论坛 AI
- `forumAIReply.ts` - 论坛 AI 回复
- `forumAutoReply.ts` - 论坛自动回复
- `forumDebug.ts` - 论坛调试
- `forumNotifications.ts` - 论坛通知
- `forumStorage.ts` - 论坛存储
- `groupSocialDirector.ts` - 群聊社交导演
- `memeManager.ts` - 表情包管理
- `memesRetrieval.ts` - 表情包检索
- `memeUsageTracker.ts` - 表情包使用追踪
- `xiaohongshuApi.ts` - 小红书 API

**主要功能:**
```typescript
import {
  generateAIMoment,    // 生成 AI 朋友圈
  forumAI,             // 论坛 AI
  memeManager          // 表情包管理
} from '@/utils/social'
```

---

### 3. storage/ - 存储相关

**包含文件:**
- `indexedDB.ts` - IndexedDB 操作
- `indexedDBStorage.ts` - IndexedDB 存储封装
- `storage.ts` - LocalStorage 封装
- `storageObserver.ts` - 存储观察者
- `storageMonitor.ts` - 存储监控
- `chatStorage.ts` - 聊天存储
- `chatListSync.ts` - 聊天列表同步
- `imageStorage.ts` - 图片存储
- `emojiStorage.ts` - 表情包存储
- `forumStorage.ts` - 论坛存储
- `emergencyCleanup.ts` - 紧急清理

**主要功能:**
```typescript
import {
  storage,             // LocalStorage 封装
  storageObserver,     // 存储观察者
  saveChatMessages,    // 保存聊天消息
  imageStorage         // 图片存储
} from '@/utils/storage'
```

---

### 4. media/ - 媒体处理

**包含文件:**
- `imageUtils.ts` - 图片处理工具
- `imageStorage.ts` - 图片存储
- `avatarUtils.ts` - 头像工具
- `clearAvatarCache.ts` - 清除头像缓存
- `emojiParser.ts` - 表情包解析
- `emojiStorage.ts` - 表情包存储

**主要功能:**
```typescript
import {
  compressImage,       // 压缩图片
  getAvatarUrl,        // 获取头像 URL
  parseEmoji           // 解析表情包
} from '@/utils/media'
```

---

### 5. features/ - 特色功能

**包含文件:**
- `accountingAssistant.ts` - 记账助手
- `accountingExtractor.ts` - 记账信息提取
- `walletUtils.ts` - 钱包工具
- `groupRedEnvelopeAlgorithm.ts` - 群红包算法
- `coupleSpaceUtils.ts` - 情侣空间工具
- `coupleSpaceContentUtils.ts` - 情侣空间内容工具
- `diarySystem.ts` - 日记系统
- `streakSystem.ts` - 连续签到系统
- `blacklistManager.ts` - 黑名单管理
- `offlineChatHelpers.ts` - 离线聊天助手
- `unreadMessages.ts` - 未读消息
- `notificationManager.ts` - 通知管理

**主要功能:**
```typescript
import {
  accountingAssistant,     // 记账助手
  walletUtils,             // 钱包工具
  blacklistManager,        // 黑名单管理
  notificationManager      // 通知管理
} from '@/utils/features'
```

---

### 6. parsers/ - 解析器

**包含文件:**
- `characterCardParser.ts` - 角色卡片解析
- `aiResponseParser.ts` - AI 响应解析
- `phoneContentParser.ts` - 电话内容解析
- `emojiParser.ts` - 表情包解析
- `regexProcessor.ts` - 正则处理器
- `pinyin.ts` - 拼音转换

**主要功能:**
```typescript
import {
  parseCharacterCard,  // 解析角色卡片
  parseAIResponse,     // 解析 AI 响应
  parseEmoji,          // 解析表情包
  pinyin               // 拼音转换
} from '@/utils/parsers'
```

---

### 7. games/ - 游戏相关

**包含文件:**
- `undercoverWords.ts` - 谁是卧底词库

**主要功能:**
```typescript
import { undercoverWords } from '@/utils/games'
```

---

### 8. external/ - 外部API

**包含文件:**
- `weather.ts` - 天气 API
- `xiaohongshuApi.ts` - 小红书 API

**主要功能:**
```typescript
import {
  getWeather,          // 获取天气
  xiaohongshuApi       // 小红书 API
} from '@/utils/external'
```

---

### 9. dev/ - 开发工具

**包含文件:**
- `performance.ts` - 性能监控
- `initTestData.ts` - 初始化测试数据
- `forumDebug.ts` - 论坛调试

**主要功能:**
```typescript
import {
  initPerformanceMonitor,  // 初始化性能监控
  measureApiCall,          // 测量 API 调用
  initTestData             // 初始化测试数据
} from '@/utils/dev'
```

---

## ✅ 优势

1. **清晰的组织结构** - 按功能分类，易于查找
2. **更好的代码提示** - IDE 可以更好地提示相关函数
3. **按需加载** - 可以只导入需要的模块
4. **向后兼容** - 旧的导入方式仍然有效
5. **易于维护** - 新增功能时知道放在哪个模块

---

## 🔄 迁移指南

### 旧代码（仍然有效）
```typescript
import { callAI, compressImage, memorySystem } from '@/utils'
```

### 新代码（推荐）
```typescript
import { callAI, memorySystem } from '@/utils/ai'
import { compressImage } from '@/utils/media'
```

**注意**: 不需要立即迁移，两种方式都可以正常工作！

