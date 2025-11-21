# Windows Development Setup Guide

## TL;DR - Just Run This

Open PowerShell and navigate to your project:

```powershell
cd C:\Users\mamop\Documents\code\idling.app__UI
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

Answer `y` when prompted. Done.

---

## What This Does

The setup script will:
1. Check if you have Node.js, npm, pnpm, Docker, and Git
2. Install anything that's missing using winget
3. Tell you exactly what to do next

---

## Step-by-Step Installation

### Step 1: Run the Setup Script

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

### Step 2: Answer 'y' When Prompted

The script will show you what's missing and ask if you want to install it.

### Step 3: Restart Your Terminal

After installation completes, close and reopen PowerShell so the new tools are available.

### Step 4: If Docker Was Installed, Restart Your Computer

Docker requires a restart to work properly. After restarting:
- Launch "Docker Desktop" from the Start menu
- Wait for it to show a green icon in the system tray

### Step 5: Install Project Dependencies

```powershell
pnpm install
```

### Step 6: Start the Docker Containers

```powershell
pnpm dev:docker:win
```

This will show you a menu where you can:
1. Start containers
2. Stop containers
3. Stop and remove all containers
4. Show current containers
5. Cancel

---

## Available Commands

Once setup is complete, you can use these commands:

```powershell
# Run the Windows setup script
pnpm setup:windows

# Manage Docker containers (interactive menu)
pnpm dev:docker:win

# Start containers directly
pnpm dev:docker:up

# Stop containers
pnpm dev:docker:down

# Install project dependencies
pnpm install

# Run development server (without Docker)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

---

## Troubleshooting

### "winget: The term 'winget' is not recognized"

You need to install "App Installer" from the Microsoft Store:
https://www.microsoft.com/p/app-installer/9nblggh4nns1

After installing, restart PowerShell and run the setup script again.

### "Docker daemon is not running"

1. Click the Start menu
2. Search for "Docker Desktop"
3. Launch it
4. Wait for the icon in the system tray to turn green
5. Try your command again

### "pnpm: The term 'pnpm' is not recognized" (After Installing)

Close and reopen PowerShell. If it still doesn't work:
1. Search for "Environment Variables" in Windows
2. Edit "Path" in User variables
3. Add: `C:\Users\{YourUsername}\AppData\Local\pnpm`
4. Click OK and restart PowerShell

### PowerShell Execution Policy Error

If you get an execution policy error:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try running the setup script again.

### WSL2 Not Installed (Docker Requirement)

Docker requires WSL2. Install it with:

```powershell
wsl --install
```

Then restart your computer.

---

## What Gets Installed

- **Node.js v20.x** - JavaScript runtime (includes npm)
- **pnpm** - Fast, disk space efficient package manager
- **Docker Desktop** - Container platform for running the app
- **Git** - Version control (if not already installed)

---

## Next Steps After Setup

Once everything is installed and Docker is running:

1. **Install dependencies**: `pnpm install`
2. **Start Docker containers**: `pnpm dev:docker:win`
3. **Choose option 1** to start containers
4. **Wait for containers to start** (first time takes a few minutes)
5. **Open your browser**: http://localhost:3000

That's it! You're running the app.

---

## Optional: Better Terminal Experience

If you want a better terminal (like zsh), you have options:

### Option 1: Oh My Posh (Recommended for Windows)

```powershell
winget install JanDeDobbeleer.OhMyPosh
winget install Microsoft.WindowsTerminal
oh-my-posh font install
```

### Option 2: WSL2 + Real Zsh

```powershell
wsl --install -d Ubuntu
```

Then inside Ubuntu:
```bash
sudo apt update && sudo apt install zsh git
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

---

## Need Help?

Run the setup script again to see what's installed and what's missing:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

The script will tell you exactly what you have and what you don't.
