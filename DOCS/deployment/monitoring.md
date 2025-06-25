---
layout: default
title: Monitoring and Alerts Guide
description: Complete guide to monitoring your idling.app deployment and setting up alerts
---

# 📊 Monitoring and Alerts Guide

This guide helps you keep track of your idling.app's health and performance. We'll show you how to monitor everything and get alerts when something needs attention.

## 🎯 What We Monitor

Think of monitoring like having a dashboard in your car - it tells you important information about how everything is running:

### Application Health
- **Is the app running?** (like checking if your engine is on)
- **How fast is it responding?** (like checking your speedometer)
- **Are there any errors?** (like warning lights on your dashboard)

### Database Performance
- **How much data do we have?** (like checking your fuel gauge)
- **How fast are database queries?** (like checking if your engine is running smoothly)
- **Are there any connection issues?** (like checking if all parts are connected)

### Server Resources
- **CPU usage** (how hard your computer is working)
- **Memory usage** (how much computer memory we're using)
- **Disk space** (how much storage space is left)

## 🔧 Setting Up Basic Monitoring

### 1. PM2 Built-in Monitoring

PM2 (the tool that keeps our app running) has built-in monitoring:

```bash
# See current status of your app
pm2 status

# Watch real-time performance
pm2 monit

# View detailed logs
pm2 logs idling-app

# Check app uptime and restarts
pm2 info idling-app
```

**What this shows you:**
- **Status**: Is your app running or stopped?
- **CPU %**: How much processing power it's using
- **Memory**: How much RAM it's using
- **Uptime**: How long it's been running without issues
- **Restarts**: How many times it had to restart (fewer is better)

### 2. Server Resource Monitoring

Check your server's health with these simple commands:

```bash
# Check overall system performance
htop

# Check disk space (make sure you don't run out!)
df -h

# Check memory usage
free -h

# Check running processes
ps aux
```

**What to look for:**
- **Disk space**: Should stay below 80% full
- **Memory**: Should not be consistently above 90%
- **CPU**: Brief spikes are normal, but constant high usage isn't

### 3. Database Health Monitoring

Keep an eye on your database:

```bash
# Connect to your database
sudo -u postgres psql mydatabase

# Check database size
SELECT pg_size_pretty(pg_database_size('mydatabase'));

# Check number of active connections
SELECT count(*) FROM pg_stat_activity;

# Check recent activity
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Exit database
\q
```

**What this tells you:**
- **Database size**: How much data you're storing
- **Connections**: How many apps are connected to your database
- **Active queries**: What the database is currently doing

## 📈 Performance Monitoring

### Application Response Times

Create a simple script to check how fast your app responds:

```bash
# Create a monitoring script
nano ~/check-app-speed.sh
```

Add this content:

```bash
#!/bin/bash
echo "Checking app response time..."
curl -o /dev/null -s -w "Response time: %{time_total} seconds\n" https://yourdomain.com
```

Make it executable and run it:

```bash
chmod +x ~/check-app-speed.sh
./check-app-speed.sh
```

**Good response times:**
- **Under 1 second**: Excellent
- **1-3 seconds**: Good
- **3-5 seconds**: Acceptable
- **Over 5 seconds**: Needs investigation

### Cache Performance

Check how well your caching is working:

```bash
# Check PM2 app statistics
pm2 show idling-app
```

Look for:
- **Low restart count**: Cache is working well
- **Stable memory usage**: No memory leaks
- **Consistent CPU usage**: No performance issues

## 🚨 Setting Up Alerts

### Simple Email Alerts

Create a script that emails you when something goes wrong:

```bash
# Install mail utility
sudo apt install mailutils

# Create alert script
nano ~/alert-script.sh
```

Add this content:

```bash
#!/bin/bash
APP_STATUS=$(pm2 status idling-app | grep -c "online")
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//g')

if [ $APP_STATUS -eq 0 ]; then
    echo "App is down!" | mail -s "ALERT: Idling App Down" your-email@example.com
fi

if [ $DISK_USAGE -gt 90 ]; then
    echo "Disk usage is at ${DISK_USAGE}%" | mail -s "ALERT: Low Disk Space" your-email@example.com
fi
```

**What this does:**
- Checks if your app is running
- Checks if disk space is getting low
- Sends you an email if there's a problem

### Set Up Automatic Checking

Make the script run automatically every 5 minutes:

```bash
# Open the task scheduler
crontab -e

# Add this line to check every 5 minutes
*/5 * * * * /home/youruser/alert-script.sh
```

**What this does:**
- Runs your alert script every 5 minutes
- You'll get an email if something is wrong
- You don't have to manually check all the time

## 📊 Log Analysis

### Understanding Your Logs

Your app creates logs (like a diary of what it's doing). Here's how to read them:

```bash
# View recent app logs
pm2 logs idling-app --lines 100

# View only error logs
pm2 logs idling-app --err

# Follow logs in real-time (press Ctrl+C to stop)
pm2 logs idling-app --lines 0
```

**Types of log messages:**
- **INFO**: Normal operation (usually green)
- **WARN**: Something unusual but not critical (usually yellow)
- **ERROR**: Something went wrong (usually red)

### Common Error Patterns

**Database connection errors:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Check if PostgreSQL is running: `sudo systemctl status postgresql`

**Out of memory errors:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```
**Solution:** Your app needs more memory or has a memory leak

**Port already in use:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Another process is using port 3000

## 📱 Advanced Monitoring (Optional)

### Using PM2 Plus (Free Monitoring Service)

PM2 Plus gives you a web dashboard to monitor your app:

```bash
# Sign up for PM2 Plus (free)
pm2 plus

# Follow the instructions to link your app
```

**Benefits:**
- Monitor from anywhere with internet
- Get email/SMS alerts
- See performance graphs
- Monitor multiple servers

### Simple Health Check Endpoint

You can add a simple health check to your app (this requires minimal code change):

Create a simple HTML file that shows your app is working:

```bash
# Create a simple health check page
echo "<html><body><h1>App is running!</h1><p>Last checked: $(date)</p></body></html>" > ~/repos/idling.app__UI/public/health.html
```

Then you can check: `https://yourdomain.com/health.html`

## 🔍 Troubleshooting Monitoring Issues

### Monitoring Script Not Working

**Check if the script is executable:**
```bash
ls -la ~/alert-script.sh
# Should show: -rwxr-xr-x (the 'x' means executable)
```

**Test the script manually:**
```bash
~/alert-script.sh
```

**Check if cron is running:**
```bash
sudo systemctl status cron
```

### Not Receiving Email Alerts

**Test email sending:**
```bash
echo "Test message" | mail -s "Test Subject" your-email@example.com
```

**Check mail logs:**
```bash
sudo tail -f /var/log/mail.log
```

### Performance Issues

**If your app is slow:**
1. Check `pm2 monit` for high CPU/memory usage
2. Check `pm2 logs` for error messages
3. Check database performance with the SQL queries above
4. Check disk space with `df -h`

**If your server is slow:**
1. Check `htop` for resource usage
2. Check `df -h` for disk space
3. Check `free -h` for memory usage

## 📋 Daily Monitoring Checklist

Create a simple daily routine:

### Morning Check (2 minutes)
1. **Check app status**: `pm2 status`
2. **Check recent logs**: `pm2 logs idling-app --lines 20`
3. **Check disk space**: `df -h`
4. **Visit your website**: Make sure it loads properly

### Weekly Check (5 minutes)
1. **Check database size**: Run the database monitoring queries
2. **Review error logs**: Look for patterns in errors
3. **Check server updates**: `sudo apt list --upgradable`
4. **Test backup systems**: Make sure your backups are working

### Monthly Check (10 minutes)
1. **Review performance trends**: Has anything gotten slower?
2. **Check SSL certificate**: Make sure it's not expiring soon
3. **Update dependencies**: `yarn outdated` to see what can be updated
4. **Review user feedback**: Any performance complaints?

## 🎯 Key Metrics to Watch

### Critical Metrics (Check Daily)
- **App uptime**: Should be close to 100%
- **Response time**: Should be under 3 seconds
- **Error rate**: Should be very low (less than 1%)
- **Disk space**: Should be under 80%

### Important Metrics (Check Weekly)
- **Database size growth**: Should be predictable
- **Memory usage trends**: Should be stable
- **Number of users**: Growth is good!
- **Popular features**: Which parts of your app are used most?

### Nice-to-Know Metrics (Check Monthly)
- **Server costs**: Are they reasonable?
- **Feature usage**: Which features are popular?
- **User retention**: Are users coming back?
- **Performance improvements**: Is the app getting faster?

---

## 📞 When to Get Help

**Get help immediately if:**
- Your app has been down for more than 10 minutes
- You're getting lots of error emails
- Users are complaining about the app not working
- Disk space is above 95%

**Get help soon if:**
- Response times are consistently above 5 seconds
- You're getting occasional error emails
- Disk space is above 85%
- Memory usage is consistently above 90%

**Consider getting help if:**
- You want to add more advanced monitoring
- You want to optimize performance
- You want to set up automated backups
- You want to add more servers

---

## 🔗 Related Documentation

- **[Production Deployment](./production)** - How to deploy your app
- **[Cache Management](./cache-management)** - How caching affects performance
- **[Database Optimization](../database/optimization)** - Making your database faster
- **[Troubleshooting Guide](../development/troubleshooting)** - Common problems and solutions

---

*Remember: Good monitoring is like having a good doctor - it helps you catch problems early before they become serious!* 