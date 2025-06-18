#!/bin/bash

# Production script to refresh materialized views
# Usage: ./scripts/refresh-views-prod.sh

echo "[$(date)] Starting materialized view refresh..."

# Refresh materialized view using direct SQL
psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW user_submission_stats;" 2>&1

if [ $? -eq 0 ]; then
    echo "[$(date)] ✅ Materialized view refresh completed successfully"
else
    echo "[$(date)] ❌ Materialized view refresh failed"
    exit 1
fi 