---
layout: default
title: Production Deployment Guide
description: Complete guide to deploying the idling.app to production servers
---

# 🚀 Production Deployment Guide

This guide walks you through deploying the idling.app to a production server. We'll explain everything step-by-step so anyone can follow along.

## 📋 What You'll Need Before Starting

### Required Tools

- **A server** (like DigitalOcean, AWS, or any VPS)
- **SSH access** to your server (like a key to log into your server remotely)
- **A domain name** (like yoursite.com)
- **Basic command line knowledge** (don't worry, we'll explain each command)

### Required Information

- Your server's IP address
- Your server's username and password (or SSH key)
- Your domain name
- Database connection details

## 🏗️ Step 1: Prepare Your Server

### Install Required Software

Connect to your server and run these commands one by one:

```bash
# Update your server's software list
sudo apt update

# Install Node.js (the runtime for our app)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (keeps our app running)
sudo npm install -g pm2

# Install PostgreSQL (our database)
sudo apt install postgresql postgresql-contrib

# Install Nginx (web server that handles requests)
sudo apt install nginx
```

**What each tool does:**

- **Node.js**: Runs our JavaScript application
- **PM2**: Keeps the app running even if it crashes
- **PostgreSQL**: Stores all our data (posts, users, etc.)
- **Nginx**: Handles web traffic and serves our app to users

## 🗄️ Step 2: Set Up the Database

### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside PostgreSQL, run these commands:
CREATE DATABASE mydatabase;
CREATE USER myuser WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
\q
```

**What this does:**

- Creates a new database called `mydatabase`
- Creates a user called `myuser` with a password
- Gives the user permission to use the database

### Configure Database Access

Edit the PostgreSQL configuration:

```bash
# Edit the main config file
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find this line and change it:
#listen_addresses = 'localhost'
# Change to:
listen_addresses = '*'

# Edit the access control file
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line at the end:
host    all             all             0.0.0.0/0               md5
```

Then restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## 📁 Step 3: Deploy Your Application

### Get the Code

```bash
# Go to your home directory
cd ~

# Create a folder for your projects
mkdir repos
cd repos

# Download the latest code
git clone https://github.com/your-username/idling.app__UI.git
cd idling.app__UI
```

### Install Dependencies

```bash
# Install all the packages our app needs
yarn install

# This might take a few minutes - it's downloading lots of code libraries
```

### Set Up Environment Variables

Create a file with your app's settings:

```bash
# Create the environment file
nano .env.local
```

Add these settings (replace with your actual values):

```bash
# Database connection
DATABASE_URL="postgresql://myuser:your-secure-password@localhost:5432/mydatabase"

# App secrets (generate random strings for these)
NEXTAUTH_SECRET="your-super-secret-random-string-here"
NEXTAUTH_URL="https://yourdomain.com"

# App settings
NODE_ENV="production"
```

**How to generate secure secrets:**

```bash
# Run this command to generate a random secret
openssl rand -base64 32
```

### Build the Application

```bash
# Build the app for production (this creates optimized files)
yarn build

# This creates a .next folder with all the files ready for production
```

### Set Up Database Tables

```bash
# Run the database migrations (creates all the tables we need)
yarn migrations
```

## 🌐 Step 4: Configure the Web Server (Nginx)

### Create Nginx Configuration

```bash
# Create a new site configuration
sudo nano /etc/nginx/sites-available/idling-app
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**What this does:**

- Listens for web requests on port 80
- Forwards all requests to our app running on port 3000
- Handles all the technical details of web traffic

### Enable the Site

```bash
# Enable the new site
sudo ln -s /etc/nginx/sites-available/idling-app /etc/nginx/sites-enabled/

# Test the configuration
sudo nginx -t

# If the test passes, restart Nginx
sudo systemctl restart nginx
```

## 🚀 Step 5: Start Your Application

### Start with PM2

```bash
# Go to your app directory
cd ~/repos/idling.app__UI

# Start the app with PM2
pm2 start yarn --name "idling-app" -- start

# Make PM2 start automatically when server restarts
pm2 startup
pm2 save
```

**What PM2 does:**

- Keeps your app running 24/7
- Restarts it if it crashes
- Starts it automatically when the server reboots

### Check if Everything is Working

```bash
# Check if your app is running
pm2 status

# Check the logs if there are any issues
pm2 logs idling-app
```

## 🔒 Step 6: Set Up SSL (HTTPS)

### Install Certbot

```bash
# Install SSL certificate tool
sudo apt install certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
# Get a free SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts:**

1. Enter your email address
2. Agree to terms of service
3. Choose whether to share your email (optional)

Certbot will automatically update your Nginx configuration to use HTTPS.

## 🔄 Step 7: Set Up Automatic Updates

### Create Update Script

```bash
# Create a script to update your app
nano ~/update-app.sh
```

Add this content:

```bash
#!/bin/bash
cd ~/repos/idling.app__UI
git pull origin master
yarn install
yarn build
pm2 restart idling-app
```

Make it executable:

```bash
chmod +x ~/update-app.sh
```

### Test Your Deployment

1. **Visit your domain** in a web browser
2. **Create an account** to test user registration
3. **Create a post** to test the main functionality
4. **Check the logs** for any errors: `pm2 logs idling-app`

## 🛡️ Security Best Practices

### Firewall Setup

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (so you can still connect)
sudo ufw allow ssh

# Allow web traffic
sudo ufw allow 'Nginx Full'

# Check status
sudo ufw status
```

### Regular Updates

```bash
# Update server software weekly
sudo apt update && sudo apt upgrade

# Update SSL certificates (happens automatically, but you can force it)
sudo certbot renew
```

## 🚨 Troubleshooting Common Issues

### App Won't Start

**Check the logs:**

```bash
pm2 logs idling-app
```

**Common fixes:**

- Make sure the database is running: `sudo systemctl status postgresql`
- Check environment variables are correct: `cat .env.local`
- Verify the build was successful: `ls -la .next/`

### Can't Connect to Database

**Check database status:**

```bash
sudo systemctl status postgresql
```

**Test database connection:**

```bash
psql -h localhost -d mydatabase -U myuser
```

### Website Shows Error

**Check Nginx status:**

```bash
sudo systemctl status nginx
```

**Check Nginx configuration:**

```bash
sudo nginx -t
```

## 📊 Monitoring Your App

### Check App Status

```bash
# See if your app is running
pm2 status

# View resource usage
pm2 monit

# Check recent logs
pm2 logs idling-app --lines 50
```

### Database Health

```bash
# Connect to database
sudo -u postgres psql mydatabase

# Check number of posts
SELECT COUNT(*) FROM submissions;

# Check recent activity
SELECT * FROM submissions ORDER BY submission_datetime DESC LIMIT 5;
```

## 🔄 Updating Your App

When you have new features or fixes:

```bash
# Run your update script
~/update-app.sh
```

Or manually:

```bash
cd ~/repos/idling.app__UI
git pull origin master
yarn install
yarn build
pm2 restart idling-app
```

---

## 📞 Need Help?

If you run into problems:

1. **Check the logs first**: `pm2 logs idling-app`
2. **Verify all services are running**:
   - App: `pm2 status`
   - Database: `sudo systemctl status postgresql`
   - Web server: `sudo systemctl status nginx`
3. **Check our [troubleshooting guide](../development/troubleshooting)**
4. **Look at our [monitoring guide](./monitoring)** for ongoing maintenance

Remember: Every production deployment is unique. Don't hesitate to adapt these instructions to your specific server setup!

---

_This guide covers a standard deployment. For advanced setups (Docker, Kubernetes, etc.), see our [advanced deployment guide](./advanced-deployment)._
