package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupPublicOrganizationRoutes sets up public organization routes (no auth required)
func SetupPublicOrganizationRoutes(r *gin.Engine) {
	// Public organization endpoint (no auth required)
	r.GET("/api/orgs/:slug", handlers.GetPublicOrganization)
}

// SetupOrganizationRoutes sets up organization management routes (require authentication)
// This can be expanded in the future for organization CRUD operations
func SetupOrganizationRoutes(api *gin.RouterGroup) {
	// Future organization management routes can be added here
	// Example:
	// orgs := api.Group("/orgs")
	// {
	//     orgs.GET("", handlers.GetOrganizations)
	//     orgs.GET("/:id", handlers.GetOrganization)
	//     orgs.PUT("/:id", handlers.UpdateOrganization)
	//     orgs.DELETE("/:id", handlers.DeleteOrganization)
	// }
}

