package websocket

import (
	"net/http"

	"github.com/aithen/go-api/internal/auth"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for now - adjust in production
		return true
	},
}

// HandleWebSocket handles WebSocket connections with authentication
func HandleWebSocket(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		channel := c.Query("channel")
		if channel == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "channel parameter is required"})
			return
		}

		// Check if user is already authenticated (from middleware)
		userID, alreadyAuthenticated := c.Get("user_id")

		// If not authenticated by middleware, authenticate here
		if !alreadyAuthenticated {
			// Authenticate: Check for token in Authorization header or token query param
			var tokenString string

			// First try Authorization header
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" {
				var err error
				tokenString, err = auth.ExtractTokenFromHeader(authHeader)
				if err != nil {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
					return
				}
			} else {
				// Fallback to token query parameter
				tokenString = c.Query("token")
				if tokenString == "" {
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
					return
				}
			}

			// Validate token
			claims, err := auth.ValidateToken(tokenString)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
				return
			}

			// Set user info in context
			c.Set("user_id", claims.UserID)
			c.Set("user_email", claims.Email)
		} else {
			// User already authenticated by middleware
			_ = userID // Use the existing user ID from context
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to upgrade connection"})
			return
		}

		ServeWs(hub, conn, channel)
	}
}
