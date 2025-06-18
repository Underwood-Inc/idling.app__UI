#!/bin/bash

# Auto-generated production script for materialized view refresh
# Generated on: Wed Jun 18 15:13:59 NDT 2025

# Load environment variables
if [ -f "/home/devcontainers/code/idling.app__UI/.env.local" ]; then
    set -a
    source "/home/devcontainers/code/idling.app__UI/.env.local"
    set +a
elif [ -f "/home/devcontainers/code/idling.app__UI/.env" ]; then
    set -a
    source "/home/devcontainers/code/idling.app__UI/.env"
    set +a
else
    echo "Error: No environment file found"
    exit 1
fi

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
