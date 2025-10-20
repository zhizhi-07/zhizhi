# 微信 UI 克隆

一个使用 React + TypeScript + Tailwind CSS 构建的现代化微信移动端界面，采用液态玻璃效果和 iOS 风格设计。

## 功能特性

- 微信主界面（聊天列表）
- 通讯录页面
- 发现页面
- 个人中心页面
- 聊天详情页面
- 底部导航栏切换
- 移动端响应式设计
- 液态玻璃效果（Glassmorphism）
- iOS 风格界面设计
- 扁平化 SVG 图标

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- 自定义 SVG 图标组件

## 安装步骤

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 在浏览器中打开 `http://localhost:3000`

## 快速启动

双击项目根目录下的批处理文件：
- `一键启动(自动打开浏览器).bat` - 推荐使用，自动打开浏览器

## 构建生产版本

```bash
npm run build
```

## 预览生产版本

```bash
npm run preview
```

## 项目结构

```
├── src/
│   ├── components/
│   │   ├── Layout.tsx        # 主布局组件（包含底部导航）
│   │   └── Icons.tsx          # SVG 图标组件库
│   ├── pages/
│   │   ├── ChatList.tsx      # 聊天列表页面
│   │   ├── Contacts.tsx      # 通讯录页面
│   │   ├── Discover.tsx      # 发现页面
│   │   ├── Me.tsx            # 个人中心页面
│   │   └── ChatDetail.tsx    # 聊天详情页面
│   ├── App.tsx               # 应用主组件
│   ├── main.tsx              # 应用入口
│   └── index.css             # 全局样式（含玻璃效果）
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 设计特点

### 1. 液态玻璃效果（Glassmorphism）
- 半透明背景
- 背景模糊效果
- 细腻的边框高光
- 柔和的阴影

### 2. iOS 风格设计
- SF Pro 字体系列
- 圆角设计（16px-20px）
- 平滑的动画过渡
- 触控反馈效果

### 3. 扁平化图标
- 自定义 SVG 图标
- 矢量化设计
- 统一的视觉风格
- 轻量级实现

### 4. 响应式交互
- iOS 按钮点击效果
- 平滑的页面切换
- 消息气泡动画
- 流畅的滚动体验

## 功能说明

### 1. 微信主页（聊天列表）
- 显示聊天记录
- 支持点击进入聊天详情
- 空状态提示
- 搜索和添加功能

### 2. 通讯录
- 特殊联系人分组
- 联系人列表
- 空状态提示
- 搜索和添加功能

### 3. 发现
- 朋友圈、视频号入口
- 直播、扫一扫功能
- 看一看、搜一搜功能
- 小程序入口

### 4. 个人中心
- 个人信息展示
- 服务、收藏等功能入口
- 设置入口
- 卡片式布局

### 5. 聊天详情
- 实时发送消息
- 消息气泡样式
- 输入框和功能按钮
- 语音、表情、图片功能

## 查看建议

在浏览器中按 F12 打开开发者工具，切换到移动设备模式（Ctrl+Shift+M / Cmd+Shift+M）以获得最佳查看效果。

推荐设备预设：
- iPhone 12 Pro (390 x 844)
- iPhone 13 Pro (390 x 844)
- 自定义尺寸：375 x 667

## 注意事项

- 本项目用于学习和演示目的
- 界面模仿微信设计，不包含实际通信功能
- 所有聊天数据都是本地模拟数据
- 最佳体验宽度：375px - 480px

## 开发建议

### 添加新功能
1. 在 `src/pages/` 中创建新页面
2. 在 `src/App.tsx` 中添加路由
3. 在 `src/components/Icons.tsx` 中添加所需图标
4. 使用提供的玻璃效果样式类

### 自定义样式
- 修改 `tailwind.config.js` 配置主题色
- 在 `src/index.css` 中调整玻璃效果参数
- 使用 Tailwind CSS 工具类快速开发

## License

MIT
