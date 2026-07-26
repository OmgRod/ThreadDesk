#!/bin/bash

# Source credentials from the real .env file
if [ -f backend/.env ]; then
    export $(grep -v '^#' backend/.env | xargs)
else
    echo "Error: backend/.env not found"
    exit 1
fi

# Hardcode container name based on docker-compose.yml
DB_CONTAINER="threaddesk-postgres"

# Tag handling
LAST_TAG_FILE=".last_git_tag"
LATEST_TAG=$(git describe --tags $(git rev-list --tags --max-count=1))

if [ ! -f "$LAST_TAG_FILE" ]; then
    echo "$LATEST_TAG" > "$LAST_TAG_FILE"
    echo "Initialized tag tracking with $LATEST_TAG"
    exit 0
fi

LAST_TAG=$(cat "$LAST_TAG_FILE")

if [ "$LATEST_TAG" != "$LAST_TAG" ]; then
    echo "New release detected ($LAST_TAG -> $LATEST_TAG). Updating..."
    
    # Pull updates
    git pull origin main
    
    # Run migrations/build from root
    npm install
    # Assuming backend needs migration run within its context or via root
    cd backend && npm run db:generate && npm run db:migrate && cd ..
    npm run build
    
    # Restart the application
    docker compose down
    docker compose up -d
    
    # Update tag
    echo "$LATEST_TAG" > "$LAST_TAG_FILE"
    
    echo "Update complete."
else
    echo "No new release."
fi
