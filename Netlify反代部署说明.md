# 🚀 Netlify 反代部署说明

## ✅ 已完成的工作

### 1. 创建了 Netlify Function
- 文件：`netlify/functions/gemini-proxy.ts`
- 功能：10个 Gemini Keys 自动轮询、失败切换、负载均衡
- 速率控制：每个 Key 最少间隔 2 秒

### 2. 更新了项目配置
- `src/context/ApiContext.tsx` - 使用 Netlify Function 作为反代
- `src/utils/api.ts` - 识别 Netlify Functions 反代

---

## 📋 部署步骤

### 方法 1：本地测试（先测试）

1. **安装 Netlify CLI**（如果还没装）
   ```bash
   npm install -g netlify-cli
   ```

2. **本地运行**
   ```bash
   netlify dev
   ```

3. **测试反代**
   - 打开：`http://localhost:8888/.netlify/functions/gemini-proxy/health`
   - 应该看到健康检查数据

4. **测试项目**
   - 项目会自动在 `http://localhost:8888` 运行
   - 发送消息测试

### 方法 2：部署到 Netlify

1. **提交代码到 Git**
   ```bash
   git add .
   git commit -m "添加 Netlify Gemini 反代"
   git push
   ```

2. **Netlify 会自动部署**
   - 等待 2-3 分钟
   - 部署完成后会自动生效

3. **测试部署**
   - 访问：`https://你的域名.netlify.app/.netlify/functions/gemini-proxy/health`
   - 应该看到健康检查数据

---

## 🎯 优势

### 为什么 Netlify 比 Cloudflare Workers 好？

1. **不同的 IP**
   - Netlify 的 IP 不会被 Google 限制
   - Cloudflare Workers 的 IP 可能被很多人用

2. **和项目在一起**
   - 反代和项目部署在同一个地方
   - 不需要单独管理

3. **自动部署**
   - 代码更新后自动部署
   - 不需要手动复制粘贴

---

## 📊 反代地址

### 本地开发
```
http://localhost:8888/.netlify/functions/gemini-proxy
```

### 生产环境
```
https://你的域名.netlify.app/.netlify/functions/gemini-proxy
```

项目会自动使用正确的地址（通过 `window.location.origin`）

---

## 🧪 测试

### 健康检查
```bash
# 本地
curl http://localhost:8888/.netlify/functions/gemini-proxy/health

# 生产
curl https://你的域名.netlify.app/.netlify/functions/gemini-proxy/health
```

### API 调用
```bash
curl -X POST \
  http://localhost:8888/.netlify/functions/gemini-proxy/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "你好"}]
    }]
  }'
```

---

## 🔧 配置说明

### 修改 Keys
如果要更换 Keys，编辑：
```
netlify/functions/gemini-proxy.ts
```

找到：
```typescript
const GEMINI_KEYS = [
  'AIzaSy...',
  // 你的 Keys
];
```

### 修改速率限制
找到：
```typescript
const MIN_INTERVAL = 2000; // 改成你想要的毫秒数
```

---

## 🐛 故障排查

### 1. 本地测试失败
```bash
# 检查 Netlify CLI 是否安装
netlify --version

# 重新安装
npm install -g netlify-cli

# 登录 Netlify
netlify login
```

### 2. 部署后 404
- 检查 `netlify.toml` 配置
- 确认 Functions 文件夹路径正确

### 3. 还是 429
- 等待 5-10 分钟让 Google 的限制重置
- 检查健康检查页面，看哪些 Key 在冷却

---

## 📝 下一步

### 立即测试

1. **本地测试**
   ```bash
   netlify dev
   ```

2. **打开浏览器**
   - 访问：`http://localhost:8888`
   - 发送消息测试

3. **如果成功**
   - 提交代码
   - 推送到 Git
   - Netlify 自动部署

### 如果本地测试成功

说明反代没问题，可以部署到生产环境了！

### 如果本地测试还是 429

可能需要：
- 等待更长时间（15-30 分钟）
- 或者这些 Keys 确实有问题，需要换新的

---

**现在运行 `netlify dev` 测试吧！**
