package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// Health check
	r.GET("/ping", handlers.Ping)

	// AI endpoints
	api := r.Group("/api")
	{
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
}
