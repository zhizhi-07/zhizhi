@echo off
chcp 65001 >nul
echo ================================
echo   音乐搜索功能启动脚本
echo ================================
echo.

echo [1/3] 检查 Netlify CLI...
where netlify >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ 未检测到 Netlify CLI
    echo 正在安装 Netlify CLI...
    call npm install -g netlify-cli
    if %errorlevel% neq 0 (
        echo ❌ 安装失败！请手动运行: npm install -g netlify-cli
        pause
        exit /b 1
    )
    echo ✅ Netlify CLI 安装成功
) else (
    echo ✅ Netlify CLI 已安装
)

echo.
echo [2/3] 检查依赖...
if not exist "node_modules" (
    echo 正在安装项目依赖...
    call npm install
)

echo.
echo [3/3] 启动开发服务器...
echo.
echo ================================
echo   🎵 音乐搜索功能已启用
echo ================================
echo.
echo 访问地址将在下方显示
echo 按 Ctrl+C 停止服务
echo.

call netlify dev

pause
