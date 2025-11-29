package middleware

import (
	"net/http"

	"github.com/aithen/go-api/internal/auth"
	"github.com/aithen/go-api/internal/models"
	"github.com/gin-gonic/gin"
)

// Public routes that don't require authentication
var publicRoutes = []string{
	"/api/auth/login",
	"/api/auth/register",
}

// isPublicRoute checks if the current route is a public route
func isPublicRoute(path string) bool {
	for _, publicRoute := range publicRoutes {
		if path == publicRoute {
			return true
		}
	}
	return false
}

// AuthMiddleware validates JWT token and sets user in context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString, err := auth.ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}

// AuthMiddlewareWithSkip validates JWT token but skips authentication for public routes
func AuthMiddlewareWithSkip() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if this is a public route
		if isPublicRoute(c.Request.URL.Path) {
			c.Next()
			return
		}

		// For all other routes, require authentication
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString, err := auth.ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}

// OptionalAuthMiddleware validates JWT token if present but doesn't require it
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString, err := auth.ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.Next()
			return
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		// Set user info in context if token is valid
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)

		c.Next()
	}
}

// GetUserID gets user ID from context (must be used after AuthMiddleware)
func GetUserID(c *gin.Context) (int64, error) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, gin.Error{}
	}

	id, ok := userID.(int64)
	if !ok {
		return 0, gin.Error{}
	}

	return id, nil
}

// GetUserFromContext gets the full user object from context
func GetUserFromContext(c *gin.Context) (*models.User, error) {
	userID, err := GetUserID(c)
	if err != nil {
		return nil, err
	}

	models := models.NewModels()
	ctx := c.Request.Context()

	user, err := models.Users.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// RequireRole checks if user has required role (for future role-based access)
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// This is a placeholder for role-based access control
		// You can extend this when you add roles to your user model
		c.Next()
	}
}

