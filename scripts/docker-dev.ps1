# Docker Container Management Script

Write-Host "Docker Container Management" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$options = @(
    "Start containers",
    "Stop containers", 
    "Stop and remove all containers",
    "Show current containers",
    "Cancel"
)

do {
    Write-Host "Select an action:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $options.Length; $i++) {
        Write-Host "  $($i + 1). $($options[$i])"
    }
    Write-Host ""
    
    $selection = Read-Host "Enter your choice (1-$($options.Length))"
    
    switch ($selection) {
        "1" {
            Write-Host ""
            Write-Host "[STARTING] Starting containers..." -ForegroundColor Green
            docker compose up
            exit 0
        }
        "2" {
            Write-Host ""
            Write-Host "[STOPPING] Stopping containers..." -ForegroundColor Yellow
            docker compose stop
            exit 0
        }
        "3" {
            Write-Host ""
            Write-Host "[REMOVING] Stopping and removing all containers..." -ForegroundColor Red
            docker compose down
            exit 0
        }
        "4" {
            Write-Host ""
            Write-Host "[INFO] Current containers:" -ForegroundColor Cyan
            docker compose ps
            Write-Host ""
        }
        "5" {
            Write-Host ""
            Write-Host "[CANCELLED] Operation cancelled" -ForegroundColor Gray
            exit 0
        }
        default {
            Write-Host ""
            Write-Host "[ERROR] Invalid option. Please select 1-5" -ForegroundColor Red
            Write-Host ""
        }
    }
} while ($true)
