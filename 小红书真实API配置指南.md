# 小红书真实API配置指南

## 概述

默认情况下，应用使用内置的模拟数据。如果你想使用真实的小红书数据，需要配置API接口。

## 快速配置

### 1. 打开浏览器控制台

1. 在聊天页面按 `F12` 打开开发者工具
2. 切换到 `Console`（控制台）标签

### 2. 配置API

在控制台中执行以下代码：

```javascript
// 导入配置函数
import { saveXiaohongshuApiConfig } from './src/utils/xiaohongshuApi'

// 配置真实API
saveXiaohongshuApiConfig({
  enabled: true,                                    // 启用真实API
  apiUrl: 'https://your-api.com/xiaohongshu/search', // 你的API地址
  apiKey: 'your-api-key-here'                       // API密钥（可选）
})
```

或者直接在控制台运行：

```javascript
localStorage.setItem('xiaohongshu_api_config', JSON.stringify({
  enabled: true,
  apiUrl: 'https://your-api.com/xiaohongshu/search',
  apiKey: 'your-api-key-here'
}))
```

### 3. 刷新页面

配置完成后刷新页面，应用将开始使用真实API。

## API要求

### API格式

你的API需要支持以下格式：

**请求：**
```
GET https://your-api.com/xiaohongshu/search?keyword=咖啡&limit=10
Headers:
  Content-Type: application/json
  Authorization: Bearer your-api-key (如果需要)
```

**响应：**
```json
{
  "notes": [
    {
      "id": "唯一ID",
      "title": "标题",
      "description": "描述",
      "coverImage": "封面图URL",
      "images": ["图片URL数组"],
      "author": {
        "id": "作者ID",
        "nickname": "作者昵称",
        "avatar": "头像URL"
      },
      "stats": {
        "likes": 点赞数,
        "comments": 评论数,
        "collects": 收藏数
      },
      "tags": ["标签数组"],
      "url": "笔记链接",
      "createTime": 时间戳
    }
  ],
  "total": 总数,
  "hasMore": 是否有更多
}
```

### 兼容性说明

如果你的API返回格式不同，需要修改 `src/utils/xiaohongshuApi.ts` 中的数据转换部分：

```typescript
// 在 searchRealXiaohongshuApi 函数中
return {
  notes: data.notes || data.data || [],  // 根据实际字段调整
  total: data.total || data.notes?.length || 0,
  hasMore: data.hasMore || false
}
```

## 获取真实API的方法

### 方法1：自建API（推荐）

使用Python + Flask/FastAPI搭建简单的爬虫API：

```python
# 示例：使用FastAPI
from fastapi import FastAPI
import httpx

app = FastAPI()

@app.get("/xiaohongshu/search")
async def search_xiaohongshu(keyword: str, limit: int = 10):
    # 这里实现你的爬虫逻辑
    # 注意：爬虫需要遵守网站的robots.txt和使用条款
    
    # 示例返回格式
    return {
        "notes": [
            # ... 笔记数据
        ],
        "total": 100,
        "hasMore": True
    }
```

**优点：**
- 完全控制
- 免费
- 可以自定义功能

**缺点：**
- 需要自己维护
- 可能需要处理反爬虫
- 需要服务器

### 方法2：使用第三方API服务

一些提供小红书数据的API服务商：

1. **RapidAPI** (https://rapidapi.com/)
   - 搜索 "Xiaohongshu" 或 "Little Red Book"
   - 有免费和付费套餐

2. **Data365** 
   - 提供小红书数据API
   - 付费服务

3. **其他爬虫服务商**
   - 根据你所在地区搜索相关服务

**配置示例：**
```javascript
saveXiaohongshuApiConfig({
  enabled: true,
  apiUrl: 'https://rapidapi.com/xxx/xiaohongshu-search',
  apiKey: 'your-rapidapi-key'
})
```

### 方法3：使用云函数（Serverless）

部署到 Netlify/Vercel Functions:

```javascript
// netlify/functions/xiaohongshu-search.js
exports.handler = async (event) => {
  const { keyword, limit = 10 } = event.queryStringParameters
  
  // 你的爬虫逻辑
  const results = await fetchXiaohongshuData(keyword, limit)
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(results)
  }
}
```

**配置：**
```javascript
saveXiaohongshuApiConfig({
  enabled: true,
  apiUrl: 'https://your-site.netlify.app/.netlify/functions/xiaohongshu-search'
})
```

## 调试和测试

### 检查配置

在控制台运行：
```javascript
console.log(JSON.parse(localStorage.getItem('xiaohongshu_api_config')))
```

### 测试搜索

打开小红书选择器，搜索任意关键词，查看控制台日志：

```
📕 使用真实小红书API
🔍 调用真实小红书API: 咖啡
✅ 真实API返回数据: {...}
```

### 常见错误

**错误1: API调用失败**
```
❌ 真实API调用失败: Error: API请求失败: 401 Unauthorized
⚠️ 真实API调用失败，回退到模拟数据
```
解决：检查API密钥是否正确

**错误2: CORS错误**
```
Access to fetch at 'xxx' has been blocked by CORS policy
```
解决：API需要配置CORS允许跨域请求

**错误3: 数据格式不匹配**
```
⚠️ 真实API调用失败，回退到模拟数据
```
解决：修改 `xiaohongshuApi.ts` 中的数据转换逻辑

## 关闭真实API

如果想回到模拟数据：

```javascript
localStorage.setItem('xiaohongshu_api_config', JSON.stringify({
  enabled: false,
  apiUrl: '',
  apiKey: ''
}))
```

然后刷新页面。

## 重要提示

⚠️ **法律和道德考虑：**
1. 小红书官方没有公开API
2. 爬虫需要遵守网站的robots.txt
3. 不要进行大规模爬取
4. 尊重用户隐私和版权
5. 仅用于个人学习和测试

⚠️ **安全提示：**
1. 不要在公开代码中暴露API密钥
2. 使用环境变量存储敏感信息
3. 定期更换API密钥

## 推荐方案

对于个人使用，推荐：

1. **开发测试阶段**：使用模拟数据（无需配置）
2. **生产环境**：
   - 小规模：使用Netlify Functions + 简单爬虫
   - 大规模：购买第三方API服务

## 需要帮助？

如果你需要：
- API接口开发
- 爬虫脚本编写
- 云函数部署指导

可以参考以下资源：
- FastAPI文档: https://fastapi.tiangolo.com/
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Vercel Functions: https://vercel.com/docs/functions

---

**最后更新**: 2025-01-26
