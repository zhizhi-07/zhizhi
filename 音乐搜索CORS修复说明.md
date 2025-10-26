# 音乐搜索CORS跨域问题修复

## 问题原因
直接从浏览器访问网易云音乐API会遇到CORS跨域错误：
```
Access to fetch at 'https://music.163.com/api/...' has been blocked by CORS policy
```

## 解决方案
创建Netlify函数作为后端代理，避免浏览器直接访问第三方API。

## 已完成的修复

### 1. 创建代理函数
**文件**: `netlify/functions/music-api.ts`
- 处理搜索、获取播放链接、获取歌词
- 设置正确的CORS响应头
- 转发请求到网易云API

### 2. 更新前端API
**文件**: `src/services/musicApi.ts`
- 修改为调用本地Netlify函数
- 路径: `/.netlify/functions/music-api`

## 如何使用

### 重启开发服务器（必须！）
```bash
# 停止当前运行的服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

### API调用示例
```typescript
// 搜索歌曲
GET /.netlify/functions/music-api?action=search&keyword=周杰伦&limit=30

// 获取播放链接
GET /.netlify/functions/music-api?action=url&id=12345

// 获取歌词
GET /.netlify/functions/music-api?action=lyric&id=12345
```

## 支持的功能
✅ 搜索歌曲
✅ 获取播放URL
✅ 获取歌词
✅ 无CORS限制
✅ 支持本地开发
✅ 支持Netlify部署

## 注意事项
1. 开发环境需要启动Netlify CLI
2. 生产环境部署到Netlify时自动生效
3. 如果使用其他部署平台，需要创建对应的服务端代理

## 故障排查

### 问题：仍然显示CORS错误
**解决**：确保已重启开发服务器

### 问题：404 Not Found
**解决**：检查是否使用 `npm run dev` 启动（支持Netlify函数）

### 问题：搜索没有结果
**解决**：
1. 检查网络连接
2. 查看浏览器控制台错误信息
3. 确认Netlify函数正常运行
