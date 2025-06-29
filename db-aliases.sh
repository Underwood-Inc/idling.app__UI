#!/bin/bash
# 🧙‍♂️ Database Exploration Aliases
# Source this file: source db-aliases.sh

echo "🔮 Setting up database exploration aliases..."

# Export PATH for pgcli
export PATH="/home/ubuntu/.local/bin:$PATH"

# Quick database connection aliases
alias dbconnect='cd /workspace && ./connect-local-db.sh'
alias dbgui='cd /workspace && ./connect-local-db.sh'
alias pgcli-local='cd ~/db-tools && poetry run pgcli'

# Docker database connection aliases  
alias dbdocker='docker exec -it postgres psql -U postgres -d idling'
alias dbcontainer='docker exec -it postgres bash'

# Database exploration shortcuts
alias dbtables='docker exec postgres psql -U postgres -d idling -c "\dt"'
alias dbusers='docker exec postgres psql -U postgres -d idling -c "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;"'
alias dbposts='docker exec postgres psql -U postgres -d idling -c "SELECT id, title, author_id, created_at, score FROM posts ORDER BY created_at DESC LIMIT 10;"'
alias dbstats='docker exec postgres psql -U postgres -d idling -c "SELECT schemaname, tablename, n_tup_ins as inserts, n_tup_upd as updates, n_tup_del as deletes FROM pg_stat_user_tables ORDER BY n_tup_ins DESC LIMIT 10;"'

# Database status and health checks
alias dbstatus='echo "🏛️ Database Status:" && docker exec postgres psql -U postgres -d idling -c "SELECT current_database(), current_user, inet_server_addr(), inet_server_port(), version();"'
alias dbhealth='docker exec postgres pg_isready -U postgres'

# Helpful functions
dbquery() {
    if [ -z "$1" ]; then
        echo "Usage: dbquery 'SELECT * FROM users LIMIT 5;'"
        return 1
    fi
    docker exec postgres psql -U postgres -d idling -c "$1"
}

dbdesc() {
    if [ -z "$1" ]; then
        echo "Usage: dbdesc table_name"
        echo "Available tables: users, posts, comments, accounts, sessions, votes, submissions"
        return 1
    fi
    docker exec postgres psql -U postgres -d idling -c "\d $1"
}

# Show available aliases
dbhelp() {
    echo "🧙‍♂️ Available Database Aliases:"
    echo ""
    echo "🔌 Connection:"
    echo "  dbconnect    - Connect with pgcli GUI interface"
    echo "  dbgui        - Same as dbconnect"
    echo "  dbdocker     - Connect with basic psql in Docker"
    echo "  dbcontainer  - Enter PostgreSQL container bash"
    echo ""
    echo "📊 Quick Queries:"
    echo "  dbtables     - List all tables"
    echo "  dbusers      - Show recent users"
    echo "  dbposts      - Show recent posts" 
    echo "  dbstats      - Show table statistics"
    echo "  dbstatus     - Show database status"
    echo "  dbhealth     - Check database health"
    echo ""
    echo "🛠️ Functions:"
    echo "  dbquery 'SQL' - Execute custom SQL"
    echo "  dbdesc table  - Describe table structure"
    echo "  dbhelp        - Show this help"
    echo ""
}

echo "✅ Database aliases loaded! Type 'dbhelp' to see available commands."
echo "🚀 Quick start: Run 'dbconnect' to open the GUI interface!"