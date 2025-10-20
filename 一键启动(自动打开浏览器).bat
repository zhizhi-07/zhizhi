@echo off
chcp 65001 >nul
title 微信界面克隆 - 启动中...

echo.
echo    ========================================
echo         微信界面克隆 - 一键启动
echo    ========================================
echo.

REM 检查依赖
if not exist "node_modules\" (
    echo [INFO] 首次运行，正在安装依赖...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] 安装失败！请确保已安装 Node.js
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] 安装完成！
    echo.
) else (
    echo [INFO] 依赖检查完成
    echo.
)

echo [INFO] 启动开发服务器...
echo.

REM 延迟3秒后打开浏览器
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM 启动开发服务器
title 微信界面克隆 - 运行中 (Ctrl+C停止)
call npm run dev

pause
