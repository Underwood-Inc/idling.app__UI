---
layout: default
title: PowerShell-Style Syntax Highlighting Demo
description: Demonstration of enhanced shell syntax highlighting with PowerShell and Powerlevel10k styling
---

## PowerShell-Style Syntax Highlighting

Our documentation now features enhanced syntax highlighting for shell commands that mimics the beautiful styling of PowerShell and Powerlevel10k.

### Enhanced Shell Commands

```bash
# Git workflow with enhanced highlighting
git status
git add .
git commit -m "feat: add new feature"
git push origin main

# Docker commands with special styling
docker build -t myapp:latest .
docker run -p 3000:3000 myapp:latest
docker ps -a

# Node.js/npm commands
npm install
npm run dev
yarn build
node --version
```

### PowerShell Commands

```powershell
# PowerShell-specific syntax
PS C:\> Get-Process | Where-Object {$_.CPU -gt 100}
PS C:\> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned
PS C:\> Import-Module MyModule
```

### Terminal Output Examples

```bash
# Success output
$ npm install
✓ Installation completed successfully
✓ All dependencies installed

# Warning output  
$ yarn build
⚠ Warning: Deprecated package detected
⚠ Consider updating dependencies

# Error output
$ git push
✗ ERROR: Permission denied
✗ Failed to push to remote repository

# Info output
$ docker build .
ℹ INFO: Building image...
ℹ INFO: Step 1/5 complete
```

### System Administration

```bash
# System commands with enhanced styling
ls -la /var/log/
cd /etc/nginx/
mkdir -p /var/www/html
cp config.conf config.conf.backup
rm -rf temp/
mv old-file.txt new-file.txt

# Process management
ps aux | grep nginx
kill -9 1234
systemctl status nginx
sudo systemctl restart apache2
```

### Advanced Shell Features

```zsh
# Zsh with Powerlevel10k-style prompts
user@hostname:~/project$ git status
user@hostname:~/project$ npm run test
user@hostname:~/project$ docker-compose up -d
```

### Manual PowerShell-Style Styling

You can also use utility classes for custom styling:

<div class="ps-prompt">~/project</div>
<div class="ps-command">npm run dev</div>
<div class="ps-output-success">✓ Development server started successfully</div>
<div class="ps-output-error">✗ Build failed: syntax error</div>
<div class="ps-output-warning">⚠ Deprecated API usage detected</div>

### Features

- **Enhanced Colors**: PowerShell-inspired color scheme with blues, yellows, and accent colors
- **Command Recognition**: Special styling for git, docker, npm, yarn, and system commands  
- **Output Styling**: Success, warning, error, and info messages are visually distinct
- **Terminal Aesthetics**: Darker backgrounds with blue accent borders like PowerShell
- **Prompt Styling**: Beautiful prompts with gradients and text shadows
- **Utility Classes**: Manual styling options for custom terminal output

The syntax highlighting automatically detects shell languages (`bash`, `shell`, `zsh`, `powershell`) and applies the enhanced styling for a more professional and visually appealing documentation experience. 