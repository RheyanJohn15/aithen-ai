package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupAIRoutes sets up AI-related routes (chat, personalities, etc.)
func SetupAIRoutes(api *gin.RouterGroup) {
	ai := api.Group("/ai")
	{
		// Chat endpoints
		ai.POST("/chat", handlers.Chat)
		ai.POST("/chat/stream", handlers.ChatStreamImproved)

		// Personality endpoints
		ai.GET("/personalities", handlers.GetPersonalities)
		ai.GET("/personalities/:id", handlers.GetPersonality)
	}
}

