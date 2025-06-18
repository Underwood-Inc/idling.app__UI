#!/bin/bash

# Auto-generated production script for materialized view refresh
# Generated on: Wed Jun 18 15:13:59 NDT 2025

# Load environment variables (handle spaces around =)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

ENV_FILE=""
if [ -f "$APP_DIR/.env.local" ]; then
    ENV_FILE="$APP_DIR/.env.local"
elif [ -f "$APP_DIR/.env" ]; then
    ENV_FILE="$APP_DIR/.env"
else
    echo "Error: No environment file found"
    exit 1
fi

# Parse environment file properly (handle spaces around =)
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
done < "$ENV_FILE"

# Construct DATABASE_URL
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

# Log with timestamp
echo "[$(date)] Starting materialized view refresh..."

# Refresh materialized view
psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW user_submission_stats;" 2>&1

if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Materialized view refresh completed successfully"
else
    echo "[$(date)] ❌ Materialized view refresh failed"
    exit 1
fi
