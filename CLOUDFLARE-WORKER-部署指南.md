# 🚀 Cloudflare Worker 部署指南

## 为什么用 Cloudflare Workers？
- ✅ **可以联网** - 支持调用任何外部API
- ✅ **完全免费** - 100,000次请求/天
- ✅ **超快速度** - 全球边缘节点，延迟<50ms
- ✅ **零配置** - 自动HTTPS和CDN
- ✅ **无限带宽** - 没有流量限制

---

## 📋 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

会自动打开浏览器，登录你的Cloudflare账号（没有就注册一个，免费）

### 3. 部署 Worker

```bash
# 在项目根目录执行
wrangler deploy
```

部署成功后会得到一个URL，类似：
```
https://zhizhi-api.你的账号.workers.dev
```

### 4. 配置环境变量（可选）

如果需要配置AI API密钥等：

```bash
# 设置环境变量
wrangler secret put AI_API_KEY
# 然后输入你的API Key

# 或在Cloudflare Dashboard设置
```

---

## 🔧 更新前端配置

部署成功后，需要更新前端的API地址。

### 方法1：使用环境变量（推荐）

创建 `.env` 文件：

```env
# Cloudflare Worker API地址
VITE_WORKER_URL=https://zhizhi-api.你的账号.workers.dev
```

### 方法2：直接修改代码

在需要调用API的地方，把地址改为你的Worker URL：

```javascript
// 原来
const response = await fetch('https://music-api.hf.space/search?keywords=xxx')

// 改为
const response = await fetch('https://zhizhi-api.你的账号.workers.dev/api/music/search?keyword=xxx')
```

---

## 📚 API接口说明

Worker提供以下接口：

### 1. 音乐搜索
```
GET https://你的worker.workers.dev/api/music/search?keyword=关键词
```

### 2. 音乐详情
```
GET https://你的worker.workers.dev/api/music/detail?id=歌曲ID
```

### 3. 音乐播放URL
```
GET https://你的worker.workers.dev/api/music/url?id=歌曲ID
```

### 4. AI聊天
```
POST https://你的worker.workers.dev/api/ai/chat
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [...],
  "apiKey": "your-api-key",
  "apiUrl": "https://api.openai.com/v1/chat/completions"
}
```

### 5. 图片代理
```
GET https://你的worker.workers.dev/api/image-proxy?url=图片URL
```

### 6. 通用代理
```
GET/POST https://你的worker.workers.dev/api/proxy?url=目标URL
```

---

## 🔄 更新 Worker

修改代码后，重新部署：

```bash
wrangler deploy
```

---

## 📊 查看日志

```bash
wrangler tail
```

实时查看Worker的请求日志

---

## 🎯 测试 Worker

部署成功后，在浏览器访问：

```
https://你的worker.workers.dev
```

应该看到：
```json
{
  "success": true,
  "message": "Cloudflare Worker API 运行中",
  "endpoints": [...]
}
```

---

## 💡 常见问题

### Q: Worker URL是什么？
A: 部署成功后显示的URL，格式：`https://项目名.你的账号.workers.dev`

### Q: 如何修改Worker代码？
A: 编辑 `worker/index.js`，然后执行 `wrangler deploy`

### Q: 免费额度够用吗？
A: 100,000次请求/天，对个人项目绰绰有余

### Q: 如何绑定自定义域名？
A: 在Cloudflare Dashboard - Workers - 你的Worker - Triggers - Custom Domains

### Q: Worker能访问数据库吗？
A: 可以使用 Cloudflare D1（免费数据库）或KV存储

---

## 🚨 重要提示

1. **保护API密钥**：使用 `wrangler secret` 而不是硬编码
2. **添加速率限制**：防止滥用
3. **监控使用量**：在Cloudflare Dashboard查看

---

## 📞 需要帮助？

- Cloudflare Workers文档：https://developers.cloudflare.com/workers/
- Wrangler CLI文档：https://developers.cloudflare.com/workers/wrangler/

---

**部署完成后，记得更新前端配置！** 🎉
