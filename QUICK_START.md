# 🚀 Quick Start Guide

## Get Up and Running in 5 Minutes

### Step 1: Setup (First Time Only)

```powershell
# Check and install dependencies
pnpm setup:windows

# Install project dependencies
pnpm install
```

### Step 2: Configure Environment

Create `.env.local` in the project root:

```env
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=idling_app
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
AUTH_SECRET=run_pnpm_gen:secret_to_generate
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Generate auth secret:
```powershell
pnpm gen:secret
```

### Step 3: Start Docker

```powershell
pnpm dev:docker:win
# Choose option 1
```

**Note:** On Windows, only postgres and nextjs containers start (docs excluded due to canvas compilation issues).

### Step 4: Access the App

- **Main App:** http://localhost:3000

**Optional - Run Docs Separately:**
```powershell
pnpm docs:dev
```
Then access at http://localhost:3001

---

## 🎯 What's New

### Marketing System
- ✅ Clean marketing pages (no interactive demos)
- ✅ Reusable `ProductMarketingTemplate` component
- ✅ Strixun Suite navigation with 6 external apps
- ✅ Consistent branding across all pages

### Navigation
New "Strixun Suite" dropdown with:
- Suite Overview (internal)
- Stream Suite (external)
- Mods Hub (external)
- Auth Service (external)
- URL Shortener (external)
- Chat Hub (external)
- Access Hub (external)

### Pages
- `/suite` - Suite overview page
- `/obs-animation-suite` - Clean marketing (no demo)

---

## 📚 Documentation

- **Windows Setup:** [WINDOWS_DOCKER_SETUP.md](./WINDOWS_DOCKER_SETUP.md)
- **Marketing System:** [MARKETING_SYSTEM_SUMMARY.md](./MARKETING_SYSTEM_SUMMARY.md)
- **Main README:** [README.md](./README.md)

---

## 🆘 Common Issues

### Docker not starting?
```powershell
# Check Docker Desktop is running
# Look for green whale icon in system tray
```

### Port conflicts?
```powershell
# Check what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Database issues?
```powershell
# Stop local PostgreSQL if running
Stop-Service -Name postgresql-x64-XX

# Check container logs
docker logs idlingapp__ui-postgres
```

---

## 🎨 Creating Marketing Pages

Use the template:

```tsx
import { ProductMarketingTemplate } from '../components/marketing/ProductMarketingTemplate';

<ProductMarketingTemplate
  title="Product Name"
  tagline="Catchy tagline"
  description="Detailed description"
  heroIcon="🚀"
  features={[
    {
      icon: '✨',
      title: 'Feature Name',
      description: 'Feature description',
      highlights: ['Point 1', 'Point 2']
    }
  ]}
  links={[
    {
      label: 'Visit Site',
      url: 'https://example.com',
      variant: 'primary',
      icon: '🔗'
    }
  ]}
  techStack={['React', 'TypeScript']}
  stats={[
    { label: 'Users', value: '10K+', icon: '👥' }
  ]}
/>
```

---

## 🔗 Quick Links

- **GitHub:** https://github.com/Underwood-Inc/idling.app__UI
- **Discord:** https://discord.gg/mpThbx67J7
- **Suite Apps:** http://localhost:3000/suite

---

**Happy Coding!** 🎉
