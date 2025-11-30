package handlers

import (
	"net/http"

	"github.com/aithen/go-api/internal/models"
	"github.com/gin-gonic/gin"
)

// PublicOrganizationResponse represents the public organization data
type PublicOrganizationResponse struct {
	Name    string `json:"name"`
	LogoURL string `json:"logo_url"`
}

// GetPublicOrganization retrieves public organization data by slug
// This endpoint is public and only returns limited data (name and logo)
// SQL injection is prevented by using parameterized queries in FindBySlug
func GetPublicOrganization(c *gin.Context) {
	slug := c.Param("slug")
	
	// Validate slug is not empty
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Organization slug is required"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Find organization by slug (uses parameterized query - SQL injection safe)
	org, err := m.Organizations.FindBySlug(ctx, slug)
	if err != nil {
		if err == models.ErrOrganizationNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Organization not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve organization"})
		return
	}

	// Return only public data (name and logo)
	response := PublicOrganizationResponse{
		Name:    org.Name,
		LogoURL: org.LogoURL,
	}

	c.JSON(http.StatusOK, response)
}

