@echo off
echo 🔄 Restarting React Development Server with Environment Variables...
echo.

echo 📁 Current directory: %CD%
echo.

echo 🔍 Checking .env file...
if exist .env (
    echo ✅ .env file found
    echo 📄 Contents:
    type .env
    echo.
) else (
    echo ❌ .env file not found
    echo 💡 Create .env file with REACT_APP_GOOGLE_CLIENT_ID=your_client_id
    pause
    exit /b 1
)

echo 🛑 Stopping any running processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🧹 Clearing npm cache...
call npm cache clean --force

echo 🚀 Starting development server...
echo 💡 Environment variables should now be loaded properly
echo.

call npm start

pause
