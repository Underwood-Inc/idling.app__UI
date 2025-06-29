#!/bin/bash
# 🧙‍♂️ Quick connect to local development database using pgcli

set -e

echo "🔮 Connecting to the PostgreSQL realm..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please ensure you're in the project root directory."
    exit 1
fi

# Load environment variables from .env.local
echo "📋 Loading database credentials..."
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

# Validate required environment variables
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_DB" ]; then
    echo "❌ Error: Missing required database environment variables in .env.local"
    echo "Required: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB"
    exit 1
fi

# Set default values
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

# Construct connection URL for local development
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

echo "🏗️ Database: ${POSTGRES_DB}"
echo "🔌 Host: ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo "👤 User: ${POSTGRES_USER}"
echo ""

# Set up Poetry environment and connect
echo "🎭 Launching pgcli..."
export PATH="/home/ubuntu/.local/bin:$PATH"

# Check if pgcli is available
if [ -d ~/db-tools ]; then
    cd ~/db-tools
    poetry run pgcli "$DATABASE_URL"
else
    echo "❌ Error: pgcli environment not found at ~/db-tools"
    echo "Please run the installation commands from the guide first."
    exit 1
fi