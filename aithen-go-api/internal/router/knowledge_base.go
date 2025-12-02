package router

import (
	"github.com/aithen/go-api/internal/handlers"
	"github.com/gin-gonic/gin"
)

// SetupKnowledgeBaseRoutes sets up knowledge base management routes
func SetupKnowledgeBaseRoutes(api *gin.RouterGroup) {
	// Knowledge bases scoped to organizations
	// Note: Using :slug to match existing /api/orgs/:slug route pattern
	kb := api.Group("/orgs/:slug/knowledge-bases")
	{
		kb.GET("", handlers.GetKnowledgeBases)
		kb.POST("", handlers.CreateKnowledgeBase)
		kb.GET("/:id", handlers.GetKnowledgeBase)
		kb.PUT("/:id", handlers.UpdateKnowledgeBase)
		kb.DELETE("/:id", handlers.DeleteKnowledgeBase)
		kb.GET("/:id/files", handlers.GetKnowledgeBaseFiles)
		kb.POST("/:id/files", handlers.UploadKnowledgeBaseFiles)
		kb.DELETE("/:id/files/:file_id", handlers.DeleteKnowledgeBaseFile)
		kb.POST("/:id/train", handlers.TrainKnowledgeBase)
		kb.GET("/:id/versions", handlers.GetKnowledgeBaseVersions)
		kb.DELETE("/:id/versions/:version_id", handlers.DeleteKnowledgeBaseVersion)
	}
}
