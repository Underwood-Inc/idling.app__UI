---
layout: default
title: 'Docker Development Setup'
description: 'Complete guide to containerized development with Docker'
permalink: /docs/getting-started/docker/
---

# 🐳 Docker Development Setup

Complete guide to setting up a containerized development environment for Idling.app.

## 🎯 Why Docker?

Docker provides:

- **Consistent Environment**: Same setup across all machines
- **Easy Database Management**: PostgreSQL runs in a container
- **Isolated Dependencies**: No conflicts with your system
- **Quick Setup**: One command to start everything

## 📋 Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (usually included with Docker Desktop)
- **Git** for cloning the repository

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Underwood-Inc/idling.app__UI.git
cd idling.app__UI

# Start all services
docker-compose up -d

# Install dependencies (on host)
yarn install

# Run database migrations
yarn db:migrate

# Start development server
yarn dev
```

## 📁 Docker Configuration

### docker-compose.yml

Our Docker setup includes:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: idling_app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./src/lib/scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

Create a `.env` file:

```env
# Database (matches docker-compose.yml)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=idling_app

# Redis
REDIS_URL=redis://localhost:6379

# Application
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret
NODE_ENV=development
```

## 🔧 Docker Commands

### Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres
```

### Database Management

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d idling_app

# Run SQL file
docker-compose exec postgres psql -U postgres -d idling_app -f /docker-entrypoint-initdb.d/000-init.sql

# Backup database
docker-compose exec postgres pg_dump -U postgres idling_app > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres idling_app < backup.sql
```

### Container Management

```bash
# Rebuild containers
docker-compose build

# Remove containers and volumes
docker-compose down -v

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec postgres bash
```

## 🗄️ Database Initialization

### Automatic Initialization

The Docker setup automatically runs initialization scripts from `src/lib/scripts/`:

1. `000-init.sql` - Creates tables and initial schema
2. `001-seed.sql` - Inserts sample data (optional)

### Manual Database Setup

```bash
# Run migrations
yarn db:migrate

# Seed with sample data
yarn db:seed

# Reset database (careful!)
yarn db:reset
```

## 🔍 Monitoring & Debugging

### Health Checks

```bash
# Check container health
docker-compose ps

# Check database connection
docker-compose exec postgres pg_isready -U postgres

# Test application connection
curl http://localhost:3000/api/health
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Follow logs with timestamps
docker-compose logs -f -t postgres
```

### Database Inspection

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d idling_app

# List tables
\dt

# Describe table
\d table_name

# Run query
SELECT * FROM users LIMIT 5;
```

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**

```bash
# Check what's using port 5432
lsof -i :5432

# Kill process
kill -9 <PID>

# Or use different port in docker-compose.yml
ports:
  - "5433:5432"
```

**Database Connection Refused**

```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**Permission Issues**

```bash
# Fix volume permissions
sudo chown -R $USER:$USER postgres_data/

# Or reset volumes
docker-compose down -v
docker-compose up -d
```

**Container Won't Start**

```bash
# Check Docker daemon
docker info

# Clean up Docker
docker system prune -a

# Rebuild containers
docker-compose build --no-cache
```

## 🚀 Advanced Configuration

### Custom Docker Setup

Create `docker-compose.override.yml` for local customizations:

```yaml
version: '3.8'

services:
  postgres:
    environment:
      POSTGRES_DB: my_custom_db
    ports:
      - '5433:5432'

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - '5050:80'
```

### Development Tools

Add useful development tools:

```yaml
services:
  mailhog:
    image: mailhog/mailhog
    ports:
      - '1025:1025'
      - '8025:8025'

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'
      - '9001:9001'
```

## 📊 Performance Optimization

### Resource Limits

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Volume Optimization

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/fast/storage
```

## 🔗 Integration with Development

### VS Code Integration

Install Docker extension and add to `.vscode/settings.json`:

```json
{
  "docker.defaultRegistryPath": "your-registry",
  "docker.commands.build": "docker-compose build",
  "docker.commands.up": "docker-compose up -d"
}
```

### GitHub Actions

```yaml
name: Test with Docker

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose up -d
      - name: Run tests
        run: yarn test
```

## 📚 Next Steps

1. 🏗️ Learn about [Architecture](../../architecture/)
2. 🧩 Explore [Components](../../../dev/components/)
3. 🧪 Set up [Testing](../../../dev/testing/)
4. 🚀 Deploy to [Production](../../deployment/)

## 💡 Pro Tips

- Use `docker-compose.override.yml` for local customizations
- Keep your Docker images updated regularly
- Use named volumes for persistent data
- Monitor resource usage with `docker stats`
- Use `.dockerignore` to exclude unnecessary files

---

Happy containerized development! 🐳✨
