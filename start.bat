@echo off
echo ========================================
echo    Love Library - Starting Servers
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo Starting servers...
echo.
echo Backend:  http://localhost:5000
echo Web App:  http://localhost:3000
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start backend in new window
start "Love Library - Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start web app in new window
start "Love Library - Web App" cmd /k "cd web && npm run dev"

echo.
echo Servers are starting in separate windows...
echo Close the windows or press Ctrl+C in each to stop them.
echo.
pause










