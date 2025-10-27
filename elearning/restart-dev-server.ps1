# PowerShell script to restart React development server with proper environment loading

Write-Host "🔄 Restarting React Development Server with Environment Variables..." -ForegroundColor Cyan
Write-Host ""

Write-Host "📁 Current directory: $PWD" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔍 Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    Write-Host "📄 Contents:" -ForegroundColor Yellow
    Get-Content .env
    Write-Host ""
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "💡 Create .env file with REACT_APP_GOOGLE_CLIENT_ID=your_client_id" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "🛑 Stopping any running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "💡 Environment variables should now be loaded properly" -ForegroundColor Cyan
Write-Host ""

npm start
