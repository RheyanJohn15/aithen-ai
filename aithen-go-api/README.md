# Aithen Go API

A Go-based API server built with Gin that provides AI chat endpoints and acts as a proxy to the AI service.

## Prerequisites

- **Go 1.25.4 or higher** - [Download Go](https://golang.org/dl/)
- **PostgreSQL** - Database server (local or remote)
- **AI Service** - The Python FastAPI service should be running (default: `http://localhost:8000`)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd aithen-go-api
```

### 2. Install Dependencies

```bash
go mod download
go mod tidy
```

This will download all required dependencies specified in `go.mod` and ensure they're properly resolved.

## Configuration

### Environment Variables

Create a `.env` file in the root of the `aithen-go-api` directory with the following variables:

```env
# Server Configuration
PORT=8080

# Database Configuration
DB_USER=your_db_user
DB_PASS=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
```

**Note:** If no `.env` file is found, the application will use system environment variables. The server will default to port `8080` if `PORT` is not set.

## Running the Server

### Start the Local Server

```bash
go run cmd/server/main.go
```

The server will start on port `8080` (or the port specified in your `PORT` environment variable).

You should see:
```
✅ Database connected
🚀 Server running on port 8080
```

### Build and Run

Alternatively, you can build the binary first:

```bash
# Build the binary
go build -o aithen-api cmd/server/main.go

# Run the binary
./aithen-api
```

On Windows:
```bash
go build -o aithen-api.exe cmd/server/main.go
aithen-api.exe
```

## Database Migrations

The project uses [golang-migrate](https://github.com/golang-migrate/migrate) for database schema management.

### Running Migrations

After installing dependencies, run migrations to set up your database schema:

**Using the Go command:**
```bash
# Run all pending migrations
go run cmd/migrate/main.go -command up

# Rollback the last migration
go run cmd/migrate/main.go -command down

# Drop all tables and re-run migrations (like Laravel's migrate:fresh)
go run cmd/migrate/main.go -command fresh

# Check current migration version
go run cmd/migrate/main.go -command version
```

**Using helper scripts:**
```bash
# Windows (PowerShell)
.\migrate.ps1 up
.\migrate.ps1 down
.\migrate.ps1 fresh    # Drops all tables and re-runs migrations
.\migrate.ps1 version

# Linux/macOS (Bash)
chmod +x migrate.sh
./migrate.sh up
./migrate.sh down
./migrate.sh fresh     # Drops all tables and re-runs migrations
./migrate.sh version
```

**⚠️ Warning:** The `fresh` command will **drop ALL tables** in your database and re-run all migrations. Use with caution, especially in production!

### Fixing Dirty Database Version

If you encounter a "Dirty database version" error (usually happens when a migration fails partway through), you can fix it using the `force` command:

```bash
# Force the database to a specific version (clears dirty flag)
go run cmd/migrate/main.go -command force -version <version_number>

# Or using helper scripts
.\migrate.ps1 force 2    # Windows - forces version to 2
./migrate.sh force 2      # Linux/macOS - forces version to 2
```

**Example:** If you see "Dirty database version 2", run:
```bash
.\migrate.ps1 force 2
```

This will clear the dirty flag and allow migrations to continue. After fixing, you can run `migrate up` again.

### Creating New Migrations

You can create new migrations using the built-in `create` command (similar to Laravel's `php artisan make:migration`):

**Using the Go command:**
```bash
go run cmd/migrate/main.go -command create -name <migration_name>
```

**Using helper scripts:**
```bash
# Windows (PowerShell)
.\migrate.ps1 create add_users_table

# Linux/macOS (Bash)
./migrate.sh create add_users_table
```

**Examples:**
```bash
# Create a migration for adding a users table
go run cmd/migrate/main.go -command create -name add_users_table

# Create a migration with spaces (automatically converted to snake_case)
go run cmd/migrate/main.go -command create -name "add chat sessions table"
# Creates: 000002_add_chat_sessions_table.up.sql
```

This will automatically:
- Generate the next sequential version number
- Convert the name to snake_case
- Create both `.up.sql` and `.down.sql` files
- Add template comments to get you started

**Alternative: Using migrate CLI tool**

You can also use the migrate CLI tool if you prefer:

**Install migrate CLI:**
```bash
# Windows (using Chocolatey)
choco install migrate

# macOS (using Homebrew)
brew install migrate

# Linux
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.18.1/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/migrate
```

**Create a new migration:**
```bash
migrate create -ext sql -dir internal/migrations/files -seq <migration_name>
```

### Migration Files

Migration files are located in `internal/migrations/files/`. Each migration consists of:
- **Up migration** (`.up.sql`): Contains SQL to apply the migration
- **Down migration** (`.down.sql`): Contains SQL to rollback the migration

Example migration files are provided in `internal/migrations/files/000001_init_schema.up.sql` and `internal/migrations/files/000001_init_schema.down.sql`.

### Running Migrations on Server Start

You can optionally run migrations automatically when the server starts by adding this to `cmd/server/main.go`:

```go
import "github.com/aithen/go-api/internal/migrations"

func main() {
    // ... existing code ...
    
    // Run migrations before starting server
    if err := migrations.RunMigrations(); err != nil {
        log.Fatalf("Failed to run migrations: %v", err)
    }
    
    // ... rest of the code ...
}
```

## API Endpoints

### Public Endpoints

- `GET /ping` - Health check endpoint
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/ai/chat` - Non-streaming chat endpoint
- `POST /api/ai/chat/stream` - Streaming chat endpoint (SSE)
- `GET /api/ai/personalities` - List all personalities
- `GET /api/ai/personalities/:id` - Get a specific personality

### Protected Endpoints (Require JWT Token)

- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Note:** Protected endpoints require an `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Development

### Project Structure

```
aithen-go-api/
├── cmd/
│   ├── migrate/
│   │   └── main.go          # Migration CLI tool
│   └── server/
│       └── main.go          # Application entry point
├── internal/
│   ├── config/
│   │   └── env.go           # Environment configuration
│   ├── db/
│   │   └── connect.go       # Database connection
│   ├── handlers/
│   │   ├── ai.go            # AI chat handlers
│   │   └── ping.go          # Health check handler
│   ├── migrations/
│   │   ├── migrate.go       # Migration functions
│   │   └── files/           # SQL migration files
│   └── router/
│       └── router.go        # Route setup
├── go.mod                   # Go module dependencies
├── go.sum                   # Dependency checksums
└── README.md                # This file
```

## Troubleshooting

### Database Connection Issues

If you see `❌ Failed to connect to database`, check:
- PostgreSQL is running
- Database credentials are correct in your `.env` file
- Database exists and is accessible

### Port Already in Use

If port `8080` is already in use:
- Change the `PORT` environment variable in your `.env` file
- Or stop the process using port `8080`

### AI Service Not Found

If you get errors connecting to the AI service:
- Ensure the AI service is running on the configured `AI_SERVICE_URL`
- Default is `http://localhost:8000`
- Check the AI service logs for issues

## Dependencies

Main dependencies:
- **Gin** - Web framework
- **pgx/v5** - PostgreSQL driver
- **godotenv** - Environment variable management
- **golang-migrate** - Database migration tool

See `go.mod` for the complete list of dependencies.

