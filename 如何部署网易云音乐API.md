# 🎵 如何部署网易云音乐API

## 方法1：部署到Vercel（最简单，5分钟搞定）⭐

### 步骤1：Fork项目

1. 访问：https://github.com/Binaryify/NeteaseCloudMusicApi
2. 点击右上角 **Fork** 按钮
3. Fork到你自己的GitHub账号

### 步骤2：部署到Vercel

1. 访问：https://vercel.com
2. 登录你的账号
3. 点击 **"New Project"**
4. 导入你刚才Fork的 `NeteaseCloudMusicApi` 项目
5. 点击 **Deploy**（不需要任何配置）
6. 等待1-2分钟部署完成

### 步骤3：获取API地址

部署成功后，你会得到一个URL：
```
https://你的项目名.vercel.app
```

### 步骤4：测试API

在浏览器访问：
```
https://你的项目名.vercel.app/search?keywords=周杰伦
```

如果看到JSON格式的歌曲数据，说明部署成功！✅

### 步骤5：更新你的项目

**在 `netlify/functions/netease-proxy.ts` 中修改：**

```typescript
// 原来：
const searchUrl = `https://music.163.com/api/search/get/web?...`;

// 改为：
const searchUrl = `https://你的项目名.vercel.app/search?keywords=${encodeURIComponent(keyword)}&limit=30`;
```

---

## 方法2：部署到Netlify

### 步骤1：克隆项目

```bash
git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi
```

### 步骤2：安装依赖

```bash
npm install
```

### 步骤3：创建 `netlify.toml`

在项目根目录创建：
```toml
[build]
  command = "npm install"
  publish = "."

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server/:splat"
  status = 200
```

### 步骤4：部署

```bash
npm install -g netlify-cli
netlify init
netlify deploy --prod
```

---

## 方法3：使用公共API（不推荐，不稳定）

有一些公共的API服务，但**经常失效**：

```
https://netease-cloud-music-api-mu-five.vercel.app
https://music-api.hf.space
```

**不推荐原因：**
- ❌ 随时可能挂掉
- ❌ 速度慢
- ❌ 有请求限制

---

## 方法4：本地部署（开发测试用）

```bash
# 1. 克隆项目
git clone https://github.com/Binaryify/NeteaseCloudMusicApi.git
cd NeteaseCloudMusicApi

# 2. 安装依赖
npm install

# 3. 启动服务
node app.js

# 4. 访问
# http://localhost:3000
```

---

## 📝 API文档

部署成功后，访问你的API地址查看完整文档：
```
https://你的项目名.vercel.app
```

### 常用接口：

**1. 搜索音乐**
```
GET /search?keywords=周杰伦&limit=30
```

**2. 获取歌曲URL**
```
GET /song/url?id=186016
```

**3. 获取歌词**
```
GET /lyric?id=186016
```

**4. 获取歌曲详情**
```
GET /song/detail?ids=186016
```

**5. 获取热门歌曲**
```
GET /top/song?type=0
```

---

## 🎯 推荐方案（你的项目）

### 最佳实践：

1. **部署到Vercel**（5分钟搞定）
2. **获得自己的API地址**
3. **更新Netlify Function**使用你的API
4. **本地开发**继续用Vite代理（已经配置好了）

### 完整流程：

```
本地开发：
前端 → Vite代理 → music.163.com（真实API）

生产环境：
前端 → Netlify Function → 你的Vercel API → music.163.com
```

---

## 💡 为什么要自己部署？

### 优势：
- ✅ **完全免费**（Vercel免费额度足够用）
- ✅ **稳定可靠**（你自己的API不会挂）
- ✅ **无请求限制**（Vercel每月100GB流量）
- ✅ **速度快**（全球CDN加速）
- ✅ **自动更新**（项目有更新可以重新部署）

### 部署一次，永久使用！

---

## 🚀 快速开始

**最快的方法（1分钟）：**

1. 访问：https://github.com/Binaryify/NeteaseCloudMusicApi
2. 点击 README 中的 **"Deploy to Vercel"** 按钮
3. 登录Vercel
4. 点击Deploy
5. 完成！

---

## ⚠️ 注意事项

1. **仅供学习使用**
2. **不要滥用API**
3. **某些歌曲有版权限制**
4. **定期检查项目更新**

---

## 📚 相关资源

- 项目地址：https://github.com/Binaryify/NeteaseCloudMusicApi
- 项目文档：README中有详细说明
- Issue：遇到问题可以在GitHub提Issue

---

**推荐你现在就去部署一个，5分钟搞定！** 🎉
