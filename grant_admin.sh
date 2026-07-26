#!/bin/bash

# Source credentials from the real .env file
# Using source and exporting allows us to access variables directly
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
else
    echo "Error: backend/.env not found"
    exit 1
fi

# Detect the database container name dynamically
# We look for a container running postgres
DB_CONTAINER=$(docker ps --filter "name=db" --format "{{.Names}}" | head -n 1)

if [ -z "$DB_CONTAINER" ]; then
    echo "Error: Could not automatically detect a database container."
    echo "Please set DB_CONTAINER manually in the script."
    exit 1
fi

echo "Using database container: $DB_CONTAINER"

echo "Enter your ThreadDesk User ID to grant admin access:"
read user_id

# Run the SQL command using the default 'postgres' user
docker exec -it $DB_CONTAINER psql -U postgres -d "$DB_NAME" -c "UPDATE users SET is_admin = true WHERE id = $user_id;"

echo "Admin access granted to user $user_id."
