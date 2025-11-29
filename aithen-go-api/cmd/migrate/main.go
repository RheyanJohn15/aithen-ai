package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/aithen/go-api/internal/migrations"
)

func main() {
	var (
		command = flag.String("command", "up", "Migration command: up, down, version, create, fresh, force")
		name    = flag.String("name", "", "Name for new migration (required for create command)")
		version = flag.Int("version", -1, "Version number (required for force command)")
	)
	flag.Parse()

	switch *command {
	case "up":
		if err := migrations.RunMigrations(); err != nil {
			log.Fatalf("❌ Migration failed: %v", err)
		}
	case "down":
		if err := migrations.DownMigrations(); err != nil {
			log.Fatalf("❌ Rollback failed: %v", err)
		}
	case "fresh":
		if err := migrations.FreshMigrations(); err != nil {
			log.Fatalf("❌ Fresh migration failed: %v", err)
		}
	case "version":
		version, dirty, err := migrations.GetMigrationVersion()
		if err != nil {
			log.Fatalf("❌ Failed to get version: %v", err)
		}
		if dirty {
			log.Printf("⚠️  Current version: %d (dirty)", version)
		} else {
			log.Printf("✅ Current version: %d", version)
		}
	case "create":
		if *name == "" {
			log.Fatal("❌ Migration name is required. Use -name flag")
		}
		if err := createMigrationFiles(*name); err != nil {
			log.Fatalf("❌ Failed to create migration files: %v", err)
		}
		log.Printf("✅ Created migration files for: %s", *name)
	case "force":
		if *version < 0 {
			log.Fatal("❌ Version number is required. Use -version flag (e.g., -version 2)")
		}
		if err := migrations.ForceVersion(*version); err != nil {
			log.Fatalf("❌ Failed to force version: %v", err)
		}
	default:
		log.Fatalf("❌ Unknown command: %s. Use: up, down, fresh, version, create, or force", *command)
	}
}

func createMigrationFiles(name string) error {
	migrationsDir := "internal/migrations/files"

	// Ensure directory exists
	if err := os.MkdirAll(migrationsDir, 0755); err != nil {
		return fmt.Errorf("failed to create migrations directory: %w", err)
	}

	// Get the next migration version number
	nextVersion, err := getNextMigrationVersion(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to get next migration version: %w", err)
	}

	// Convert name to snake_case and sanitize
	sanitizedName := sanitizeMigrationName(name)

	// Format version number with leading zeros (6 digits)
	versionStr := fmt.Sprintf("%06d", nextVersion)

	// Create file names
	upFileName := fmt.Sprintf("%s_%s.up.sql", versionStr, sanitizedName)
	downFileName := fmt.Sprintf("%s_%s.down.sql", versionStr, sanitizedName)

	upFilePath := filepath.Join(migrationsDir, upFileName)
	downFilePath := filepath.Join(migrationsDir, downFileName)

	// Create up migration file
	upContent := fmt.Sprintf(`-- Migration: %s
-- Created: %s

-- Add your migration SQL here
-- Example:
-- CREATE TABLE IF NOT EXISTS example_table (
--     id SERIAL PRIMARY KEY,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
`, name, getCurrentTimestamp())

	if err := os.WriteFile(upFilePath, []byte(upContent), 0644); err != nil {
		return fmt.Errorf("failed to create up migration file: %w", err)
	}

	// Create down migration file
	downContent := fmt.Sprintf(`-- Rollback: %s

-- Add your rollback SQL here
-- Example:
-- DROP TABLE IF EXISTS example_table;
`, name)

	if err := os.WriteFile(downFilePath, []byte(downContent), 0644); err != nil {
		// Clean up up file if down file creation fails
		os.Remove(upFilePath)
		return fmt.Errorf("failed to create down migration file: %w", err)
	}

	log.Printf("✅ Created migration files:")
	log.Printf("   📄 %s", upFilePath)
	log.Printf("   📄 %s", downFilePath)

	return nil
}

// getNextMigrationVersion finds the highest version number in existing migrations
func getNextMigrationVersion(migrationsDir string) (int, error) {
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return 1, nil // If directory doesn't exist or is empty, start at 1
	}

	maxVersion := 0
	versionRegex := regexp.MustCompile(`^(\d+)_`)

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		matches := versionRegex.FindStringSubmatch(file.Name())
		if len(matches) > 1 {
			version, err := strconv.Atoi(matches[1])
			if err == nil && version > maxVersion {
				maxVersion = version
			}
		}
	}

	return maxVersion + 1, nil
}

// sanitizeMigrationName converts a name to snake_case and removes invalid characters
func sanitizeMigrationName(name string) string {
	// Convert to lowercase
	name = strings.ToLower(name)

	// Replace spaces and special characters with underscores
	reg := regexp.MustCompile(`[^a-z0-9_]+`)
	name = reg.ReplaceAllString(name, "_")

	// Remove leading/trailing underscores and multiple consecutive underscores
	name = strings.Trim(name, "_")
	reg = regexp.MustCompile(`_+`)
	name = reg.ReplaceAllString(name, "_")

	return name
}

// getCurrentTimestamp returns current timestamp in a readable format
func getCurrentTimestamp() string {
	return time.Now().Format("2006-01-02 15:04:05")
}
