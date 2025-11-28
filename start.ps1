# Love Library Startup Script
# Starts both backend and web app simultaneously

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Love Library - Starting Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check and free ports if needed
Write-Host "Checking ports..." -ForegroundColor Cyan
$port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if ($port5000) {
    $pid5000 = $port5000.OwningProcess
    Write-Host "⚠ Port 5000 is in use (PID: $pid5000). Stopping..." -ForegroundColor Yellow
    Stop-Process -Id $pid5000 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "✓ Port 5000 freed" -ForegroundColor Green
}

if ($port3000) {
    $pid3000 = $port3000.OwningProcess
    Write-Host "⚠ Port 3000 is in use (PID: $pid3000). Stopping..." -ForegroundColor Yellow
    Stop-Process -Id $pid3000 -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Host "✓ Port 3000 freed" -ForegroundColor Green
}

if (-not $port5000 -and -not $port3000) {
    Write-Host "✓ Both ports are free" -ForegroundColor Green
}

Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "⚠ Backend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "web\node_modules")) {
    Write-Host "⚠ Web dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location web
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "Web App:  http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host ""

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    npm run dev
}

# Start web app in background
$webJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location web
    npm run dev
}

# Function to cleanup on exit
function Cleanup {
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $backendJob, $webJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $webJob -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Green
    exit
}

# Register cleanup on Ctrl+C
[Console]::TreatControlCAsInput = $false
$null = Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Wait a bit for servers to start
Start-Sleep -Seconds 3

# Monitor jobs and show output
Write-Host "Servers are starting..." -ForegroundColor Green
Write-Host ""

try {
    # Show output from both jobs
    while ($true) {
        $backendOutput = Receive-Job $backendJob -ErrorAction SilentlyContinue
        $webOutput = Receive-Job $webJob -ErrorAction SilentlyContinue
        
        if ($backendOutput) {
            Write-Host "[Backend] $backendOutput" -ForegroundColor Magenta
        }
        if ($webOutput) {
            Write-Host "[Web]    $webOutput" -ForegroundColor Blue
        }
        
        Start-Sleep -Milliseconds 500
    }
} catch {
    Cleanup
}








