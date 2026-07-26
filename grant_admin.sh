#!/bin/bash

# Parse DATABASE_URL from .env file
# Expected format: postgres://user:password@host:port/dbname
DB_URL=$(grep DATABASE_URL backend/.env.example | cut -d '=' -f2)

# Extract user, password, host, port, dbname from DATABASE_URL
# Using regex to extract components
if [[ $DB_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "Error: Could not parse DATABASE_URL from backend/.env.example"
    exit 1
fi

echo "Enter your ThreadDesk User ID to grant admin access:"
read user_id

# Run the SQL command using PGPASSWORD
export PGPASSWORD=$DB_PASSWORD
docker exec -it threaddesk-db psql -U $DB_USER -d $DB_NAME -c "UPDATE users SET is_admin = true WHERE id = $user_id;"

echo "Admin access granted to user $user_id."
