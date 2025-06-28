---
layout: default
title: 'Docker Development Setup'
description: 'Complete guide to Docker configuration for Idling.app development environment'
nav_order: 5
parent: 'Development'
---

# Docker Development Setup

This guide covers the complete Docker setup for developing Idling.app, including the custom Dockerfile configuration and container environment.

## 🐳 Docker Configuration Overview

The project uses a custom Docker configuration that provides:

- **Node.js 20** runtime environment
- **Ruby 3.3.4** with Jekyll for documentation
- **PostgreSQL** database integration
- **zsh** with Powerlevel10k theme
- **Hot reload** capabilities for development

## 📁 Key Docker Files

### Dockerfile

Located at project root: `/Dockerfile`

```dockerfile
FROM node:20

# Install Ruby, Jekyll dependencies, zsh, and git
RUN apt-get update && apt-get install -y \
  ruby-full \
  build-essential \
  zlib1g-dev \
  zsh \
  git \
  curl \
  fonts-powerline \
  && rm -rf /var/lib/apt/lists/*

# Set Ruby environment variables
ENV PATH="/usr/local/bin:$PATH"
ENV GEM_HOME="/usr/local/bundle"
ENV BUNDLE_SILENCE_ROOT_WARNING=1
ENV BUNDLE_APP_CONFIG="$GEM_HOME"

# Install Bundler and Jekyll (GitHub Pages compatible versions)
RUN gem install bundler:2.5.23 && \
    gem install jekyll:3.10.0 && \
    gem cleanup
```

### docker-compose.yml

Located at project root: `/docker-compose.yml`

```yaml
services:
  nextjs:
    build: . # Uses custom Dockerfile
    container_name: nextjs
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - '3000:3000'
      - '4000:4000' # Jekyll docs
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
```

### .dockerignore

Optimizes build performance by excluding unnecessary files:

```
# Dependencies
node_modules/
yarn-error.log

# Build outputs
.next/
out/
dist/

# Documentation build files
DOCS/_site/
DOCS/.sass-cache/
DOCS/.jekyll-cache/
DOCS/vendor/
DOCS/Gemfile.lock
```

## 🚀 Getting Started

### 1. Prerequisites

- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)

### 2. Container Startup

**Standard Development:**

```bash
docker-compose up
```

**Background Mode:**

```bash
docker-compose up -d
```

**Rebuild Containers:**

```bash
docker-compose up --build
```

### 3. Access Services

| Service         | URL                   | Description         |
| --------------- | --------------------- | ------------------- |
| **Next.js App** | http://localhost:3000 | Main application    |
| **Jekyll Docs** | http://localhost:4000 | Documentation site  |
| **PostgreSQL**  | localhost:5432        | Database (internal) |

## 🛠️ Development Workflow

### Interactive Shell Access

```bash
# Access the main container
docker exec -it nextjs zsh

# Run specific commands
docker exec -it nextjs yarn dev:seed
docker exec -it nextjs yarn docs:install
```

### Container Management

**View Running Containers:**

```bash
docker-compose ps
```

**Stop Services:**

```bash
docker-compose down
```

**View Logs:**

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs nextjs
```

**Restart Specific Service:**

```bash
docker-compose restart nextjs
```

## 📊 Container Environment Details

### System Packages

- **Node.js**: 20.x (latest LTS)
- **Ruby**: 3.3.4 (GitHub Pages compatible)
- **zsh**: Default shell with Powerlevel10k
- **Git**: Version control
- **Build tools**: gcc, make, build-essential

### Ruby Gems

- **Bundler**: 2.5.23
- **Jekyll**: 3.10.0 (GitHub Pages compatible)
- **GitHub Pages**: Latest compatible version

### Node.js Tools

- **Yarn**: Package manager
- **Next.js**: React framework
- **Development tools**: ESLint, Prettier, TypeScript

## 🔧 Advanced Configuration

### Custom Shell Setup

The container includes zsh with Powerlevel10k:

```bash
# Shell configuration in Dockerfile
RUN echo 'source /opt/powerlevel10k/powerlevel10k.zsh-theme' >> /etc/zsh/zshrc
RUN echo 'POWERLEVEL9K_DISABLE_CONFIGURATION_WIZARD=true' >> /etc/zsh/zshrc
```

### Volume Mounts

```yaml
volumes:
  - .:/app # Source code (live reload)
  - /app/node_modules # Persist node_modules
```

### Environment Variables

```bash
# Ruby configuration
GEM_HOME="/usr/local/bundle"
BUNDLE_SILENCE_ROOT_WARNING=1
BUNDLE_APP_CONFIG="$GEM_HOME"

# Shell configuration
SHELL=/usr/bin/zsh
```

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use:**

```bash
# Kill processes on ports 3000/4000
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:4000 | xargs kill -9
```

**Container Won't Start:**

```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose up --build
```

**Permission Issues:**

```bash
# Fix ownership (Linux/WSL)
sudo chown -R $USER:$USER .
```

**Jekyll Dependencies:**

```bash
# Reinstall Jekyll gems
docker exec -it nextjs bash -c "cd DOCS && bundle install"
```

### Performance Optimization

**Reduce Build Time:**

- Use `.dockerignore` to exclude unnecessary files
- Leverage Docker layer caching
- Use multi-stage builds for production

**Memory Usage:**

```bash
# Monitor container resources
docker stats nextjs
```

## 🔄 Integration with CI/CD

The Docker setup integrates with:

- **GitHub Actions**: Automated testing and deployment
- **Development workflow**: Consistent environment across team
- **Production deployment**: Container-ready builds

## 📝 Related Documentation

- [Environment Variables](environment-variables.html)
- [Caching](caching.html)
- [Testing](testing.html)
- [Deployment → Production](../deployment/production.html)

## 💡 Tips

1. **Use `docker-compose` for development** - provides complete environment
2. **Keep containers running** - faster iteration than rebuilding
3. **Use volume mounts** - enables hot reload for development
4. **Monitor logs** - `docker-compose logs -f` for real-time debugging
5. **Clean up regularly** - `docker system prune` to free disk space
