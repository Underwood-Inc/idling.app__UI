#!/bin/bash

# Materialized View Refresh Cron Wrapper
# This script loads environment variables and runs the refresh script

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$APP_DIR/.env.local" ]; then
    source "$APP_DIR/.env.local"
elif [ -f "$APP_DIR/.env" ]; then
    source "$APP_DIR/.env"
else
    echo "Error: No .env.local or .env file found in $APP_DIR"
    exit 1
fi

# Change to app directory
cd "$APP_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the refresh script with all arguments passed to this script
npx tsx scripts/refresh-materialized-views.ts "$@" 