package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/aithen/go-api/internal/websocket"
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

	// Setup WebSocket routes before middleware (they handle their own auth)
	SetupWebSocketRoutes(api)

	// Apply authentication middleware to all API routes
	// The middleware will skip auth for /api/auth/login, /api/auth/register, and /api/ws
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

		// Knowledge base management routes
		SetupKnowledgeBaseRoutes(api)
	}
}

// setupPublicRoutes sets up routes that don't require authentication
func setupPublicRoutes(r *gin.Engine) {
	// Health check
	r.GET("/ping", handlers.Ping)

	// Public organization routes
	SetupPublicOrganizationRoutes(r)
}

// SetupWebSocketRoutes sets up WebSocket routes
func SetupWebSocketRoutes(api *gin.RouterGroup) {
	hub := websocket.NewHub()
	go hub.Run()

	api.GET("/ws", websocket.HandleWebSocket(hub))
}
