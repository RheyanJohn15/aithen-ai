package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"github.com/aithen/go-api/internal/auth"
	"github.com/aithen/go-api/internal/config"
	"github.com/aithen/go-api/internal/db"
	"github.com/aithen/go-api/internal/router"
)

func main() {
	// Load environment variables
	config.LoadEnv()

	// Initialize JWT with secret from environment
	jwtSecret := config.GetEnv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-in-production"
		log.Println("⚠️  JWT_SECRET not set, using default (change in production!)")
	}
	auth.SetDefaultJWTSecret(jwtSecret)

	// Connect to the database
	db.Connect()

	// Create gin engine
	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Register routes
	router.SetupRoutes(r)

	// Start server
	port := config.GetEnv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("🚀 Server running on port " + port)
	r.Run(":" + port)
}
