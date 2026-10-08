# Starts both Imibavu servers (API + frontend) and opens the browser.
# Double-click this file, or run:  powershell -ExecutionPolicy Bypass -File start-servers.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting API on http://localhost:5000 ..." -ForegroundColor Yellow
Start-Process node -ArgumentList "src\index.js" -WorkingDirectory (Join-Path $root "server")

Write-Host "Starting frontend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process node -ArgumentList "serve.js" -WorkingDirectory $root

Start-Sleep -Seconds 4
Write-Host ""
Write-Host "  API      http://localhost:5000/api/v1/health" -ForegroundColor Green
Write-Host "  Frontend http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "  Demo admin: admin@imibavucollection.rw  /  Admin123" -ForegroundColor Cyan
Write-Host "  Demo admin: admin@imibavu250            /  Admin123" -ForegroundColor Cyan
Write-Host ""
Start-Process "http://localhost:8000/"
