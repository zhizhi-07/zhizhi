# 小红书真实API配置指南（Netlify版）

## 概述

小红书API通过**Netlify Functions代理**调用，和音乐API一样的方式。这样可以：
- ✅ 解决CORS跨域问题
- ✅ 隐藏API密钥，保证安全
- ✅ 开发和生产环境统一
- ✅ 无需修改前端代码

## 架构说明

```
浏览器 → Netlify Functions → 外部小红书API
         (代理层，处理CORS)
```

**优点：**
- 和音乐API使用相同的架构
- API密钥不会暴露给前端
- 自动处理CORS
- 失败时自动回退到模拟数据

## 快速配置

### 1. 本地开发环境

创建 `.env` 文件（或修改现有的）：

```bash
# 小红书API配置
XIAOHONGSHU_API_URL=https://your-api-service.com/xiaohongshu/search
XIAOHONGSHU_API_KEY=your-api-key-here
```

### 2. Netlify生产环境

1. 登录 Netlify
2. 选择你的网站
3. 进入 **Site settings** → **Environment variables**
4. 添加环境变量：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `XIAOHONGSHU_API_URL` | `https://your-api.com/search` | 小红书API地址 |
| `XIAOHONGSHU_API_KEY` | `your-key` | API密钥（可选） |

### 3. 测试

1. 部署到Netlify
2. 打开小红书选择器
3. 搜索任意关键词
4. 查看浏览器控制台：

```
📕 尝试使用真实小红书API
🔍 通过Netlify Functions调用小红书API: 咖啡
✅ 真实API返回数据
```

## 代理函数说明

文件：`netlify/functions/xiaohongshu-api.ts`

**功能：**
- 接收前端搜索请求
- 添加API密钥（从环境变量）
- 调用真实小红书API
- 返回格式化数据
- 如果未配置API，返回提示

**调用示例：**
```
GET /.netlify/functions/xiaohongshu-api?action=search&keyword=咖啡&limit=10
```

## API接入方案

### 方案1：自建爬虫API（推荐）

使用Python FastAPI：

```python
# xiaohongshu_api/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS配置（Netlify Functions会处理，但本地测试需要）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/xiaohongshu/search")
async def search_xiaohongshu(
    keyword: str = Query(...),
    limit: int = Query(10)
):
    # 你的爬虫逻辑
    results = crawl_xiaohongshu(keyword, limit)
    
    return {
        "notes": results,
        "total": len(results),
        "hasMore": len(results) >= limit
    }
```

**部署：**
- Railway: `railway up`
- Render: 连接GitHub自动部署
- Heroku: `git push heroku main`

**然后在Netlify配置：**
```
XIAOHONGSHU_API_URL=https://your-app.railway.app/xiaohongshu/search
```

### 方案2：使用第三方API

如果使用RapidAPI等服务：

```
XIAOHONGSHU_API_URL=https://xiaohongshu-api.p.rapidapi.com/search
XIAOHONGSHU_API_KEY=your-rapidapi-key
```

### 方案3：完全使用模拟数据

不配置任何环境变量，应用会自动使用内置模拟数据。

## 数据格式要求

你的API需要返回以下格式：

```json
{
  "notes": [
    {
      "id": "note_id",
      "title": "标题",
      "description": "描述",
      "coverImage": "https://封面图URL",
      "images": ["图片数组"],
      "author": {
        "id": "author_id",
        "nickname": "作者昵称",
        "avatar": "头像URL"
      },
      "stats": {
        "likes": 123,
        "comments": 45,
        "collects": 67
      },
      "tags": ["标签1", "标签2"],
      "url": "https://www.xiaohongshu.com/explore/xxx",
      "createTime": 1234567890
    }
  ],
  "total": 100,
  "hasMore": true
}
```

## 调试

### 查看Netlify Functions日志

1. Netlify控制台 → Functions → xiaohongshu-api
2. 查看实时日志

### 本地测试Functions

```bash
# 安装Netlify CLI
npm install -g netlify-cli

# 本地运行（会自动加载.env）
netlify dev
```

访问：`http://localhost:8888/.netlify/functions/xiaohongshu-api?action=search&keyword=test`

### 常见错误

**错误1：未配置环境变量**
```json
{
  "useMock": true,
  "message": "未配置小红书API..."
}
```
解决：在Netlify添加环境变量

**错误2：API调用失败**
```
❌ 小红书API代理错误: Error: API请求失败: 401
⚠️ 真实API调用失败，回退到模拟数据
```
解决：检查API密钥是否正确

**错误3：数据格式不匹配**
修改 `netlify/functions/xiaohongshu-api.ts` 中的数据转换：
```typescript
const result = {
  notes: data.notes || data.data || data.items || [],  // 根据实际字段调整
  total: data.total || 0,
  hasMore: data.hasMore || false
}
```

## 安全性

✅ **优点：**
- API密钥在服务端，前端无法访问
- 只有你的Netlify site可以调用Functions
- 可以添加额外的验证逻辑

⚠️ **注意：**
- 不要将 `.env` 文件提交到Git
- 定期更换API密钥
- 监控API调用量

## 对比方案

### 音乐API（已有）
```typescript
/.netlify/functions/music-api
  → 网易云音乐API
  → QQ音乐API
```

### 小红书API（新增）
```typescript
/.netlify/functions/xiaohongshu-api
  → 你的小红书API
```

### 统一架构
两者使用完全相同的架构，便于维护和扩展。

## 部署检查清单

- [x] 创建 `netlify/functions/xiaohongshu-api.ts`
- [x] 修改前端使用Netlify Functions
- [x] 添加智能回退到模拟数据
- [ ] 在Netlify配置环境变量（如需真实API）
- [ ] 部署并测试
- [ ] 查看Functions日志确认

## FAQ

**Q: 一定要配置真实API吗？**
A: 不需要。默认使用模拟数据，开箱即用。

**Q: 本地开发时怎么测试？**
A: 使用 `netlify dev` 命令，会自动加载 `.env` 文件。

**Q: 部署后配置改变需要重新部署吗？**
A: 不需要。环境变量改变后，Netlify自动生效。

**Q: 和音乐API有什么区别？**
A: 架构完全相同，只是调用的外部API不同。

---

**推荐流程：**
1. 先使用模拟数据测试功能 ✅
2. 部署到Netlify确认一切正常 ✅
3. 如需真实数据，配置环境变量
4. 享受真实小红书数据！🎉
