# 🧙‍♂️ Database Explorer

Simple interactive PostgreSQL database exploration tool that follows the same patterns as your existing scripts.

## 🚀 Quick Start

```bash
node scripts/explore-db.js
```

That's it! The script will:

- ✅ Auto-load your `.env.local` file
- 🔗 Connect to your PostgreSQL database
- 📊 Present a beautiful interactive menu

## 🎯 Features

### 📊 Quick Views

- List all tables
- Recent users, posts, comments
- Database statistics
- Table sizes and activity

### 🔍 Schema Info

- Describe any table structure
- List all database indexes
- Show table relationships

### Custom Queries

- Run any SQL query interactively
- Popular pre-built queries
- Beautiful table output with `console.table()`

### 🛠️ Utilities

- Connection information
- Database health checks
- Activity monitoring

## 🏗️ Why This Approach?

This script follows the **exact same pattern** as your existing database scripts:

```javascript
// Same as debug-db.js, manage-user.js, etc.
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const chalk = require('chalk');
```

**Benefits:**

- ✅ Consistent with your codebase
- ✅ Uses existing dependencies
- ✅ Auto-loads environment variables
- ✅ Beautiful colored output
- ✅ Interactive with readline
- ✅ Proper error handling
- ✅ Works in both Docker and host environments

## 🎭 Example Session

```
🧙‍♂️ Database Explorer
Interactive PostgreSQL database exploration

📊 Quick Views:
  1. List all tables
  2. Recent users
  3. Recent posts
  4. Recent comments
  5. Database statistics
  6. Table sizes

🔍 Schema Info:
  7. Describe table
  8. List indexes
  9. Show relationships

 Custom Queries:
  10. Run custom SQL
  11. Popular queries

🛠️ Utilities:
  12. Connection info
  13. Database health

  0. Exit

Enter your choice: 2

👥 Recent Users

┌─────┬────┬─────────────────────┬───────────────────────────┬─────────────────────┬──────────────────┐
│ id  │ name│ email               │ created_at                │ profile_public      │                  │
├─────┼────┼─────────────────────┼───────────────────────────┼─────────────────────┼──────────────────┤
│ 123 │ John│ john@example.com    │ 2024-06-29T10:15:30.000Z  │ true                │                  │
└─────┴────┴─────────────────────┴───────────────────────────┴─────────────────────┴──────────────────┘
```

## 🔐 Production Usage

The script works perfectly on production servers too! Just make sure your `.env.local` (or `.env`) file has the correct database credentials.

## 🆘 Troubleshooting

**"Connection failed":**

- Check your `.env.local` file has correct `POSTGRES_*` variables
- Ensure the database is running

**"MODULE_NOT_FOUND":**

- All dependencies are already in your `package.json`
- Run `yarn install` if needed

---

_Much simpler than my original overly-complex approach! 🧙‍♂️✨_
