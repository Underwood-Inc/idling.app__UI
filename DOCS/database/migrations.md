---
layout: default
title: Database Migration System
description: Complete guide to the database migration system - safe, automated database changes with rollback protection
---

# Database Migrations System - User Guide

## 🤔 What Are Database Migrations?

Think of database migrations like **renovation instructions for your house**. Just like you might have a list of steps to renovate your kitchen (1. Remove old cabinets, 2. Install new plumbing, 3. Add new cabinets), database migrations are step-by-step instructions to update your database structure.

**Why do we need them?**
- When we add new features to the app, we sometimes need to change how data is stored
- Migrations ensure everyone's database has the same structure
- They keep track of what changes have been made and when

## 🗂 How Our Migration System Works

### The Basics (In Simple Terms)

1. **Migration Files** = Individual instruction sheets
   - Each file contains one set of database changes
   - Named with numbers so they run in order: `0001-add-users.sql`, `0002-add-posts.sql`
   - Stored in the `/migrations` folder

2. **Migration Tracker** = A checklist in the database
   - Keeps track of which instructions have been completed
   - Remembers if any instructions failed
   - Prevents running the same instructions twice

3. **Migration Tool** = The worker that follows instructions
   - Reads the instruction files
   - Runs them in the correct order
   - Updates the checklist when done

### Migration File Names
```
0001-create-users-table.sql     ← First instruction (create users)
0002-add-email-to-users.sql     ← Second instruction (add email field)
0003-create-posts-table.sql     ← Third instruction (create posts)
```

## 🛠 Using the Migration Tool

### Step 1: Run the Migration Tool
```bash
yarn migrations
```

You'll see a simple menu:
```
📦 Database Migration Tool
------------------------
1. Run all migrations
2. Create new migration

? Select an option: 
```

### Step 2A: Running All Pending Changes (Option 1)

When you choose option 1, the system will:

1. **Find all instruction files** in the migrations folder
2. **Check which ones are already done** (won't repeat them)
3. **Run any new instructions** in the correct order
4. **Show you a summary** of what happened

**Example Output:**
```
Found 9 migration files to process...

⚠ Skipping 0001-create-users.sql - already executed successfully
⚠ Skipping 0002-add-emails.sql - already executed successfully
✓ Successfully executed 0003-create-posts.sql
✖ Skipping 0004-broken-migration.sql - previous attempt failed
  Previous error: Column 'bad_name' doesn't exist
  To retry: fix the issue and delete this record from migrations table

==================================================
Migration Summary:
✓ Successful: 1
⚠ Skipped: 3
✖ Failed: 0
==================================================
```

### Step 2B: Creating New Instructions (Option 2)

When you choose option 2:

1. **Enter a description** of what you want to change
   ```
   ? Enter migration description: Add user profile pictures
   ```

2. **A new file is created** with the next number
   ```
   ✓ Created new migration: 0005-add-user-profile-pictures.sql
   ```

3. **Edit the file** to add your database changes

## 🔍 Understanding Migration Results

### ✅ What the Symbols Mean

- **✓ Successful** = The instruction worked perfectly
- **⚠ Skipped** = Already done before, or failed before and won't retry
- **✖ Failed** = Something went wrong during this run

### 🚨 When Things Go Wrong

**Don't Panic!** Failed migrations are normal and the system is designed to handle them safely.

**What happens when a migration fails:**
1. The system **stops that specific instruction** (doesn't break anything)
2. **Continues with other instructions** (doesn't stop the whole process)
3. **Remembers the failure** (won't try again automatically)
4. **Shows you exactly what went wrong**

**Example of a failure:**
```
✖ Skipping 0007-add-indexes.sql - previous attempt failed
  Previous error: CREATE INDEX CONCURRENTLY cannot run inside a transaction block
  To retry: fix the issue and delete this record from migrations table
```

## 🔧 Advanced Features (For Technical Users)

### Smart Transaction Handling

Our system automatically detects different types of database operations:

- **Regular Operations**: Run safely inside transactions (can be rolled back if they fail)
- **CONCURRENT Operations**: Run outside transactions (required by PostgreSQL)

**Example:**
```
Executing migration: 0007-create-indexes.sql
  Migration contains CONCURRENT operations, running without transaction...
```

### Failed Migration Handling

**Key Principle**: Failed migrations are **never retried automatically**

**Why?** 
- Prevents repeatedly running broken instructions
- Forces you to fix the problem first
- Keeps your database safe

**How to retry a failed migration:**
1. **Fix the problem** in the migration file
2. **Delete the failed record** from the migrations table:
   ```sql
   DELETE FROM migrations WHERE filename = '0007-problematic-migration.sql';
   ```
3. **Run migrations again**

## 📝 Writing Good Migration Instructions

### For Non-Technical Users

If you need to create migrations, follow these simple rules:

1. **One change per file**
   - Good: "Add email field to users"
   - Bad: "Add email, phone, and address fields plus create posts table"

2. **Use clear descriptions**
   - Good: `0005-add-user-email-field.sql`
   - Bad: `0005-update-stuff.sql`

3. **Add comments explaining what you're doing**
   ```sql
   -- This adds an email field to store user email addresses
   ALTER TABLE users ADD COLUMN email VARCHAR(255);
   ```

### For Technical Users

#### Best Practices
1. **Make migrations atomic** - each should do one logical thing
2. **Make them reversible** - document how to undo changes
3. **Test thoroughly** - run in development first
4. **Use transactions when possible** - except for CONCURRENT operations

#### Example Migration
```sql
-- Migration: Add email notifications preference
-- Purpose: Allow users to control email notifications
-- Reversible: ALTER TABLE users DROP COLUMN email_notifications;

ALTER TABLE users 
ADD COLUMN email_notifications BOOLEAN DEFAULT true NOT NULL;

-- Add index for faster queries
CREATE INDEX idx_users_email_notifications 
ON users(email_notifications) 
WHERE email_notifications = true;
```

## 🚨 Troubleshooting Guide

### "I don't see any migrations running"

**Check:**
1. Are you in the right directory? (should see a `migrations` folder)
2. Are there `.sql` files in the migrations folder?
3. Run `yarn migrations` and choose option 1

### "A migration failed and I don't know why"

**Steps:**
1. **Read the error message carefully** - it usually tells you exactly what's wrong
2. **Look at the migration file** - check for typos or syntax errors
3. **Ask for help** - share the error message with the technical team

### "I want to undo a migration"

**Important:** Migrations don't automatically undo themselves. You need to:
1. **Create a new migration** that reverses the changes
2. **Don't delete or modify existing migration files**

### Common Error Messages

1. **"CREATE INDEX CONCURRENTLY cannot run inside a transaction block"**
   - **What it means:** This type of database operation has special requirements
   - **Solution:** The system handles this automatically now, but older migrations might need fixing

2. **"Column already exists"**
   - **What it means:** You're trying to add something that's already there
   - **Solution:** Check if the migration already ran successfully

3. **"Table doesn't exist"**
   - **What it means:** You're trying to modify a table that hasn't been created yet
   - **Solution:** Make sure migrations run in the right order

## 🔒 Safety Features

### What Keeps Your Data Safe

1. **No Automatic Retries**: Failed migrations won't keep trying and potentially break things
2. **Smart Transaction Protection**: Different types of operations get different levels of safety
3. **Duplicate Prevention**: Same migration won't run twice
4. **Clear Tracking**: Always know what happened and when
5. **Automatic Rollback**: Failed changes are automatically undone (when possible)

## 🛡️ Understanding Transaction Safety (The "Undo" System)

### What Are Transactions? (In Simple Terms)

Think of database transactions like **writing in pencil vs. permanent marker**:

- **Pencil (Transaction)**: You can erase everything if you make a mistake
- **Permanent Marker (No Transaction)**: Once it's written, it stays there

Our migration system is smart about which "writing tool" to use for different types of changes.

### 🟢 Regular Migrations - Full "Undo" Protection

**What they include:**
- Creating new tables
- Adding columns to existing tables  
- Updating data
- Creating functions
- Most database changes

**How they work:**
```
🏠 Your Database Before: [Table A] [Table B]

📝 Migration starts: "Add Table C and Column X to Table A"
   ↳ 🔄 Transaction begins (everything in "draft mode")
   ↳ ✅ Create Table C (success)
   ↳ ❌ Add Column X (fails - maybe column already exists)
   ↳ 🔄 Transaction rollback (everything gets erased)

🏠 Your Database After: [Table A] [Table B] (exactly the same!)
```

**What this means for you:**
- ✅ **If ANY part fails, EVERYTHING gets undone**
- ✅ **Your database stays exactly the same**
- ✅ **No partial changes or broken state**
- ✅ **Safe to retry after fixing the problem**

### 🟡 CONCURRENT Migrations - Limited "Undo" Protection

**What they include:**
- Creating indexes for better performance
- Operations that need to run while the website stays online

**How they work:**
```
🏠 Your Database Before: [Table A] [Table B]

📝 Migration starts: "Create 3 performance indexes"
   ↳ ✅ Create Index 1 (success - stays permanent)
   ↳ ✅ Create Index 2 (success - stays permanent)  
   ↳ ❌ Create Index 3 (fails - maybe invalid column name)
   ↳ ⚠️ No rollback possible

🏠 Your Database After: [Table A + Index 1 + Index 2] [Table B]
```

**What this means for you:**
- ⚠️ **Some parts might succeed, others might fail**
- ⚠️ **Successful parts stay in your database**
- ⚠️ **May need manual cleanup if something goes wrong**
- ✅ **BUT: These are usually safe operations (like adding speed improvements)**

### 🤔 Why Two Different Types?

**Technical Reason:** Some database operations (like creating indexes while the website is running) simply cannot be "undone" by the database system.

**Practical Reason:** 
- **Regular changes** (like adding tables) are risky and need full protection
- **Performance improvements** (like indexes) are usually safe even if they partially fail

### 🚦 How to Tell Which Type You're Dealing With

The migration system tells you automatically:

**Regular Migration:**
```
Executing migration: 0002-add-user-email.sql
✓ Successfully executed 0002-add-user-email.sql
```

**CONCURRENT Migration:**
```
Executing migration: 0007-create-indexes.sql
  Migration contains CONCURRENT operations, executing statements individually...
✓ Successfully executed 0007-create-indexes.sql
```

### 🆘 What If Something Goes Wrong?

**For Regular Migrations:**
- ✅ **Nothing to worry about** - everything gets automatically undone
- ✅ **Fix the migration file and try again**

**For CONCURRENT Migrations:**
- ⚠️ **Check what actually got created** (use the verification queries in the migration)
- ⚠️ **May need to manually remove partial changes**
- ⚠️ **Ask technical team for help if unsure**

### Before Running Migrations

**In Production (Live Website):**
- ⚠️ **Always backup your database first**
- 🧪 **Test migrations in development environment**
- 👥 **Coordinate with your team**
- ⏰ **Plan for maintenance windows if needed**
- 📋 **Understand which migrations are CONCURRENT** (check the logs)

## 📊 Migration Table Structure

The system tracks everything in a simple table:

| Column | What It Stores | Example |
|--------|----------------|---------|
| `filename` | Name of the migration file | `0001-create-users.sql` |
| `executed_at` | When it was run | `2024-01-15 10:30:00` |
| `success` | Did it work? | `true` or `false` |
| `error_message` | What went wrong (if anything) | `Column already exists` |

### Checking Migration History

**To see what's been run:**
```sql
SELECT filename, executed_at, success 
FROM migrations 
ORDER BY executed_at DESC;
```

**To see only failures:**
```sql
SELECT filename, error_message, executed_at 
FROM migrations 
WHERE success = false;
```

## 🎯 Quick Reference

### Running Migrations
```bash
yarn migrations          # Start the migration tool
# Choose option 1         # Run all pending migrations
```

### Creating New Migration
```bash
yarn migrations          # Start the migration tool
# Choose option 2         # Create new migration
# Enter description       # Example: "Add user avatars"
```

### Checking What Happened
```sql
-- See all migrations
SELECT * FROM migrations ORDER BY executed_at DESC;

-- See only successful ones
SELECT * FROM migrations WHERE success = true;

-- See only failures
SELECT * FROM migrations WHERE success = false;
```

### Retry Failed Migration
```sql
-- First, fix the migration file, then:
DELETE FROM migrations WHERE filename = 'your-failed-migration.sql';
-- Then run yarn migrations again
```

### Check Transaction Safety
```sql
-- See which migrations were CONCURRENT (limited rollback)
SELECT filename, error_message 
FROM migrations 
WHERE error_message LIKE '%CONCURRENT%' OR error_message LIKE '%transaction block%';

-- See all migration statuses
SELECT filename, success, executed_at, error_message 
FROM migrations 
ORDER BY executed_at DESC;
```

## 📚 Need More Help?

- **For database questions**: Check PostgreSQL documentation
- **For SQL syntax**: Use online SQL references
- **For migration issues**: Ask your technical team
- **For urgent problems**: Always backup first, then ask for help

## 📋 Transaction Safety Quick Reference

| Migration Type | Example | Rollback Protection | What Happens on Failure |
|----------------|---------|-------------------|------------------------|
| **🟢 Regular** | Adding tables, columns, data | **Full Protection** | Everything gets undone automatically |
| **🟡 CONCURRENT** | Creating performance indexes | **Limited Protection** | Partial changes may remain |

### 🚨 Key Safety Rules

1. **Regular migrations are super safe** - if anything goes wrong, it's like it never happened
2. **CONCURRENT migrations need more care** - some changes might stick around if things fail
3. **Always backup before production migrations** - especially CONCURRENT ones
4. **The system tells you which type** - look for "executing statements individually" message
5. **When in doubt, ask for help** - better safe than sorry!

### 🎯 Bottom Line

**For most users:** Don't worry about the technical details. The system is designed to be as safe as possible, and it will tell you exactly what's happening.

**For technical users:** Regular migrations use full ACID transactions, CONCURRENT migrations run individual statements outside transactions due to PostgreSQL limitations.

---

*Remember: Migrations are powerful tools that keep your database organized and up-to-date. The transaction system ensures your data stays safe, but when in doubt, ask for help rather than guessing!* 