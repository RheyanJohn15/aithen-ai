package db

import (
    "context"
    "fmt"
    "log"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/aithen/go-api/internal/config"
)

var DB *pgxpool.Pool

func Connect() {
    dbUrl := fmt.Sprintf(
        "postgres://%s:%s@%s:%s/%s",
        config.GetEnv("DB_USER"),
        config.GetEnv("DB_PASS"),
        config.GetEnv("DB_HOST"),
        config.GetEnv("DB_PORT"),
        config.GetEnv("DB_NAME"),
    )

    pool, err := pgxpool.New(context.Background(), dbUrl)
    if err != nil {
        log.Fatalf("❌ Failed to connect to database: %v", err)
    }

    DB = pool
    log.Println("✅ Database connected")
}
