@echo off
chcp 65001 >nul
title 一键部署到Vercel

echo.
echo ========================================
echo      微信界面克隆 - Vercel部署
echo ========================================
echo.

REM 检查是否安装了vercel CLI
where vercel >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] 未检测到Vercel CLI，正在安装...
    echo.
    call npm install -g vercel
    if errorlevel 1 (
        echo.
        echo [ERROR] 安装失败！
        echo.
        echo 请手动安装：npm install -g vercel
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Vercel CLI 安装成功！
    echo.
)

echo [INFO] 开始部署...
echo.

REM 运行vercel部署
call vercel

echo.
echo [INFO] 部署完成！
echo.
echo 提示：
echo  - 首次部署需要登录Vercel账号
echo  - 按照命令行提示操作即可
echo  - 部署成功后会显示网址
echo.
pause



