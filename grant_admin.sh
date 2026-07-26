#!/bin/bash

# Parse DATABASE_URL from .env file
# Expected format: postgres://user:password@host:port/dbname
DB_URL=$(grep DATABASE_URL backend/.env.example | cut -d '=' -f2)

# Extract components using bash-specific feature
# We will use 'bash' explicitly to interpret this.
DB_USER=$(echo $DB_URL | sed -n 's|postgres://\([^:]*\):.*|\1|p')
DB_PASSWORD=$(echo $DB_URL | sed -n 's|postgres://[^:]*:\([^@]*\)@.*|\1|p')
DB_NAME=$(echo $DB_URL | sed -n 's|.*:5432/\(.*\)|\1|p')

if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo "Error: Could not parse DATABASE_URL from backend/.env.example"
    exit 1
fi

echo "Enter your ThreadDesk User ID to grant admin access:"
read user_id

# Run the SQL command using PGPASSWORD
export PGPASSWORD=$DB_PASSWORD
docker exec -it threaddesk-db psql -U "$DB_USER" -d "$DB_NAME" -c "UPDATE users SET is_admin = true WHERE id = $user_id;"

echo "Admin access granted to user $user_id."
