# 🪟 Windows Docker Setup Guide

## Quick Start (TL;DR)

```powershell
# 1. Run setup script
pnpm setup:windows

# 2. Install dependencies
pnpm install

# 3. Create .env.local file (see below)

# 4. Start Docker containers
pnpm dev:docker:win
# Choose option 1 to start
```

---

## Prerequisites Check

The `setup:windows` script will automatically check and install:
- ✅ Node.js v20.x
- ✅ pnpm package manager
- ✅ Docker Desktop
- ✅ Git

---

## Step-by-Step Setup

### 1. Run Windows Setup Script

Open PowerShell in the project directory:

```powershell
pnpm setup:windows
```

This will:
- Check what's installed
- Offer to install missing tools via `winget`
- Guide you through any required restarts

### 2. Install Project Dependencies

```powershell
pnpm install
```

### 3. Create Environment File

Create a `.env.local` file in the project root with your configuration:

```env
# Database Configuration
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=idling_app
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Auth Configuration
AUTH_SECRET=your_auth_secret_here
AUTH_TRUST_HOST=true

# Application URLs
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: Generate a secure auth secret
# Run: pnpm gen:secret
```

### 4. Start Docker Containers

```powershell
pnpm dev:docker:win
```

This opens an interactive menu:
1. **Start containers** - Starts PostgreSQL, Next.js, and Docusaurus
2. **Stop containers** - Stops running containers
3. **Stop and remove all containers** - Clean shutdown
4. **Show current containers** - View status
5. **Cancel** - Exit menu

Choose option **1** to start the development environment.

---

## What Gets Started

When you start the Docker containers, two services spin up:

### 1. PostgreSQL Database
- **Container:** `idlingapp__ui-postgres`
- **Port:** 5432
- **Purpose:** Database for user data, posts, subscriptions, etc.

### 2. Next.js Application
- **Container:** `idlingapp__ui-nextjs`
- **Port:** 3000
- **URL:** http://localhost:3000
- **Purpose:** Main web application

### ⚠️ Docs Container (Not Started on Windows)
The Docusaurus docs container is excluded on Windows due to canvas compilation issues with WSL2. If you need docs:

```powershell
# Run docs separately without Docker
pnpm docs:dev
```

Access at: http://localhost:3001

---

## Common Commands

```powershell
# Start containers (interactive menu)
pnpm dev:docker:win

# Start containers directly
pnpm dev:docker:up

# Stop containers
pnpm dev:docker:down

# Seed the database with test data
docker exec -it idlingapp__ui-nextjs sh
yarn dev:seed

# View container logs
docker logs idlingapp__ui-nextjs
docker logs idlingapp__ui-postgres
docker logs idlingapp__ui-docs

# Access container shell
docker exec -it idlingapp__ui-nextjs sh

# Check container status
docker ps
```

---

## Troubleshooting

### "winget: The term 'winget' is not recognized"

Install App Installer from Microsoft Store:
https://www.microsoft.com/p/app-installer/9nblggh4nns1

Then restart PowerShell and run `pnpm setup:windows` again.

### "Docker daemon is not running"

1. Open Start menu
2. Search for "Docker Desktop"
3. Launch it
4. Wait for the whale icon in system tray to turn green
5. Try your command again

### "pnpm: The term 'pnpm' is not recognized" (After Installing)

Close and reopen PowerShell. If still not working:
1. Search for "Environment Variables" in Windows
2. Edit "Path" in User variables
3. Add: `C:\Users\{YourUsername}\AppData\Local\pnpm`
4. Click OK and restart PowerShell

### PowerShell Execution Policy Error

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

### Port Already in Use

If you get a port conflict error:

```powershell
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Issues

If you can't connect to PostgreSQL:

1. Ensure no local PostgreSQL is running:
```powershell
# Check for local PostgreSQL service
Get-Service -Name postgresql*

# Stop it if running
Stop-Service -Name postgresql-x64-XX
```

2. Verify Docker containers are running:
```powershell
docker ps
```

3. Check container logs:
```powershell
docker logs idlingapp__ui-postgres
```

### Canvas Compilation Errors

If you see errors about `canvas` or `uint8_t` during build:

**Already Fixed!** The Windows setup now:
- Removes problematic `canvas@3.1.2` package
- Only starts essential containers (postgres + nextjs)
- Excludes docs container that needs canvas

If you still see canvas errors:
```powershell
# Clean everything
docker compose down -v
docker system prune -f

# Remove node_modules
Remove-Item -Recurse -Force node_modules

# Reinstall
pnpm install

# Try again
pnpm dev:docker:win
```

### Clean Slate (Reset Everything)

If you need to start fresh:

```powershell
# Stop and remove all containers
pnpm dev:docker:win
# Choose option 3

# Remove volumes (WARNING: Deletes all data)
docker volume prune

# Restart containers
pnpm dev:docker:win
# Choose option 1
```

---

## Development Workflow

### Typical Development Session

```powershell
# 1. Start Docker containers
pnpm dev:docker:win
# Choose option 1

# 2. Wait for services to be healthy
# Check: http://localhost:3000 (Next.js)
# Check: http://localhost:3001 (Docs)

# 3. Make your changes
# Hot reload is enabled for both services

# 4. Run tests (in a new terminal)
pnpm test

# 5. When done, stop containers
pnpm dev:docker:win
# Choose option 2
```

### Database Management

```powershell
# Seed database with test data
docker exec -it idlingapp__ui-nextjs sh
yarn dev:seed
exit

# Run migrations
docker exec -it idlingapp__ui-nextjs sh
yarn migrations
exit

# Access PostgreSQL directly
docker exec -it idlingapp__ui-postgres psql -U your_db_user -d idling_app
```

---

## Performance Tips

### Docker Desktop Settings

1. Open Docker Desktop
2. Go to Settings → Resources
3. Adjust:
   - **CPUs:** 4+ recommended
   - **Memory:** 4GB+ recommended
   - **Disk:** 20GB+ recommended

### WSL2 Performance

Edit `C:\Users\{YourUsername}\.wslconfig`:

```ini
[wsl2]
memory=4GB
processors=4
swap=2GB
```

Restart WSL2:
```powershell
wsl --shutdown
```

---

## Next Steps

Once Docker is running:

1. **Access the app:** http://localhost:3000
2. **View docs:** http://localhost:3001
3. **Create an account** on the app
4. **Explore the codebase** in your editor
5. **Make changes** and see hot reload in action

---

## Need Help?

- **Project README:** [README.md](./README.md)
- **General Windows Setup:** [WINDOWS_SETUP.md](./WINDOWS_SETUP.md)
- **Docker Compose Config:** [docker-compose.yml](./docker-compose.yml)
- **Discord:** https://discord.gg/mpThbx67J7
- **GitHub Issues:** https://github.com/Underwood-Inc/idling.app__UI/issues

---

**Happy Coding!** 🚀
