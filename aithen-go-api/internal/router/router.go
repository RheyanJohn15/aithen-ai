package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupRoutes is the main entry point for setting up all routes
// It organizes routes by domain and applies appropriate middleware
func SetupRoutes(r *gin.Engine) {
	// Public routes (no authentication required)
	setupPublicRoutes(r)

	// API routes group
	api := r.Group("/api")

	// Setup public authentication routes first (before middleware)
	SetupAuthRoutes(api)

	// Apply authentication middleware to all API routes
	// The middleware will skip auth for /api/auth/login and /api/auth/register
	ApplyAuthMiddleware(api)

	// All routes below require authentication
	{
		// Protected authentication routes
		SetupProtectedAuthRoutes(api)

		// AI routes
		SetupAIRoutes(api)

		// User management routes
		SetupUserRoutes(api)

		// Chat management routes
		SetupChatRoutes(api)

		// Organization management routes (future expansion)
		SetupOrganizationRoutes(api)
	}
}

// setupPublicRoutes sets up routes that don't require authentication
func setupPublicRoutes(r *gin.Engine) {
	// Health check
	r.GET("/ping", handlers.Ping)

	// Public organization routes
	SetupPublicOrganizationRoutes(r)
}
