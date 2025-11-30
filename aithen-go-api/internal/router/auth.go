package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/aithen/go-api/internal/middleware"
	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes sets up authentication-related routes
// This function sets up both public and protected auth routes
// Public routes are registered first, then middleware is applied
func SetupAuthRoutes(api *gin.RouterGroup) {
	// Public auth routes (no authentication required)
	// These must be registered before middleware is applied
	authPublic := api.Group("/auth")
	{
		authPublic.POST("/register", handlers.Register)
		authPublic.POST("/login", handlers.Login)
	}
}

// SetupProtectedAuthRoutes sets up protected authentication routes
// This should be called after middleware is applied
func SetupProtectedAuthRoutes(api *gin.RouterGroup) {
	authProtected := api.Group("/auth")
	{
		authProtected.GET("/me", handlers.Me)                 // Get current authenticated user
		authProtected.POST("/refresh", handlers.RefreshToken) // Refresh JWT token
	}
}

// ApplyAuthMiddleware applies authentication middleware to the API group
// The middleware will skip auth for /api/auth/login and /api/auth/register
func ApplyAuthMiddleware(api *gin.RouterGroup) {
	api.Use(middleware.AuthMiddlewareWithSkip())
}

