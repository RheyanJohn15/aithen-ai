# Database Migrations

This directory contains database migration scripts for the Aithen Go API.

## Structure

```
migrations/
├── migrate.go          # Migration functions (RunMigrations, DownMigrations, etc.)
└── files/              # SQL migration files
    ├── 000001_init_schema.up.sql
    └── 000001_init_schema.down.sql
```

## Migration Files

Migration files follow the naming convention:
- `{version}_{name}.up.sql` - Applied when migrating up
- `{version}_{name}.down.sql` - Applied when rolling back

The version number should be sequential (000001, 000002, etc.).

## Usage

### Running Migrations

```bash
# Run all pending migrations
go run cmd/migrate/main.go -command up

# Or use the helper script
.\migrate.ps1 up  # Windows
./migrate.sh up   # Linux/macOS
```

### Rolling Back Migrations

```bash
# Rollback the last migration
go run cmd/migrate/main.go -command down

# Or use the helper script
.\migrate.ps1 down  # Windows
./migrate.sh down   # Linux/macOS
```

### Fresh Migrations (Drop All Tables & Re-run)

**⚠️ Warning: This will drop ALL tables in your database!**

Similar to Laravel's `php artisan migrate:fresh`, this command drops all tables and re-runs all migrations:

```bash
# Drop all tables and re-run migrations
go run cmd/migrate/main.go -command fresh

# Or use the helper script (includes confirmation prompt)
.\migrate.ps1 fresh  # Windows
./migrate.sh fresh   # Linux/macOS
```

The helper scripts include a safety confirmation prompt before executing.

### Fixing Dirty Database Version

If a migration fails partway through, the database can be left in a "dirty" state. This prevents further migrations from running until fixed.

**To fix a dirty database version:**

```bash
# Check current version (will show if dirty)
go run cmd/migrate/main.go -command version

# Force to a specific version (clears dirty flag)
go run cmd/migrate/main.go -command force -version <version_number>

# Or using helper scripts
.\migrate.ps1 force 2    # Windows
./migrate.sh force 2      # Linux/macOS
```

**Example scenario:**
1. Migration 2 fails partway through → Database marked as "dirty version 2"
2. Run: `.\migrate.ps1 force 2` → Clears dirty flag
3. Fix the migration SQL if needed
4. Run: `.\migrate.ps1 up` → Continue migrations

### Checking Migration Version

```bash
# Check current migration version
go run cmd/migrate/main.go -command version

# Or use the helper script
.\migrate.ps1 version  # Windows
./migrate.sh version   # Linux/macOS
```

### Creating New Migrations

Use the built-in `create` command (similar to Laravel's `make:migration`):

```bash
# Using Go command
go run cmd/migrate/main.go -command create -name <migration_name>

# Using helper scripts
.\migrate.ps1 create <migration_name>  # Windows
./migrate.sh create <migration_name>  # Linux/macOS
```

**Examples:**
```bash
# Create a migration for adding a users table
go run cmd/migrate/main.go -command create -name add_users_table

# Names with spaces are automatically converted to snake_case
go run cmd/migrate/main.go -command create -name "add chat sessions"
# Creates: 000002_add_chat_sessions.up.sql and .down.sql
```

The command automatically:
- Finds the next sequential version number
- Converts names to snake_case format
- Creates both `.up.sql` and `.down.sql` files
- Adds helpful template comments

**Alternative: Using migrate CLI tool**

You can also use the migrate CLI tool:

```bash
migrate create -ext sql -dir internal/migrations/files -seq <migration_name>
```

## Best Practices

1. **Always create both up and down migrations** - Down migrations allow you to rollback changes
2. **Test migrations** - Test both up and down migrations before deploying
3. **Use transactions** - Wrap migrations in transactions when possible (golang-migrate handles this automatically)
4. **Keep migrations small** - Each migration should do one logical thing
5. **Never modify existing migrations** - Create a new migration instead of editing old ones
6. **Use IF NOT EXISTS** - For idempotent migrations when appropriate

## Example Migration

**000002_add_users_table.up.sql:**
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

**000002_add_users_table.down.sql:**
```sql
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
```

