@echo off
chcp 65001 >nul
echo ========================================
echo    微信界面克隆 - 一键启动
echo ========================================
echo.

REM 检查node_modules文件夹是否存在
if not exist "node_modules\" (
    echo [1/2] 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [错误] 依赖安装失败！
        echo 请确保已安装 Node.js
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [成功] 依赖安装完成！
    echo.
) else (
    echo [1/2] 依赖已存在，跳过安装
    echo.
)

echo [2/2] 正在启动开发服务器...
echo.
echo ========================================
echo   启动完成后，浏览器会自动打开
echo   如果没有自动打开，请访问：
echo   http://localhost:3000
echo ========================================
echo.
echo 提示：
echo    - 按 Ctrl+C 可以停止服务器
echo    - 建议使用浏览器的移动设备模式查看
echo    - 按 F12 打开开发者工具
echo.
echo 正在启动...
echo.

REM 启动开发服务器
call npm run dev

pause
