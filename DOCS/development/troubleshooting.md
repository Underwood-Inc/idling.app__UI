---
layout: default
title: Troubleshooting Guide
description: Solutions to common problems and issues when developing or running idling.app
---

# 🔧 Troubleshooting Guide

This guide helps you solve common problems you might encounter when working with idling.app. We've organized solutions by category and provided step-by-step instructions that anyone can follow.

## 🎯 How to Use This Guide

**Before you start:**
1. **Read the error message carefully** - it often tells you exactly what's wrong
2. **Check the simple things first** - is your internet working? Is the app running?
3. **Follow the steps in order** - don't skip ahead
4. **Try one solution at a time** - don't change multiple things at once

**What you'll need:**
- Access to your terminal/command line
- Basic knowledge of your operating system
- Patience (some fixes take a few minutes)

## 🚨 App Won't Start

### Problem: "Missing required environment variables"

**What this means:** Your app is missing important settings it needs to run.

**How to fix:**

1. **Check if you have a .env.local file:**
```bash
# Look for the file in your project root
ls -la .env.local
```

2. **If the file doesn't exist, create it:**
```bash
# Create the file
touch .env.local
```

3. **Add the required variables:**
```bash
# Edit the file
nano .env.local
# Add these lines:
DATABASE_URL="postgresql://localhost:5432/idling_app_dev"
NEXTAUTH_SECRET="your-development-secret-key"
NODE_ENV="development"
```

4. **Restart your app:**
```bash
# Stop the app (Ctrl+C) and start again
yarn dev
```

### Problem: "Port 3000 already in use"

**What this means:** Another app is already using port 3000.

**How to fix:**

**Option 1: Stop the other app**
```bash
# Find what's using port 3000
lsof -ti:3000

# Stop it (replace XXXX with the process ID from above)
kill -9 XXXX
```

**Option 2: Use a different port**
```bash
# Start on port 3001 instead
yarn dev --port 3001
```

**Option 3: Set a different default port**
```bash
# Add to your .env.local file
PORT=3001
```

### Problem: "Cannot connect to database"

**What this means:** Your app can't reach the database.

**How to fix:**

1. **Check if PostgreSQL is running:**
```bash
# On Linux/Mac
sudo systemctl status postgresql

# On Mac with Homebrew
brew services list | grep postgresql

# On Windows
# Check Windows Services for PostgreSQL
```

2. **Start PostgreSQL if it's not running:**
```bash
# On Linux
sudo systemctl start postgresql

# On Mac with Homebrew
brew services start postgresql
```

3. **Check your database URL:**
```bash
# Make sure your .env.local has the right database URL
echo $DATABASE_URL
```

4. **Test the connection:**
```bash
# Try connecting manually
psql postgresql://localhost:5432/idling_app_dev
```

5. **Create the database if it doesn't exist:**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create the database
CREATE DATABASE idling_app_dev;

# Exit
\q
```

## 🔐 Authentication Problems

### Problem: "NextAuth configuration error"

**What this means:** The authentication system isn't set up correctly.

**How to fix:**

1. **Check your environment variables:**
```bash
# Make sure these are in your .env.local
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

2. **Generate a proper secret:**
```bash
# Generate a secure secret
openssl rand -base64 32
# Copy the output and use it as your NEXTAUTH_SECRET
```

3. **Make sure the URL matches:**
```bash
# For development
NEXTAUTH_URL="http://localhost:3000"

# For production
NEXTAUTH_URL="https://yourdomain.com"
```

### Problem: "Session keeps expiring"

**What this means:** Your login session doesn't stay active.

**How to fix:**

1. **Check if you changed the secret:**
```bash
# If you changed NEXTAUTH_SECRET, all sessions become invalid
# Users need to log in again - this is normal
```

2. **Clear your browser data:**
```bash
# In your browser:
# 1. Open Developer Tools (F12)
# 2. Go to Application tab
# 3. Clear cookies for your domain
# 4. Clear localStorage
```

3. **Restart your app:**
```bash
# Stop and restart the development server
yarn dev
```

## 📁 File Upload Issues

### Problem: "File too large"

**What this means:** The file you're trying to upload is bigger than allowed.

**How to fix:**

1. **Check the file size:**
```bash
# Check file size in bytes
ls -la yourfile.jpg
```

2. **Increase the upload limit:**
```bash
# Add to your .env.local
UPLOAD_MAX_SIZE=10485760  # 10MB
```

3. **Compress the image:**
```bash
# Use online tools or command line
# For example, using ImageMagick:
convert large-image.jpg -quality 80 -resize 1920x1080 smaller-image.jpg
```

### Problem: "Upload failed"

**What this means:** The file upload didn't work for some reason.

**How to fix:**

1. **Check upload permissions:**
```bash
# Make sure the uploads directory exists and is writable
mkdir -p uploads
chmod 755 uploads
```

2. **Check available disk space:**
```bash
# Make sure you have enough space
df -h
```

3. **Try a different file:**
```bash
# Test with a small text file first
echo "test" > test.txt
# Try uploading this file
```

## 🎨 UI/Display Problems

### Problem: "Styles not loading" or "App looks broken"

**What this means:** The CSS/styling isn't loading properly.

**How to fix:**

1. **Clear your browser cache:**
```bash
# Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
# Or clear browser cache in settings
```

2. **Check if CSS files are being served:**
```bash
# Open browser developer tools (F12)
# Go to Network tab
# Refresh page
# Look for any failed CSS requests (they'll be red)
```

3. **Restart the development server:**
```bash
# Stop the app (Ctrl+C)
yarn dev
```

4. **Clear Next.js cache:**
```bash
# Delete the cache folder
rm -rf .next
yarn dev
```

### Problem: "Images not displaying"

**What this means:** Images aren't loading on your website.

**How to fix:**

1. **Check the image path:**
```bash
# Make sure images are in the correct folder
ls -la public/images/
```

2. **Check image permissions:**
```bash
# Make sure images are readable
chmod 644 public/images/*
```

3. **Verify the image URL:**
```bash
# In browser, try accessing the image directly
# http://localhost:3000/images/yourimage.jpg
```

## 📊 Database Issues

### Problem: "Database migration failed"

**What this means:** The database schema updates didn't apply correctly.

**How to fix:**

1. **Check the migration files:**
```bash
# Look at the migration files
ls -la migrations/
```

2. **Run migrations manually:**
```bash
# Apply all pending migrations
yarn migrate
```

3. **Check database connection:**
```bash
# Make sure you can connect to the database
psql $DATABASE_URL
```

4. **Reset the database (if safe to do so):**
```bash
# WARNING: This deletes all data
# Only do this in development
dropdb idling_app_dev
createdb idling_app_dev
yarn migrate
```

### Problem: "Database queries are slow"

**What this means:** Your database operations are taking too long.

**How to fix:**

1. **Check database indexes:**
```sql
-- Connect to your database
psql $DATABASE_URL

-- Check if indexes exist
\d+ submissions
\d+ users
```

2. **Analyze slow queries:**
```sql
-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

3. **Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql
```

## 🌐 Browser-Specific Issues

### Problem: "App works in Chrome but not Firefox/Safari"

**What this means:** Different browsers handle some features differently.

**How to fix:**

1. **Check browser console:**
```bash
# In any browser:
# 1. Press F12
# 2. Go to Console tab
# 3. Look for error messages
```

2. **Update your browser:**
```bash
# Make sure you're using a recent version
# Check Help > About in your browser
```

3. **Clear browser data:**
```bash
# Clear cookies, cache, and local storage
# Try in private/incognito mode
```

### Problem: "App is slow on mobile"

**What this means:** The app isn't optimized for mobile devices.

**How to fix:**

1. **Test on mobile:**
```bash
# Open browser developer tools (F12)
# Click device icon to simulate mobile
# Test different screen sizes
```

2. **Check image sizes:**
```bash
# Large images slow down mobile
# Compress images before uploading
```

3. **Enable service worker:**
```bash
# Make sure PWA features are working
# Check in browser dev tools > Application > Service Workers
```

## 🔄 Development Workflow Issues

### Problem: "Changes not showing up"

**What this means:** Your code changes aren't appearing in the browser.

**How to fix:**

1. **Check if hot reload is working:**
```bash
# Look for "compiled successfully" messages
# After making changes to your code
```

2. **Hard refresh the browser:**
```bash
# Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

3. **Restart the development server:**
```bash
# Stop (Ctrl+C) and restart
yarn dev
```

4. **Clear Next.js cache:**
```bash
rm -rf .next
yarn dev
```

### Problem: "Yarn/NPM commands not working"

**What this means:** Package manager commands are failing.

**How to fix:**

1. **Check Node.js version:**
```bash
# Make sure you have Node.js 18 or higher
node --version
npm --version
yarn --version
```

2. **Clear package cache:**
```bash
# Clear npm cache
npm cache clean --force

# Clear yarn cache
yarn cache clean
```

3. **Delete node_modules and reinstall:**
```bash
# Remove packages
rm -rf node_modules
rm package-lock.json  # or yarn.lock

# Reinstall
npm install  # or yarn install
```

## 🔍 Debugging Tips

### General Debugging Process

1. **Read the error message:**
   - Error messages usually tell you exactly what's wrong
   - Look for file names and line numbers

2. **Check the browser console:**
   - Press F12 → Console tab
   - Look for red error messages

3. **Check the terminal:**
   - Look for error messages where you started the app
   - Check for warnings too

4. **Use process of elimination:**
   - Try the simplest solution first
   - Change one thing at a time
   - If something worked before, what changed?

### Getting More Information

**Enable debug mode:**
```bash
# Add to your .env.local
DEBUG=true
LOG_LEVEL=debug
```

**Check application logs:**
```bash
# Development logs
yarn logs

# Production logs (if using PM2)
pm2 logs idling-app
```

**Test individual components:**
```bash
# Test database connection
yarn test:db

# Test authentication
yarn test:auth

# Run all tests
yarn test
```

## 📞 When to Ask for Help

### Before Asking for Help

✅ **Do this first:**
- Follow the troubleshooting steps above
- Check the error message carefully
- Try the simple solutions first
- Look at browser console and terminal output

### How to Ask for Help

**Include this information:**
1. **What you were trying to do**
2. **What you expected to happen**
3. **What actually happened**
4. **Complete error messages**
5. **Your operating system and browser**
6. **Steps you already tried**

**Example good help request:**
```
I'm trying to start the development server but getting an error.

Expected: App should start on localhost:3000
Actual: Getting "Cannot connect to database" error

Error message: "error: connection to server at 'localhost' (127.0.0.1), port 5432 failed: Connection refused"

Environment: 
- Windows 10
- Node.js 18.17.0
- PostgreSQL 15

Steps I tried:
1. Checked .env.local file exists
2. Verified DATABASE_URL is correct
3. Restarted the app

Full error log: [paste complete error here]
```

### Emergency Issues

**Get help immediately if:**
- Your production app is down
- Users can't log in
- Database corruption
- Security breach suspected

**Get help soon if:**
- Development environment broken
- Tests failing
- Performance issues
- Feature not working

## 🎯 Prevention Tips

### Avoid Common Problems

1. **Always use version control:**
```bash
# Commit working code before making changes
git add .
git commit -m "Working state before changes"
```

2. **Keep backups:**
```bash
# Backup your database regularly
pg_dump $DATABASE_URL > backup.sql
```

3. **Test in multiple browsers:**
```bash
# Don't just test in one browser
# Check Chrome, Firefox, Safari, Edge
```

4. **Keep dependencies updated:**
```bash
# Check for outdated packages
yarn outdated

# Update packages regularly
yarn upgrade
```

5. **Monitor your app:**
```bash
# Check logs regularly
# Set up monitoring and alerts
# Test your app frequently
```

---

## 🔗 Related Documentation

- **[Environment Variables](./environment-variables)** - Configuration issues
- **[Production Deployment](../deployment/production)** - Deployment problems
- **[Monitoring Guide](../deployment/monitoring)** - Tracking issues
- **[Performance Optimization](./optimization)** - Speed issues

---

## 📋 Quick Reference

### Most Common Fixes

| Problem | Quick Fix |
|---------|-----------|
| App won't start | Check .env.local file |
| Port in use | Use different port or kill process |
| Database error | Check if PostgreSQL is running |
| Auth issues | Verify NEXTAUTH_SECRET is set |
| Styles broken | Clear browser cache |
| Changes not showing | Restart dev server |

### Useful Commands

```bash
# Check what's running on port 3000
lsof -ti:3000

# Generate secret key
openssl rand -base64 32

# Clear Next.js cache
rm -rf .next

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check database connection
psql $DATABASE_URL
```

---

*Remember: Most problems have simple solutions. Don't panic, read the error messages, and try the basic fixes first. You've got this! 🚀* 