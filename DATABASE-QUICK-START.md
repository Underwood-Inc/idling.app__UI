# 🧙‍♂️ Database Quick Start Guide

Ready to explore your PostgreSQL database? Here's your magical toolkit! ⚡

## 🚀 Instant Setup

```bash
# Load the database aliases (run once per terminal session)
source db-aliases.sh

# See all available commands
dbhelp
```

## 🎯 Most Common Commands

### 🔌 Connect to Database
```bash
# Launch beautiful GUI interface (RECOMMENDED!)
dbconnect

# Or use basic psql in Docker container
dbdocker
```

### 📊 Quick Data Exploration
```bash
# List all tables
dbtables

# Show recent users
dbusers

# Show recent posts
dbposts

# Show database statistics
dbstats

# Check database health
dbhealth
```

### 🛠️ Custom Queries
```bash
# Run any SQL query
dbquery "SELECT * FROM users WHERE name LIKE '%john%';"

# Describe table structure
dbdesc users
dbdesc posts
dbdesc comments
```

## 🎨 pgcli Features (when using `dbconnect`)

- **Tab completion** - Press Tab to autocomplete table/column names
- **Syntax highlighting** - Beautiful colored SQL
- **Multi-line queries** - Write complex queries easily
- **Query history** - Use arrow keys to navigate previous queries
- **Save favorites** - `\fs alias_name your_query_here`
- **Export results** - `\o output.txt` then run query, then `\o`

## 🔍 Useful Exploration Queries

Copy and paste these into your database client:

```sql
-- User overview
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week
FROM users;

-- Recent activity
SELECT 'post' as type, title as content, created_at 
FROM posts 
UNION ALL 
SELECT 'comment' as type, LEFT(content, 50) as content, created_at 
FROM comments 
ORDER BY created_at DESC LIMIT 20;

-- Popular subthreads
SELECT subthread, COUNT(*) as posts, AVG(score) as avg_score 
FROM posts 
GROUP BY subthread 
ORDER BY posts DESC;

-- Most active users
SELECT u.name, COUNT(p.id) as posts, COUNT(c.id) as comments
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
LEFT JOIN comments c ON u.id = c.author_id
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 0 OR COUNT(c.id) > 0
ORDER BY (COUNT(p.id) + COUNT(c.id)) DESC
LIMIT 10;
```

## 🏗️ Your Database Schema

Your `idling` database contains:
- **users** - User accounts and profiles
- **posts** - Main content posts  
- **comments** - Post replies and discussions
- **votes** - Upvotes/downvotes on posts and comments
- **accounts** - OAuth account linking (NextAuth)
- **sessions** - User session management
- **submissions** - Legacy submission system

## 🔐 Production Usage

For your production server, install pgcli:

```bash
# On production server
sudo apt update && sudo apt install -y pipx
pipx install pgcli

# Then connect
pgcli postgresql://username:password@hostname:5432/database_name
```

## 🆘 Troubleshooting

**"Connection refused":**
```bash
# Check if Docker containers are running
docker ps | grep postgres

# Start if needed
docker-compose up -d postgres
```

**"Authentication failed":**
```bash
# Check your .env.local file has correct credentials
cat .env.local | grep POSTGRES
```

**"Command not found":**
```bash
# Reload aliases
source db-aliases.sh
```

---

🎭 **Pro Tip:** Add `source /workspace/db-aliases.sh` to your `~/.bashrc` or `~/.zshrc` to automatically load these aliases in every terminal session!

*Happy database exploring, wise wizard! 🧙‍♂️✨*