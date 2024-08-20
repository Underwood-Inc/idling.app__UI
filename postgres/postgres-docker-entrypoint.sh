#!/bin/sh

# Wait for PostgreSQL to be ready
until pg_isready -h postgres -U "$POSTGRES_USER"; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

# Run the initialization script
echo 'running init.sql...'
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init.sql

# ls;
# echo "";
# ls /etc/postgresql;
# Start PostgreSQL
exec docker-entrypoint.sh postgres -c config_file=/etc/postgresql/postgresql.conf
