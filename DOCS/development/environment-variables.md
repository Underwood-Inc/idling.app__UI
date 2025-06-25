---
layout: default
title: Environment Variables Guide
description: Complete guide to all environment variables used in idling.app for development and production
---

# 🔧 Environment Variables Guide

Environment variables are like settings for your app - they tell it how to behave in different situations. This guide explains every environment variable used in idling.app in simple terms.

## 🎯 What Are Environment Variables?

Think of environment variables like switches and dials on a control panel:
- **Some are required** (like the power switch - your app won't work without them)
- **Some are optional** (like volume controls - they have good defaults)
- **Different environments use different settings** (development vs production)

For example, in development you might use a test database, but in production you use the real one.

## 📋 Complete Environment Variables List

### 🗄️ Database Configuration

#### DATABASE_URL (Required)
**What it does:** Tells your app how to connect to the database

**Development example:**
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/idling_app_dev"
```

**Production example:**
```bash
DATABASE_URL="postgresql://prod_user:secure_password@db-server:5432/idling_app_prod"
```

**What each part means:**
- `postgresql://` - Type of database (PostgreSQL)
- `username:password` - Login credentials for the database
- `localhost` or `db-server` - Where the database is located
- `5432` - Port number (PostgreSQL's default port)
- `idling_app_dev` - Name of the database

### 🔐 Authentication & Security

#### NEXTAUTH_SECRET (Required)
**What it does:** Secret key used to encrypt user sessions and cookies

**How to generate:**
```bash
# Generate a secure random secret
openssl rand -base64 32
```

**Example:**
```bash
NEXTAUTH_SECRET="your-super-secret-random-string-here-make-it-long"
```

**Important:** 
- Must be different between development and production
- Keep this secret and never share it publicly
- If you change this, all users will need to log in again

#### NEXTAUTH_URL (Required for production)
**What it does:** The full URL where your app is hosted

**Development example:**
```bash
NEXTAUTH_URL="http://localhost:3000"
```

**Production example:**
```bash
NEXTAUTH_URL="https://yourdomain.com"
```

#### SESSION_SECRET (Optional)
**What it does:** Additional secret for session encryption (fallback if NEXTAUTH_SECRET not set)

**Example:**
```bash
SESSION_SECRET="another-secure-random-string"
```

### 🌍 Environment Settings

#### NODE_ENV (Important)
**What it does:** Tells your app whether it's running in development or production

**Possible values:**
- `development` - For local development
- `production` - For live website
- `test` - For running tests

**Example:**
```bash
NODE_ENV="production"
```

**What changes:**
- **Development**: More error details, auto-reload, less optimization
- **Production**: Optimized code, minimal errors shown to users
- **Test**: Special settings for automated testing

#### PORT (Optional)
**What it does:** Which port your app runs on

**Default:** 3000

**Example:**
```bash
PORT=3000
```

**When to change:** 
- If port 3000 is already in use
- If your hosting provider requires a specific port

### 📧 Email Configuration (Optional)

#### SMTP_HOST
**What it does:** Email server for sending emails (password resets, notifications)

**Example:**
```bash
SMTP_HOST="smtp.gmail.com"
```

#### SMTP_PORT
**What it does:** Port for the email server

**Common values:**
- `587` - For secure email (recommended)
- `465` - For SSL email
- `25` - For unsecured email (not recommended)

**Example:**
```bash
SMTP_PORT=587
```

#### SMTP_USER
**What it does:** Username for email server

**Example:**
```bash
SMTP_USER="your-email@gmail.com"
```

#### SMTP_PASS
**What it does:** Password for email server

**Example:**
```bash
SMTP_PASS="your-email-password"
```

### 📁 File Upload Configuration

#### UPLOAD_MAX_SIZE (Optional)
**What it does:** Maximum file size for uploads (in bytes)

**Default:** 5MB (5242880 bytes)

**Examples:**
```bash
# 10MB limit
UPLOAD_MAX_SIZE=10485760

# 1MB limit  
UPLOAD_MAX_SIZE=1048576
```

#### UPLOAD_PATH (Optional)
**What it does:** Where uploaded files are stored

**Default:** `./uploads`

**Example:**
```bash
UPLOAD_PATH="/var/uploads"
```

### 🎮 Game Integration (Optional)

#### GAME_URL (Optional)
**What it does:** URL to the embedded game

**Example:**
```bash
GAME_URL="https://yourgame.com/embed"
```

### 🧪 Development & Testing

#### DEBUG (Optional)
**What it does:** Enable extra debug information

**Values:** `true` or `false`

**Example:**
```bash
DEBUG=true
```

#### LOG_LEVEL (Optional)
**What it does:** How much information to log

**Values:** `error`, `warn`, `info`, `debug`

**Example:**
```bash
LOG_LEVEL=info
```

#### DISABLE_CACHE (Optional)
**What it does:** Turn off caching for development

**Example:**
```bash
DISABLE_CACHE=true
```

## 📝 Environment Files

### .env.local (Development)
This file contains your local development settings:

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/idling_app_dev"

# Authentication
NEXTAUTH_SECRET="dev-secret-key-change-this"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
DEBUG=true
LOG_LEVEL=debug

# Development settings
DISABLE_CACHE=true
```

### .env.production (Production)
This file contains your production settings:

```bash
# Database (use your real production database)
DATABASE_URL="postgresql://username:password@db-server:5432/idling_app_prod"

# Authentication (use secure secrets)
NEXTAUTH_SECRET="super-secure-production-secret"
NEXTAUTH_URL="https://yourdomain.com"

# Environment
NODE_ENV="production"
LOG_LEVEL=warn

# Optional email settings
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@yourdomain.com"
SMTP_PASS="secure-email-password"

# File uploads
UPLOAD_MAX_SIZE=10485760
```

## 🔧 Setting Up Environment Variables

### For Local Development

1. **Create the file:**
```bash
# Create .env.local in your project root
touch .env.local
```

2. **Add your settings:**
```bash
# Edit the file
nano .env.local
```

3. **Copy the development template above** and adjust for your setup

4. **Restart your app** for changes to take effect:
```bash
yarn dev
```

### For Production

1. **Never commit .env files** to version control
2. **Set variables on your server:**

**Using environment variables directly:**
```bash
export DATABASE_URL="your-production-database-url"
export NEXTAUTH_SECRET="your-production-secret"
# ... other variables
```

**Using PM2 ecosystem file:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'idling-app',
    script: 'yarn',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'your-production-database-url',
      NEXTAUTH_SECRET: 'your-production-secret',
      NEXTAUTH_URL: 'https://yourdomain.com'
    }
  }]
}
```

### For Docker

**Using docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://username:password@db:5432/idling_app
      - NEXTAUTH_SECRET=your-secret-key
      - NEXTAUTH_URL=https://yourdomain.com
    ports:
      - "3000:3000"
```

## 🔒 Security Best Practices

### Protecting Secrets

**Never do this:**
```bash
# DON'T commit secrets to git
NEXTAUTH_SECRET="secret123"  # visible in git history
```

**Do this instead:**
```bash
# Generate secure secrets
openssl rand -base64 32

# Use environment-specific secrets
# Development: simple secrets for testing
# Production: complex, unique secrets
```

### Secret Management

**For Development:**
- Use `.env.local` file (not committed to git)
- Use simple but unique secrets
- Don't use production secrets locally

**For Production:**
- Use your hosting provider's secret management
- Use environment variables set on the server
- Never put production secrets in code

### Common Security Mistakes

❌ **Using the same secret everywhere:**
```bash
# Don't use the same secret for dev and production
NEXTAUTH_SECRET="same-secret-everywhere"
```

✅ **Use different secrets:**
```bash
# Development
NEXTAUTH_SECRET="dev-secret-1234"

# Production  
NEXTAUTH_SECRET="prod-secure-random-long-secret"
```

❌ **Weak secrets:**
```bash
NEXTAUTH_SECRET="password123"  # Too simple
```

✅ **Strong secrets:**
```bash
NEXTAUTH_SECRET="rK8J9nX2vL4pQ7mF3dH6sA1bC9eG2tY5"  # Random and long
```

## 🚨 Troubleshooting

### App Won't Start

**Error:** "Missing required environment variables"
**Solution:** Check that you have all required variables set

**Error:** "Cannot connect to database"
**Solution:** Verify your DATABASE_URL is correct

### Authentication Issues

**Error:** "NextAuth configuration error"
**Solution:** Make sure NEXTAUTH_SECRET and NEXTAUTH_URL are set

**Error:** "Session expired immediately"
**Solution:** NEXTAUTH_SECRET might have changed

### File Upload Issues

**Error:** "File too large"
**Solution:** Increase UPLOAD_MAX_SIZE value

**Error:** "Cannot write to upload directory"
**Solution:** Check UPLOAD_PATH permissions

## 📋 Environment Checklist

### Development Setup ✅
- [ ] `.env.local` file created
- [ ] DATABASE_URL points to development database
- [ ] NEXTAUTH_SECRET is set (can be simple)
- [ ] NODE_ENV is "development"
- [ ] App starts without errors

### Production Setup ✅
- [ ] Environment variables set on server
- [ ] DATABASE_URL points to production database
- [ ] NEXTAUTH_SECRET is secure and unique
- [ ] NEXTAUTH_URL matches your domain
- [ ] NODE_ENV is "production"
- [ ] No secrets in code or git
- [ ] All optional variables configured as needed

### Security Check ✅
- [ ] Different secrets for different environments
- [ ] Secrets are long and random
- [ ] No secrets committed to version control
- [ ] Database credentials are secure
- [ ] Email credentials are secure (if used)

## 💡 Pro Tips

### Generate Secure Secrets
```bash
# Generate a 32-character random secret
openssl rand -base64 32

# Generate multiple secrets at once
for i in {1..3}; do openssl rand -base64 32; done
```

### Test Your Environment
```bash
# Check if all required variables are set
yarn build

# Test database connection
yarn test:db

# Verify authentication works
yarn test:auth
```

### Environment Variable Validation
Your app automatically checks for required environment variables on startup. If any are missing, you'll see a helpful error message.

---

## 🔗 Related Documentation

- **[Development Setup](./getting-started)** - Setting up your development environment
- **[Production Deployment](../deployment/production)** - Deploying with proper environment variables
- **[Security Best Practices](./security)** - Keeping your app secure
- **[Database Setup](../database/setup)** - Configuring your database

---

*Environment variables are the foundation of a secure, flexible application. Take time to set them up properly - it will save you lots of trouble later!* 