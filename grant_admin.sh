#!/bin/bash

# Source credentials from the real .env file
if [ -f backend/.env ]; then
    # Manually extract and export variables to avoid issues with potential special characters
    export $(grep -v '^#' backend/.env | xargs)
else
    echo "Error: backend/.env not found"
    exit 1
fi

# Hardcode container name based on docker-compose.yml
DB_CONTAINER="threaddesk-postgres"

echo "Using database container: $DB_CONTAINER"
echo "Using database user: $DB_USER"

echo "Enter your ThreadDesk User ID to grant admin access:"
read user_id

# Run the SQL command using the DB_USER from .env
# PGPASSWORD allows non-interactive password entry
export PGPASSWORD=$DB_PASSWORD
docker exec -it $DB_CONTAINER psql -U "$DB_USER" -d "$DB_NAME" -c "UPDATE users SET is_admin = true WHERE id = '$user_id';"

echo "Admin access granted to user $user_id."
