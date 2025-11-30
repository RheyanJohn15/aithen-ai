package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupChatRoutes sets up chat management routes
func SetupChatRoutes(api *gin.RouterGroup) {
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

