package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupUserRoutes sets up user management routes
func SetupUserRoutes(api *gin.RouterGroup) {
	users := api.Group("/users")
	{
		users.GET("", handlers.GetAllUsers)
		users.GET("/:id", handlers.GetUser)
		users.PUT("/:id", handlers.UpdateUser)
		users.DELETE("/:id", handlers.DeleteUser)
	}
}

