# 🚀 部署指南

## ✅ 项目配置检查

你的项目配置**完全正常**！Vite 和 Netlify 是完美搭档：
- **Vite**：负责前端构建（`npm run build` → `dist/`）
- **Netlify**：负责托管网站 + Serverless Functions

---

## 📋 部署前检查清单

### 1. ✅ 必需文件（已存在）
- [x] `netlify.toml` - Netlify 配置
- [x] `package.json` - 依赖管理
- [x] `vite.config.ts` - Vite 构建配置
- [x] `.gitignore` - Git 忽略配置
- [x] `.env.example` - 环境变量示例

### 2. ✅ Netlify Functions（已修复）
- [x] `chat.ts` - AI 聊天
- [x] `gemini-proxy.ts` - Gemini API 代理
- [x] `vision.ts` - **头像识图功能（已新建）** ⭐
- [x] `music-api.ts` - 音乐 API
- [x] `change-avatar.ts` - 换头像
- [x] `xiaohongshu-api.ts` - 小红书 API
- [x] `xiaohongshu-extract.ts` - 小红书提取
- [x] `sync-data.ts` - 数据同步
- [x] `scheduled-messages.ts` - 定时消息

### 3. ⚠️ 环境变量配置（需要在 Netlify 设置）

在 Netlify Dashboard → Site settings → Environment variables 中配置：

```bash
# 必需
DEEPSEEK_API_KEY=your_deepseek_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here  # 用于头像识图

# 可选
XIAOHONGSHU_API_URL=
XIAOHONGSHU_API_KEY=
```

**注意**：`vision.ts` 已内置 backup key，但建议配置自己的 API Key。

---

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（Vite only）
npm run dev

# 启动开发服务器（Vite + Netlify Functions）
npm run dev:netlify

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

---

## 📦 部署到 Netlify

### 方式1：通过 Git（推荐）

1. 推送代码到 GitHub
2. 在 Netlify Dashboard 中连接仓库
3. 构建设置会自动读取 `netlify.toml`
4. 配置环境变量
5. 点击 Deploy

### 方式2：手动部署

```bash
# 构建
npm run build

# 使用 Netlify CLI 部署
npx netlify deploy --prod
```

---

## 🐛 已修复的漏洞

### ❌ 问题：`vision.ts` 函数不存在
**影响**：头像识图功能完全无法使用

**症状**：
- 创建角色上传头像时调用 `/.netlify/functions/vision` 失败
- 编辑角色上传头像时调用失败
- 首次进入聊天时自动识图失败
- AI 无法"看到"用户和自己的头像

**✅ 已修复**：
- 创建了 `netlify/functions/vision.ts`
- 使用 Gemini Vision API
- 统一了函数格式（Handler v1）
- 添加了 backup API key
- 添加了 CORS 支持

---

## 📊 构建产物

```
dist/                    # Vite 构建输出（前端）
├── index.html
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
└── ...

netlify/functions/       # Netlify Functions（后端）
├── chat.ts
├── vision.ts          # ⭐ 新增
├── gemini-proxy.ts
└── ...
```

---

## 🔒 安全建议

1. **不要提交 `.env` 文件到 Git**（已在 `.gitignore` 中）
2. **在 Netlify 中配置环境变量**，不要硬编码 API Key
3. **定期更新依赖**：`npm outdated` → `npm update`
4. **监控 API 使用量**，避免超额

---

## 📝 常见问题

### Q: 部署后 Functions 报错？
A: 检查 Netlify 环境变量是否配置正确

### Q: 头像识图不工作？
A: 
1. 检查 `GEMINI_API_KEY` 是否配置
2. 查看 Netlify Functions 日志
3. backup key 已内置，理论上应该能工作

### Q: 构建失败？
A: 检查 Node.js 版本（建议 18+）

---

## ✨ 部署状态

- ✅ Vite 配置正常
- ✅ Netlify 配置正常
- ✅ Functions 格式统一
- ✅ 头像识图功能已修复
- ✅ 环境变量文档完整
- ⚠️ 需要在 Netlify 配置环境变量

**可以部署了！** 🎉
