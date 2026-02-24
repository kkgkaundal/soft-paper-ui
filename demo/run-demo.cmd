@echo off
REM Soft Paper UI Demo Launcher for Windows

echo.
echo 🧻 Soft Paper UI - Demo Launcher
echo ==================================
echo.

REM Check if dist directory exists
if not exist "dist" (
    echo ⚠️  Build artifacts not found. Building project...
    call npm run build
    if errorlevel 1 (
        echo ❌ Build failed
        pause
        exit /b 1
    )
    echo ✅ Build complete!
    echo.
)

REM Check if server is already running
netstat -ano | findstr :8080 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Server already running on port 8080
    echo.
) else (
    echo 🚀 Starting local server on port 8080...
    echo.
    
    REM Try Python first
    where python >nul 2>&1
    if %errorlevel% equ 0 (
        start /B python -m http.server 8080
        timeout /t 2 >nul
        echo ✅ Server started ^(Python^)
    ) else (
        REM Try npx
        where npx >nul 2>&1
        if %errorlevel% equ 0 (
            start /B npx http-server -p 8080 -s
            timeout /t 2 >nul
            echo ✅ Server started ^(npx http-server^)
        ) else (
            REM Try PHP
            where php >nul 2>&1
            if %errorlevel% equ 0 (
                start /B php -S localhost:8080
                timeout /t 2 >nul
                echo ✅ Server started ^(PHP^)
            ) else (
                echo ❌ No suitable server found
                echo Please install Python, Node.js, or PHP
                pause
                exit /b 1
            )
        )
    )
    echo.
)

echo Choose a demo to view:
echo.
echo 1^) 📄 Full Page Demo ^(Recommended^)
echo    - Complete showcase with all features
echo    - 21 interactive elements
echo    - Live controls panel
echo.
echo 2^) 🏠 Landing Page
echo    - Feature highlights
echo    - Code examples
echo    - Documentation
echo.
echo 3^) 🌐 Open both in tabs
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Opening Full Page Demo...
    start http://localhost:8080/demo/full-page.html
) else if "%choice%"=="2" (
    echo.
    echo 🚀 Opening Landing Page...
    start http://localhost:8080/demo/index.html
) else if "%choice%"=="3" (
    echo.
    echo 🚀 Opening both demos...
    start http://localhost:8080/demo/full-page.html
    timeout /t 1 >nul
    start http://localhost:8080/demo/index.html
) else (
    echo.
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo ✨ Demo launched!
echo.
echo 📊 Server running at: http://localhost:8080
echo 📁 Full Page: http://localhost:8080/demo/full-page.html
echo 🏠 Landing: http://localhost:8080/demo/index.html
echo.
echo Press any key to stop the server and exit...
pause >nul

REM Kill the server process
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo 🛑 Server stopped
