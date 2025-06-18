# 🕒 Cron Job Setup Guide

This guide helps you set up automated materialized view refreshes using system cron jobs.

## 📋 Prerequisites

1. ✅ Migration `0015-fix-performance-indexes.sql` has been applied
2. ✅ Database is running and accessible
3. ✅ Environment variables are configured

## 🛠️ Step 1: Test the Script

First, make sure the refresh script works:

```bash
# Test with your app running (to use existing DB connection)
npm run dev &
sleep 5
npx tsx scripts/refresh-materialized-views.ts
```

If you get authentication errors, make sure your `.env.local` has the correct database credentials.

## 🔧 Step 2: Environment Setup for Cron

Cron jobs don't inherit your shell environment, so we need to set up environment variables.

### Option A: Create a wrapper script (Recommended)

```bash
# Create wrapper script
cat > scripts/cron-refresh-wrapper.sh << 'EOF'
#!/bin/bash

# Load environment variables
source /path/to/your/app/.env.local

# Change to app directory
cd /path/to/your/app

# Run the refresh script
npx tsx scripts/refresh-materialized-views.ts "$@" >> /var/log/materialized-views.log 2>&1
EOF

# Make it executable
chmod +x scripts/cron-refresh-wrapper.sh
```

### Option B: Use environment variables directly in cron

```bash
# Get your DATABASE_URL
echo "DATABASE_URL from your .env.local:"
grep DATABASE_URL .env.local
```

## 📅 Step 3: Set Up Cron Jobs

Edit your crontab:

```bash
crontab -e
```

Add these lines (replace `/path/to/your/app` with your actual path):

```cron
# Environment variables (Option B)
DATABASE_URL=your_database_url_here
PATH=/usr/local/bin:/usr/bin:/bin

# Refresh all materialized views nightly at 2 AM
0 2 * * * cd /path/to/your/app && npx tsx scripts/refresh-materialized-views.ts >> /var/log/materialized-views.log 2>&1

# Refresh trending posts every 6 hours (6 AM, 12 PM, 6 PM, 12 AM)  
0 */6 * * * cd /path/to/your/app && npx tsx scripts/refresh-materialized-views.ts trending_posts >> /var/log/materialized-views.log 2>&1

# Or if using wrapper script (Option A):
# 0 2 * * * /path/to/your/app/scripts/cron-refresh-wrapper.sh
# 0 */6 * * * /path/to/your/app/scripts/cron-refresh-wrapper.sh trending_posts
```

### Alternative: More Conservative Schedule

If you prefer less frequent updates:

```cron
# Nightly refresh at 2 AM (all views)
0 2 * * * cd /path/to/your/app && npx tsx scripts/refresh-materialized-views.ts >> /var/log/materialized-views.log 2>&1

# Weekly trending posts refresh (Sundays at 3 AM)
0 3 * * 0 cd /path/to/your/app && npx tsx scripts/refresh-materialized-views.ts trending_posts >> /var/log/materialized-views.log 2>&1
```

## 📊 Step 4: Create Log Directory

```bash
# Create log directory
sudo mkdir -p /var/log
sudo touch /var/log/materialized-views.log
sudo chmod 666 /var/log/materialized-views.log

# Or use a local log file
mkdir -p logs
touch logs/materialized-views.log
```

If using local logs, update your cron jobs:
```cron
0 2 * * * cd /path/to/your/app && npx tsx scripts/refresh-materialized-views.ts >> logs/materialized-views.log 2>&1
```

## 🔍 Step 5: Test Your Cron Setup

### Test the cron command manually:
```bash
# Test the exact command that cron will run
cd /path/to/your/app && npx tsx scripts/refresh-materialized-views.ts user_stats
```

### Check if cron is running:
```bash
# Check cron service status
sudo systemctl status cron

# View your crontab
crontab -l
```

## 📈 Step 6: Monitor and Verify

### View logs:
```bash
# Watch logs in real-time
tail -f /var/log/materialized-views.log

# Or if using local logs
tail -f logs/materialized-views.log
```

### Check materialized views:
```bash
# Connect to your database and check views
psql $DATABASE_URL -c "
SELECT 
    matviewname, 
    ispopulated,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
FROM pg_matviews;
"
```

### Monitor via API:
```bash
# Check refresh status via your app's API
curl http://localhost:3000/api/admin/refresh-views
```

## 🚨 Troubleshooting

### Cron job not running?
```bash
# Check cron logs
sudo tail -f /var/log/cron
# or
sudo journalctl -u cron -f
```

### Environment issues?
```bash
# Test environment in cron context
# Add this temporary cron job:
# * * * * * env > /tmp/cron-env.txt

# Then compare with your shell:
env > /tmp/shell-env.txt
diff /tmp/shell-env.txt /tmp/cron-env.txt
```

### Database connection issues?
```bash
# Test database connection
npx tsx -e "import sql from './src/lib/db'; sql\`SELECT 1\`.then(() => console.log('✅ DB OK')).catch(console.error)"
```

## 📋 Cron Schedule Examples

```cron
# Every minute (for testing only!)
* * * * * command

# Every hour at minute 0
0 * * * * command

# Every day at 2:30 AM
30 2 * * * command

# Every Sunday at 2 AM
0 2 * * 0 command

# Every 6 hours
0 */6 * * * command

# First day of every month at 2 AM
0 2 1 * * command
```

## ✅ Final Checklist

- [ ] Migration 0015 applied
- [ ] Script tested successfully
- [ ] Environment variables configured
- [ ] Cron jobs added to crontab
- [ ] Log files created and accessible
- [ ] Tested cron command manually
- [ ] Monitored first automated run

## 🔄 Performance Tips

1. **Monitor refresh times**: Check logs to ensure refreshes complete within reasonable time
2. **Adjust frequency**: If refreshes take too long, consider less frequent updates
3. **Split workload**: Consider refreshing different views at different times
4. **Database maintenance**: Schedule `VACUUM ANALYZE` after refresh jobs

```cron
# Example: vacuum after nightly refresh
15 2 * * * psql $DATABASE_URL -c "VACUUM ANALYZE submissions, user_submission_stats, tag_statistics;"
```

Your materialized views will now refresh automatically! 🚀 