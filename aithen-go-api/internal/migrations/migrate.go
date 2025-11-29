package migrations

import (
	"database/sql"
	"fmt"
	"log"
	"path/filepath"

	"github.com/aithen/go-api/internal/config"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver for database/sql
)

// RunMigrations runs all pending migrations
func RunMigrations() error {
	// Load environment variables
	config.LoadEnv()

	// Build database connection string
	dbUrl := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		config.GetEnv("DB_USER"),
		config.GetEnv("DB_PASS"),
		config.GetEnv("DB_HOST"),
		config.GetEnv("DB_PORT"),
		config.GetEnv("DB_NAME"),
	)

	// Open database connection using pgx driver
	db, err := sql.Open("pgx", dbUrl)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	// Create postgres driver instance
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create postgres driver: %w", err)
	}

	// Get migrations directory path (relative to project root)
	// This assumes the working directory is the project root
	migrationsPath := filepath.Join("internal", "migrations", "files")
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}
	migrationsURL := fmt.Sprintf("file://%s", filepath.ToSlash(absPath))

	// Create migrate instance
	m, err := migrate.NewWithDatabaseInstance(migrationsURL, "postgres", driver)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	// Run migrations
	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			log.Println("✅ No new migrations to run")
			return nil
		}
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("✅ Migrations completed successfully")
	return nil
}

// DownMigrations rolls back the last migration
func DownMigrations() error {
	config.LoadEnv()

	dbUrl := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		config.GetEnv("DB_USER"),
		config.GetEnv("DB_PASS"),
		config.GetEnv("DB_HOST"),
		config.GetEnv("DB_PORT"),
		config.GetEnv("DB_NAME"),
	)

	db, err := sql.Open("pgx", dbUrl)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create postgres driver: %w", err)
	}

	migrationsPath := filepath.Join("internal", "migrations", "files")
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}
	migrationsURL := fmt.Sprintf("file://%s", filepath.ToSlash(absPath))

	m, err := migrate.NewWithDatabaseInstance(migrationsURL, "postgres", driver)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	if err := m.Down(); err != nil {
		if err == migrate.ErrNoChange {
			log.Println("✅ No migrations to rollback")
			return nil
		}
		return fmt.Errorf("failed to rollback migrations: %w", err)
	}

	log.Println("✅ Migration rolled back successfully")
	return nil
}

// GetMigrationVersion returns the current migration version
func GetMigrationVersion() (uint, bool, error) {
	config.LoadEnv()

	dbUrl := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		config.GetEnv("DB_USER"),
		config.GetEnv("DB_PASS"),
		config.GetEnv("DB_HOST"),
		config.GetEnv("DB_PORT"),
		config.GetEnv("DB_NAME"),
	)

	db, err := sql.Open("pgx", dbUrl)
	if err != nil {
		return 0, false, fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return 0, false, fmt.Errorf("failed to create postgres driver: %w", err)
	}

	migrationsPath := filepath.Join("internal", "migrations", "files")
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return 0, false, fmt.Errorf("failed to get absolute path: %w", err)
	}
	migrationsURL := fmt.Sprintf("file://%s", filepath.ToSlash(absPath))

	m, err := migrate.NewWithDatabaseInstance(migrationsURL, "postgres", driver)
	if err != nil {
		return 0, false, fmt.Errorf("failed to create migrate instance: %w", err)
	}

	version, dirty, err := m.Version()
	if err != nil {
		if err == migrate.ErrNilVersion {
			return 0, false, nil
		}
		return 0, false, err
	}

	return version, dirty, nil
}

// FreshMigrations drops all tables and re-runs all migrations (like Laravel's migrate:fresh)
func FreshMigrations() error {
	config.LoadEnv()

	dbUrl := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		config.GetEnv("DB_USER"),
		config.GetEnv("DB_PASS"),
		config.GetEnv("DB_HOST"),
		config.GetEnv("DB_PORT"),
		config.GetEnv("DB_NAME"),
	)

	db, err := sql.Open("pgx", dbUrl)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	log.Println("🔄 Dropping all tables...")

	// Drop all tables in the public schema
	// This query gets all table names and drops them
	dropTablesQuery := `
		DO $$ DECLARE
			r RECORD;
		BEGIN
			FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
				EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
			END LOOP;
		END $$;
	`

	_, err = db.Exec(dropTablesQuery)
	if err != nil {
		return fmt.Errorf("failed to drop tables: %w", err)
	}

	log.Println("✅ All tables dropped")

	// Now run migrations
	log.Println("🔄 Running migrations...")
	return RunMigrations()
}

// ForceVersion forces the database to a specific migration version (clears dirty flag)
func ForceVersion(version int) error {
	config.LoadEnv()

	dbUrl := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		config.GetEnv("DB_USER"),
		config.GetEnv("DB_PASS"),
		config.GetEnv("DB_HOST"),
		config.GetEnv("DB_PORT"),
		config.GetEnv("DB_NAME"),
	)

	db, err := sql.Open("pgx", dbUrl)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("failed to create postgres driver: %w", err)
	}

	migrationsPath := filepath.Join("internal", "migrations", "files")
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("failed to get absolute path: %w", err)
	}
	migrationsURL := fmt.Sprintf("file://%s", filepath.ToSlash(absPath))

	m, err := migrate.NewWithDatabaseInstance(migrationsURL, "postgres", driver)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}

	if err := m.Force(version); err != nil {
		return fmt.Errorf("failed to force version: %w", err)
	}

	log.Printf("✅ Forced database version to %d (dirty flag cleared)", version)
	return nil
}
