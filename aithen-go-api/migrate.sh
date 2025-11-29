#!/bin/bash
# Bash script to run migrations
# Usage: ./migrate.sh [up|down|fresh|version]

COMMAND=${1:-up}

echo "Running migration command: $COMMAND"

case $COMMAND in
    up)
        go run cmd/migrate/main.go -command up
        ;;
    down)
        go run cmd/migrate/main.go -command down
        ;;
    fresh)
        echo "⚠️  WARNING: This will drop ALL tables and re-run migrations!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            go run cmd/migrate/main.go -command fresh
        else
            echo "Cancelled."
            exit 1
        fi
        ;;
    version)
        go run cmd/migrate/main.go -command version
        ;;
    create)
        if [ -z "$2" ]; then
            echo "❌ Migration name is required"
            echo "Usage: ./migrate.sh create <migration_name>"
            exit 1
        fi
        go run cmd/migrate/main.go -command create -name "$2"
        ;;
    force)
        if [ -z "$2" ]; then
            echo "❌ Version number is required"
            echo "Usage: ./migrate.sh force <version_number>"
            echo "Example: ./migrate.sh force 2"
            echo ""
            echo "This command fixes 'dirty database version' errors by forcing the version."
            exit 1
        fi
        go run cmd/migrate/main.go -command force -version "$2"
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Usage: ./migrate.sh [up|down|fresh|version|create <name>|force <version>]"
        exit 1
        ;;
esac

