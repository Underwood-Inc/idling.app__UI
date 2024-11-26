# Database Migrations System

## Overview

Our database migration system provides a way to manage and version control database schema changes. It supports creating new migrations, running individual migrations, and executing all pending migrations in order.

## 🗂 How Migrations Work

### Migration Files
- Located in the `/migrations` directory
- Named using the pattern: `{NUMBER}-{description}.sql`
  - Example: `0000-add-users-table.sql`
- Numbers are sequential (0000, 0001, 0002, etc.)
- SQL files contain the actual database changes

### Migration Table
The system maintains a `migrations` table in the database:
```sql
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  error_message TEXT
);
```

## 🛠 Using the Migration Tool

### Running the Migration Tool
```bash
# you may need to run this in the docker container
yarn migrations
```

You'll see two options:
1. Run all migrations
2. Create new migration

### Creating a New Migration
1. Select option 2 from the menu
2. Enter a description for your migration
   - This becomes part of the filename
   - Spaces are converted to hyphens
3. A new SQL file will be created in the migrations directory

Example:
```bash
? Enter migration description: Add Users Table
✓ Created new migration: 0001-add-users-table.sql
```

### Running Migrations
1. Select option 1 from the menu
2. The system will:
   - Find all `.sql` files in the migrations directory
   - Sort them numerically
   - Run any migrations that haven't been executed yet
   - Record the results in the migrations table

## 🔍 Migration System Features

### 1. Directory Management
- Automatically creates a `/migrations` directory if it doesn't exist
- Validates directory existence before operations

### 2. Sequential Numbering
- Automatically determines the next migration number
- Handles gaps in numbering (if 0001 and 0003 exist, next will be 0004)
- Starts at 0000 for first migration

### 3. Migration Tracking
- Records all migration attempts in the database
- Tracks successful and failed migrations
- Prevents duplicate migration execution
- Stores error messages for failed migrations

### 4. Transaction Support
- Runs migrations within transactions
- Rolls back failed migrations
- Ensures database consistency

### 5. Error Handling
- Graceful handling of common errors
- Detailed error reporting
- Safe failure modes

## 📝 Writing Migrations

### Best Practices
1. **Make migrations atomic**
   - Each migration should do one thing
   - Keep migrations focused and small

2. **Make migrations reversible**
   - Include DROP statements in comments
   - Document how to reverse changes

3. **Use descriptive names**
   ```sql
   -- Good: 0001-add-user-email-column.sql
   -- Bad: 0001-update-table.sql
   ```

4. **Include comments**
   ```sql
   -- Migration: Add email column to users table
   -- Reversible: ALTER TABLE users DROP COLUMN email;
   
   ALTER TABLE users
   ADD COLUMN email VARCHAR(255) NOT NULL;
   ```

### Example Migration
```sql
-- Migration: Create users table
-- Reversible: DROP TABLE users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

## 🧪 Testing Migrations

The migration system includes comprehensive tests:

1. **Directory Management Tests**
   - Creation of migrations directory
   - Handling of existing directories
   - Error handling

2. **Migration Numbering Tests**
   - Sequential number generation
   - Handling of gaps in numbering
   - First migration case

3. **Migration Execution Tests**
   - Successful migration execution
   - Duplicate migration prevention
   - Error handling
   - Transaction rollback

4. **Integration Tests**
   - Full migration process
   - Multiple migration handling
   - Database state verification

## 🚨 Troubleshooting

### Common Issues

1. **"Migration directory doesn't exist"**
   - Run the migration tool once to create it
   - Check file permissions

2. **"Migration already executed"**
   - Check the migrations table for history
   - Clear the record if re-run is needed

3. **"Invalid migration filename"**
   - Ensure filename follows pattern: `NNNN-description.sql`
   - Check for special characters in description

4. **Transaction Failures**
   - Check SQL syntax
   - Verify database permissions
   - Review migration logs

### Debugging

1. Check the migrations table:
```sql
SELECT * FROM migrations ORDER BY executed_at DESC;
```

2. View failed migrations:
```sql
SELECT * FROM migrations WHERE success = false;
```

3. Review migration files:
```bash
ls -la migrations/
```

## 🔒 Security Considerations

1. **Access Control**
   - Migrations should run with appropriate database permissions
   - Avoid running as superuser when possible

2. **Data Safety**
   - Always backup database before running migrations
   - Test migrations in development first
   - Use transactions for safety

3. **Sensitive Data**
   - Don't include sensitive data in migration files
   - Use environment variables for sensitive values

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQL Best Practices](https://www.sqlstyle.guide/)
- [Database Migration Patterns](https://martinfowler.com/articles/evodb.html) 