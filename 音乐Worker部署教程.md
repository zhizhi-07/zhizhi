# Cloudflare Worker 音乐API部署教程

## 🚀 快速部署（5分钟搞定）

### 步骤1：登录Cloudflare
访问：https://dash.cloudflare.com
（如果没账号就注册一个，完全免费）

### 步骤2：创建Worker
1. 左侧菜单点击 **Workers & Pages**
2. 点击 **Create application**
3. 选择 **Create Worker**
4. 名字改成：`zhizhi-music-api`（或任意名字）
5. 点击 **Deploy**

### 步骤3：修改代码
1. 部署完成后，点击 **Edit code**
2. **删除所有代码**
3. 复制 `cloudflare-worker-music-api.js` 的全部内容
4. 粘贴到编辑器
5. 点击右上角 **Save and Deploy**

### 步骤4：获取Worker地址
部署完成后会显示地址，例如：
```
https://zhizhi-music-api.你的用户名.workers.dev
```

### 步骤5：更新前端代码
修改 `src/services/musicApi.ts`，将所有：
```javascript
https://zhizhi-api.2373922440jhj.workers.dev
```
替换成你的Worker地址：
```javascript
https://zhizhi-music-api.你的用户名.workers.dev
```

### 步骤6：测试
在浏览器访问：
```
https://zhizhi-music-api.你的用户名.workers.dev/api/music/search?keyword=周杰伦
```

如果返回JSON数据（歌曲列表），说明成功了！✅

---

## 📝 完整替换步骤

### 需要修改的文件
`src/services/musicApi.ts` 中的3个地方：

1. **搜索API**（第58行）
```javascript
apiUrl = `https://你的Worker地址/api/music/search`
```

2. **播放URL**（第125行）
```javascript
apiUrl = `https://你的Worker地址/api/music/url`
```

3. **歌词API**（第167行）
```javascript
apiUrl = `https://你的Worker地址/api/music/lyric`
```

---

## ✅ 验证部署成功

### 测试1：健康检查
```
https://你的Worker地址/health
```
应返回：`{ "status": "ok", ... }`

### 测试2：搜索歌曲
```
https://你的Worker地址/api/music/search?keyword=晴天
```
应返回歌曲列表

### 测试3：部署前端
部署到Vercel/Netlify后，打开音乐搜索功能测试

---

## 🎯 常见问题

### Q: Worker部署后404？
A: 检查路径是否正确，应该是 `/api/music/search` 而不是 `/search`

### Q: 仍然有CORS错误？
A: 确保Worker代码中有 `Access-Control-Allow-Origin: *`

### Q: 本地能搜索，部署后不行？
A: 检查Worker地址是否填对了，是否已经Save and Deploy

---

## 💡 提示

- Cloudflare Worker **完全免费**（每天100万次请求）
- 全球CDN加速，速度很快
- 无需服务器，自动扩容
- 一次部署，永久使用

**现在就去部署吧！** 🎉

