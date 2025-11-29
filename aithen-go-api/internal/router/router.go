package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/aithen/go-api/internal/middleware"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// Health check (public)
	r.GET("/ping", handlers.Ping)

	// API routes group
	api := r.Group("/api")

	// Register public auth routes first (before middleware)
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// Apply authentication middleware to all API routes except login and register
	// The middleware will skip auth for /api/auth/login and /api/auth/register
	api.Use(middleware.AuthMiddlewareWithSkip())

	// All routes below require authentication
	{
		// Auth protected routes
		authProtected := api.Group("/auth")
		{
			authProtected.GET("/me", handlers.Me)                 // Get current authenticated user
			authProtected.POST("/refresh", handlers.RefreshToken) // Refresh JWT token
		}

		// AI endpoints (now protected)
		ai := api.Group("/ai")
		{
			// Chat endpoints
			ai.POST("/chat", handlers.Chat)
			ai.POST("/chat/stream", handlers.ChatStreamImproved)

			// Personality endpoints
			ai.GET("/personalities", handlers.GetPersonalities)
			ai.GET("/personalities/:id", handlers.GetPersonality)
		}

		// User management routes
		users := api.Group("/users")
		{
			users.GET("", handlers.GetAllUsers)
			users.GET("/:id", handlers.GetUser)
			users.PUT("/:id", handlers.UpdateUser)
			users.DELETE("/:id", handlers.DeleteUser)
		}

		// Chat routes
		chats := api.Group("/chats")
		{
			chats.POST("", handlers.CreateChat)              // Create new chat
			chats.GET("", handlers.GetChats)                 // Get all chats for user
			chats.GET("/:id", handlers.GetChat)              // Get chat by ID with messages
			chats.PUT("/:id", handlers.UpdateChat)           // Update chat title
			chats.DELETE("/:id", handlers.DeleteChat)        // Delete chat
			chats.POST("/:id/messages", handlers.AddMessage) // Add message to chat
		}
	}
}
