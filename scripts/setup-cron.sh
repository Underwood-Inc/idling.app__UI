#!/bin/bash

# Automatic Cron Setup Script for Materialized View Refresh
# Usage: ./scripts/setup-cron.sh

set -e  # Exit on any error

echo "🚀 Materialized view cron setup (social platform removed — no-op refresh script only)"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
cd "$APP_DIR"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found in $APP_DIR"
    echo "Please create .env.local with your database credentials first."
    exit 1
fi

echo "📋 Reading database credentials from .env.local..."

# Read and clean the .env.local file (handle spaces around =)
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ "$line" =~ ^[[:space:]]*$ ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove spaces around = and export the variable
    if [[ "$line" =~ ^[[:space:]]*([^=]+)[[:space:]]*=[[:space:]]*(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        # Remove leading/trailing spaces from value
        value="${value#"${value%%[![:space:]]*}"}"
        value="${value%"${value##*[![:space:]]}"}"
        export "$key"="$value"
    fi
done < .env.local

# Construct DATABASE_URL
if [ -z "$POSTGRES_HOST" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_PORT" ]; then
    echo "❌ Error: Missing required database environment variables in .env.local"
    echo "Required: POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT"
    exit 1
fi

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

echo "✅ Database URL constructed successfully"
echo ""

# Test database connection
echo "🔍 Testing database connection..."
if command -v psql >/dev/null 2>&1; then
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database connection successful"
    else
        echo "❌ Database connection failed. Please check your credentials."
        exit 1
    fi
else
    echo "⚠️  psql not found, skipping connection test"
fi

echo ""

# Create the production refresh script
echo "📝 Creating production refresh script..."

cat > scripts/refresh-views-production.sh << 'EOF'
#!/bin/bash
echo "[$(date)] No materialized views to refresh (social platform sunset)."
exit 0
EOF

chmod +x scripts/refresh-views-production.sh

echo "✅ Production refresh script created: scripts/refresh-views-production.sh"
echo ""

# Create log directory
echo "📁 Creating log directory..."
mkdir -p logs
touch logs/materialized-views.log

echo "✅ Log directory created: logs/materialized-views.log"
echo ""

# Set up cron job
echo "⏰ Setting up cron job..."

# Create the cron job entry
CRON_JOB="0 2 * * * cd $APP_DIR && $APP_DIR/scripts/refresh-views-production.sh >> $APP_DIR/logs/materialized-views.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -F "refresh-views-production.sh" >/dev/null; then
    echo "⚠️  Cron job already exists. Updating..."
    # Remove existing job and add new one
    (crontab -l 2>/dev/null | grep -v "refresh-views-production.sh"; echo "$CRON_JOB") | crontab -
else
    echo "➕ Adding new cron job..."
    # Add to existing crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
fi

echo "✅ Cron job installed successfully!"
echo ""

# Display setup summary
echo "📊 Setup Summary:"
echo "=================="
echo "Database: $POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
echo "User: $POSTGRES_USER"
echo "Schedule: Daily at 2:00 AM"
echo "Script: $APP_DIR/scripts/refresh-views-production.sh"
echo "Logs: $APP_DIR/logs/materialized-views.log"
echo ""

# Display current crontab
echo "📅 Current cron jobs:"
echo "===================="
crontab -l | grep -E "(refresh-views|materialized)" || echo "No materialized view cron jobs found"
echo ""

# Test the script
echo "🧪 Testing the refresh script..."
if ./scripts/refresh-views-production.sh; then
    echo "✅ Test successful!"
else
    echo "⚠️  Test failed - check your database connection and materialized views"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 What was configured:"
echo "- ✅ Production refresh script created"
echo "- ✅ Cron job scheduled for 2:00 AM daily" 
echo "- ✅ Log directory created"
echo "- ✅ Database connection tested"
echo ""
echo "📈 Monitor logs with:"
echo "tail -f logs/materialized-views.log"
echo ""
echo "🔧 To modify the schedule, run:"
echo "crontab -e"
echo "" 