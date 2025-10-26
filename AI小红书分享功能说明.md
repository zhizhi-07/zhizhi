# AI小红书分享功能说明

## 功能概述

现在AI和你都可以在聊天中分享小红书帖子！就像朋友在微信中分享小红书链接一样，实现双向的内容分享。

### 数据来源

- **默认**：使用内置模拟数据（6个分类，开箱即用）
- **真实API**：可配置真实的小红书API获取真实数据

👉 **想使用真实数据？** 查看 [小红书真实API配置指南.md](./小红书真实API配置指南.md)

## 使用方式

### 你如何分享小红书

1. **点击加号菜单**
   - 在聊天输入框左侧点击"+"按钮
   - 选择"小红书"选项

2. **选择笔记**
   - 浏览推荐的小红书笔记
   - 使用搜索栏搜索特定内容
   - 点击分类标签快速筛选
   - 点击任意笔记卡片发送

3. **AI收到你的分享**
   - AI会看到你分享的小红书笔记
   - AI会根据内容做出回应
   - 就像真实的朋友互动一样

### AI如何分享小红书

AI在聊天时，可以使用以下格式分享小红书：

```
[小红书:关键词]
```

**示例：**
- `[小红书:咖啡店]` - 分享咖啡店相关笔记
- `[小红书:穿搭]` - 分享穿搭相关笔记
- `[小红书:美食]` - 分享美食相关笔记
- `[小红书:旅行 北京]` - 分享北京旅行相关笔记

### 使用场景

AI会在以下情况下主动分享小红书：

1. **聊到相关话题时**
   - 用户："最近想找个好看的咖啡店"
   - AI："我知道一家！[小红书:咖啡店]"

2. **推荐和建议时**
   - 用户："不知道穿什么好"
   - AI："这个博主的穿搭不错，你看看 [小红书:穿搭]"

3. **分享发现时**
   - AI："今天刷到个好吃的！[小红书:美食]"

## 小红书卡片展示

当AI分享小红书后，会显示一个精美的卡片，包含：

- 📷 **封面图** - 笔记的主图
- 📝 **标题** - 笔记标题
- 👤 **作者** - 发布者信息
- ❤️ **互动数据** - 点赞、评论、收藏数
- 🔗 **链接** - 点击可跳转到真实小红书

## 数据来源

### 模拟数据模式（默认）

应用内置了6个分类的模拟数据：
- 推荐
- 美食  
- 穿搭
- 美妆
- 旅行
- 探店

每个分类都有真实风格的笔记数据，可以直接使用。

### 真实API模式

✅ **现已支持！** 配置真实API后，将从实际的小红书平台获取数据：
- ✅ 真实的搜索结果
- ✅ 实时的笔记内容
- ✅ 真实的作者信息
- ✅ 真实的点赞/评论数

**如何配置？**
1. 参考 [小红书真实API配置指南.md](./小红书真实API配置指南.md)
2. 在浏览器控制台配置API地址和密钥
3. 刷新页面即可

**API智能回退：**
- 如果真实API调用失败，自动回退到模拟数据
- 保证功能始终可用

配置示例：
```javascript
// 在浏览器控制台执行
localStorage.setItem('xiaohongshu_api_config', JSON.stringify({
  enabled: true,
  apiUrl: 'https://your-api.com/xiaohongshu/search',
  apiKey: 'your-api-key'
}))
```

**选项3：自建代理服务**
```typescript
// 通过Netlify Function代理请求
const response = await fetch('/.netlify/functions/xiaohongshu-proxy')
```

## 技术实现

### 核心文件

1. **类型定义** - `src/types/xiaohongshu.ts`
   - XiaohongshuNote - 小红书笔记数据结构
   - XiaohongshuSearchResult - 搜索结果结构

2. **UI组件** - `src/components/XiaohongshuCard.tsx`
   - 小红书卡片展示组件
   - 支持图片加载失败处理
   - 悬停交互效果

3. **API服务** - `src/utils/xiaohongshuApi.ts`
   - searchXiaohongshuNotes() - 搜索笔记
   - getRecommendedNotes() - 获取推荐
   - getXiaohongshuForAI() - AI专用接口

4. **消息集成** - `src/pages/ChatDetail.tsx`
   - 扩展Message接口支持小红书类型
   - AI回复解析`[小红书:关键词]`
   - 消息渲染和交互

5. **提示词增强** - `src/utils/prompts.ts`
   - 在AI提示词中添加小红书功能说明
   - 教会AI何时使用、如何使用

### 消息格式

```typescript
{
  id: number,
  type: 'received',
  messageType: 'xiaohongshu',
  xiaohongshuNote: {
    id: 'xhs_001',
    title: '北京探店 | 这家咖啡店真的太好拍了！☕️',
    coverImage: 'https://...',
    author: {
      nickname: '小红薯用户',
      avatar: 'https://...'
    },
    stats: {
      likes: 12300,
      comments: 856,
      collects: 9800
    },
    url: 'https://www.xiaohongshu.com/explore/xhs_001'
  }
}
```

## 自定义配置

### 修改模拟数据

编辑 `src/utils/xiaohongshuApi.ts` 中的 `mockXiaohongshuNotes` 数组，添加或修改笔记：

```typescript
{
  id: 'xhs_custom_001',
  title: '你的标题',
  description: '你的描述',
  coverImage: '封面图URL',
  author: {
    id: 'user_id',
    nickname: '昵称',
    avatar: '头像URL'
  },
  stats: {
    likes: 1000,
    comments: 100,
    collects: 500
  },
  tags: ['标签1', '标签2'],
  url: 'https://www.xiaohongshu.com/explore/...'
}
```

### 调整AI使用频率

在 `src/utils/prompts.ts` 中修改使用建议：

```typescript
- 小红书分享：聊到相关话题时，可以分享小红书帖子推荐
```

可以改为：
- 更频繁：`聊到相关话题时，优先分享小红书帖子`
- 更保守：`只在用户明确需要推荐时才分享小红书`

## 测试方式

1. **启动应用**
   ```bash
   npm run dev
   ```

2. **与AI对话**
   - "推荐个咖啡店"
   - "最近有什么好吃的"
   - "想看看穿搭灵感"

3. **观察效果**
   - AI应该会发送`[小红书:关键词]`
   - 聊天中会显示小红书卡片
   - 点击卡片跳转（当前为模拟链接）

## 常见问题

### Q: 为什么点击卡片没有跳转？
A: 当前使用模拟数据，URL为占位符。接入真实API后会跳转到真实小红书页面。

### Q: 如何添加更多小红书内容？
A: 编辑 `src/utils/xiaohongshuApi.ts` 的 `mockXiaohongshuNotes` 数组，添加新的笔记对象。

### Q: AI不分享小红书怎么办？
A: 检查AI的提示词设置，确保包含小红书功能说明。可以尝试更明确地要求："发个小红书推荐"。

### Q: 如何接入真实小红书API？
A: 参考 `src/utils/xiaohongshuApi.ts` 文件末尾的注释，根据你的需求选择合适的方案。

## 后续优化建议

1. **真实数据接入**
   - 申请小红书开放平台账号
   - 或使用第三方数据API服务

2. **搜索优化**
   - 添加分类筛选
   - 支持多关键词组合
   - 智能推荐算法

3. **交互增强**
   - 卡片内预览图片轮播
   - 收藏功能
   - 分享给其他角色

4. **性能优化**
   - 图片懒加载
   - 数据缓存
   - 预加载相关内容

## 总结

现在AI可以像真人一样在聊天中分享小红书内容了！这让对话更加丰富和实用。当前版本使用模拟数据演示功能，后续可以轻松接入真实API。

祝使用愉快！🎉
