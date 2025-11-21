# Windows Development Environment Setup Script
# Installs: Node.js, pnpm, Docker Desktop, Git

Write-Host "Windows Development Environment Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try {
        if (Get-Command $command) {
            return $true
        }
    }
    catch {
        return $false
    }
    finally {
        $ErrorActionPreference = $oldPreference
    }
}

# Function to check winget availability
function Test-WingetAvailable {
    if (Test-CommandExists "winget") {
        Write-Host "[OK] winget is available" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "[ERROR] winget is not available" -ForegroundColor Red
        Write-Host "Please install App Installer from the Microsoft Store" -ForegroundColor Yellow
        Write-Host "https://www.microsoft.com/p/app-installer/9nblggh4nns1" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "Checking prerequisites..." -ForegroundColor Cyan
Write-Host ""

if (-not (Test-WingetAvailable)) {
    Write-Host ""
    Write-Host "Cannot proceed without winget. Install it and run this script again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Checking current installations..." -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$nodeInstalled = Test-CommandExists "node"
if ($nodeInstalled) {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js is installed: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "[MISSING] Node.js is NOT installed" -ForegroundColor Red
}

# Check npm
$npmInstalled = Test-CommandExists "npm"
if ($npmInstalled) {
    $npmVersion = npm --version
    Write-Host "[OK] npm is installed: v$npmVersion" -ForegroundColor Green
}
else {
    Write-Host "[MISSING] npm is NOT installed" -ForegroundColor Red
}

# Check pnpm
$pnpmInstalled = Test-CommandExists "pnpm"
if ($pnpmInstalled) {
    $pnpmVersion = pnpm --version
    Write-Host "[OK] pnpm is installed: v$pnpmVersion" -ForegroundColor Green
}
else {
    Write-Host "[MISSING] pnpm is NOT installed" -ForegroundColor Red
}

# Check Docker
$dockerInstalled = Test-CommandExists "docker"
if ($dockerInstalled) {
    $dockerVersion = docker --version
    Write-Host "[OK] Docker is installed: $dockerVersion" -ForegroundColor Green
}
else {
    Write-Host "[MISSING] Docker is NOT installed" -ForegroundColor Red
}

# Check Git
$gitInstalled = Test-CommandExists "git"
if ($gitInstalled) {
    $gitVersion = git --version
    Write-Host "[OK] Git is installed: $gitVersion" -ForegroundColor Green
}
else {
    Write-Host "[MISSING] Git is NOT installed" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Build list of what to install
$toInstall = @()

if (-not $nodeInstalled) {
    $toInstall += "Node.js"
}
if (-not $pnpmInstalled) {
    $toInstall += "pnpm"
}
if (-not $dockerInstalled) {
    $toInstall += "Docker Desktop"
}
if (-not $gitInstalled) {
    $toInstall += "Git"
}

if ($toInstall.Count -eq 0) {
    Write-Host "[SUCCESS] All required dependencies are already installed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You're ready to run:" -ForegroundColor Cyan
    Write-Host "  pnpm install" -ForegroundColor Yellow
    Write-Host "  pnpm dev:docker:win" -ForegroundColor Yellow
    exit 0
}

Write-Host "Missing dependencies:" -ForegroundColor Yellow
foreach ($item in $toInstall) {
    Write-Host "  - $item" -ForegroundColor Yellow
}
Write-Host ""

$install = Read-Host "Would you like to install missing dependencies? (y/n)"
if ($install -ne "y" -and $install -ne "Y") {
    Write-Host "Installation cancelled." -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Starting installation..." -ForegroundColor Cyan
Write-Host ""

# Install Node.js
if (-not $nodeInstalled) {
    Write-Host "[INSTALLING] Node.js v20.x..." -ForegroundColor Cyan
    try {
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        Write-Host "[OK] Node.js installed successfully" -ForegroundColor Green
        Write-Host "[INFO] You may need to restart your terminal" -ForegroundColor Yellow
    }
    catch {
        Write-Host "[ERROR] Failed to install Node.js: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Install pnpm
if (-not $pnpmInstalled) {
    Write-Host "[INSTALLING] pnpm..." -ForegroundColor Cyan
    try {
        if (Test-CommandExists "npm") {
            npm install -g pnpm
            Write-Host "[OK] pnpm installed successfully via npm" -ForegroundColor Green
        }
        else {
            Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression
            Write-Host "[OK] pnpm installed successfully" -ForegroundColor Green
        }
        Write-Host "[INFO] You may need to restart your terminal" -ForegroundColor Yellow
    }
    catch {
        Write-Host "[ERROR] Failed to install pnpm: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Install Docker Desktop
if (-not $dockerInstalled) {
    Write-Host "[INSTALLING] Docker Desktop..." -ForegroundColor Cyan
    Write-Host "[INFO] Note: Docker Desktop requires WSL2 to be enabled" -ForegroundColor Yellow
    try {
        winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
        Write-Host "[OK] Docker Desktop installed successfully" -ForegroundColor Green
        Write-Host "[WARNING] You MUST restart your computer for Docker to work" -ForegroundColor Yellow
        Write-Host "[INFO] After restart, launch Docker Desktop from Start menu" -ForegroundColor Yellow
    }
    catch {
        Write-Host "[ERROR] Failed to install Docker Desktop: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Install Git
if (-not $gitInstalled) {
    Write-Host "[INSTALLING] Git..." -ForegroundColor Cyan
    try {
        winget install Git.Git --accept-package-agreements --accept-source-agreements
        Write-Host "[OK] Git installed successfully" -ForegroundColor Green
        Write-Host "[INFO] You may need to restart your terminal" -ForegroundColor Yellow
    }
    catch {
        Write-Host "[ERROR] Failed to install Git: $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] Installation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Close and reopen your terminal" -ForegroundColor Yellow
Write-Host "  2. If Docker was installed, restart your computer" -ForegroundColor Yellow
Write-Host "  3. Launch Docker Desktop and wait for it to start" -ForegroundColor Yellow
Write-Host "  4. Navigate to your project directory" -ForegroundColor Yellow
Write-Host "  5. Run: pnpm install" -ForegroundColor Yellow
Write-Host "  6. Run: pnpm dev:docker:win" -ForegroundColor Yellow
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
