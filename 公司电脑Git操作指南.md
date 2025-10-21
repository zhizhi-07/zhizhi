# 🏢 公司电脑 Git 操作指南

> 这是一份给 AI 助手的操作指南，直接复制给 AI 执行即可

---

## 📋 项目信息

- **项目名称**: 汁汁AI (ZhiZhi AI)
- **GitHub 仓库**: https://github.com/2373922440jhj-del/zhizhi
- **技术栈**: React + TypeScript + Vite + TailwindCSS
- **包管理器**: npm

---

## 🚀 第一次在公司电脑操作（克隆项目）

### 给 AI 的指令：

```
请帮我执行以下操作：

1. 打开 PowerShell
2. 进入工作目录（比如 D:\Projects）
3. 克隆 GitHub 项目：
   git clone https://github.com/2373922440jhj-del/zhizhi.git
4. 进入项目目录：
   cd zhizhi
5. 安装依赖：
   npm install
6. 启动开发服务器：
   npm run dev
7. 在浏览器打开 http://localhost:5173
```

---

## 🐛 修复 Bug 后提交代码

### 给 AI 的指令：

```
我已经修复了一些 bug，请帮我提交代码到 GitHub：

1. 查看修改了哪些文件：
   git status
2. 添加所有修改：
   git add .
3. 提交修改（请用描述性的提交信息）：
   git commit -m "修复了XXX bug"
4. 推送到 GitHub：
   git push
```

---

## 🔄 拉取最新代码（如果家里电脑有更新）

### 给 AI 的指令：

```
请帮我从 GitHub 拉取最新代码：

1. 进入项目目录：
   cd D:\Projects\zhizhi
2. 拉取最新代码：
   git pull
3. 如果有新依赖，安装一下：
   npm install
4. 启动开发服务器：
   npm run dev
```

---

## 📦 部署到 Netlify

### 给 AI 的指令：

```
请帮我部署项目到 Netlify：

1. 构建项目：
   npm run build
2. 部署到生产环境：
   netlify deploy --prod --dir=dist
3. 确认部署成功后，告诉我网址
```

---

## ⚠️ 常见问题处理

### 问题1：git pull 时出现冲突

**给 AI 的指令：**
```
git pull 时出现冲突，请帮我：

1. 查看冲突文件：
   git status
2. 如果我的修改更重要，使用我的版本：
   git checkout --ours <文件名>
3. 如果家里的修改更重要，使用远程版本：
   git checkout --theirs <文件名>
4. 解决冲突后：
   git add .
   git commit -m "解决冲突"
   git push
```

### 问题2：忘记提交就修改了

**给 AI 的指令：**
```
我忘记先 pull 就开始修改了，现在想推送，请帮我：

1. 暂存当前修改：
   git stash
2. 拉取最新代码：
   git pull
3. 恢复我的修改：
   git stash pop
4. 提交并推送：
   git add .
   git commit -m "描述"
   git push
```

### 问题3：npm install 失败

**给 AI 的指令：**
```
npm install 失败了，请帮我：

1. 清理缓存：
   npm cache clean --force
2. 删除 node_modules：
   Remove-Item -Recurse -Force node_modules
3. 删除 package-lock.json：
   Remove-Item package-lock.json
4. 重新安装：
   npm install
```

---

## 📝 快速命令参考

### 日常开发流程

```bash
# 早上到公司
cd D:\Projects\zhizhi
git pull
npm install  # 如果有新依赖
npm run dev

# 修改代码...

# 下班前提交
git add .
git commit -m "今天的工作内容"
git push
```

### 查看状态

```bash
git status          # 查看修改了什么
git log             # 查看提交历史
git diff            # 查看具体改动
```

### 撤销操作

```bash
git checkout .      # 撤销所有未提交的修改
git reset HEAD~1    # 撤销最后一次提交（保留修改）
```

---

## 🎯 给 AI 的完整工作流指令

### 早上开始工作

```
请帮我开始今天的工作：

1. 进入项目目录：cd D:\Projects\zhizhi
2. 拉取最新代码：git pull
3. 检查是否有新依赖：npm install
4. 启动开发服务器：npm run dev
5. 打开浏览器预览
```

### 下班前提交

```
请帮我提交今天的工作：

1. 查看修改：git status
2. 添加所有修改：git add .
3. 提交修改：git commit -m "今天修复的bug和新增的功能"
4. 推送到 GitHub：git push
5. 确认推送成功
```

---

## 📞 紧急情况

如果遇到任何问题，可以：

1. 截图错误信息发给我
2. 或者直接问 AI："遇到了XXX错误，怎么解决？"
3. 最坏情况：重新克隆项目（会丢失本地未提交的修改）

---

## 🔐 认证信息

- **GitHub 用户名**: 2373922440jhj-del
- **仓库名**: zhizhi
- **Token**: 已配置（如果需要重新输入，联系我）

---

## ✅ 检查清单

### 第一次设置
- [ ] 克隆项目成功
- [ ] npm install 成功
- [ ] npm run dev 能正常运行
- [ ] 浏览器能访问 localhost:5173

### 每天工作
- [ ] 早上先 git pull
- [ ] 修改代码
- [ ] 测试功能正常
- [ ] git add . && git commit && git push
- [ ] 确认推送成功

---

**祝工作顺利！有问题随时问 AI～** (｡･ω･｡)
