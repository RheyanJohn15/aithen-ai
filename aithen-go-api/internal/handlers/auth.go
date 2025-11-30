package handlers

import (
	"net/http"

	"github.com/aithen/go-api/internal/auth"
	"github.com/aithen/go-api/internal/models"
	"github.com/gin-gonic/gin"
)

// RegisterRequest represents registration request
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required,min=2"`
	Password string `json:"password" binding:"required,min=6"`
	// Organization fields
	OrganizationName        string `json:"organization_name" binding:"required,min=2"`
	OrganizationSlug        string `json:"organization_slug"`
	OrganizationDescription string `json:"organization_description"`
	OrganizationWebsite     string `json:"organization_website"`
	OrganizationEmail       string `json:"organization_email"`
	OrganizationPhone       string `json:"organization_phone"`
	OrganizationAddress     string `json:"organization_address"`
	OrganizationLogoURL     string `json:"organization_logo_url"`
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	User  *models.User `json:"user"`
	Token string       `json:"token"`
}

// Register handles user registration with organization creation
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Check if user already exists
	_, err := m.Users.FindByEmail(ctx, req.Email)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User with this email already exists"})
		return
	}

	// Generate organization slug if not provided, ensuring uniqueness
	orgSlug := req.OrganizationSlug
	if orgSlug == "" {
		// Auto-generate unique slug
		generatedSlug, err := m.Organizations.GenerateUniqueSlug(ctx, req.OrganizationName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate organization slug"})
			return
		}
		orgSlug = generatedSlug
	} else {
		// User provided slug - validate it's unique
		_, err = m.Organizations.FindBySlug(ctx, orgSlug)
		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Organization with this slug already exists. Please choose a different slug."})
			return
		}
	}

	// Start transaction (we'll use a simple approach - create user first, then org, then member)
	// Create user
	user, err := m.Users.Create(ctx, req.Email, req.Name, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Create organization
	org, err := m.Organizations.Create(ctx, req.OrganizationName, orgSlug, req.OrganizationDescription,
		req.OrganizationLogoURL, req.OrganizationWebsite, req.OrganizationEmail, req.OrganizationPhone, req.OrganizationAddress)
	if err != nil {
		if err == models.ErrSlugAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": "Organization slug already exists. Please choose a different name."})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create organization"})
		return
	}

	// Add user as owner of the organization
	_, err = m.Organizations.AddMember(ctx, org.ID, user.ID, "owner", "active")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add user to organization"})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		User:  user,
		Token: token,
	})
}

// Login handles user login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	// Authenticate user
	user, err := m.Users.Authenticate(ctx, req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		User:  user,
		Token: token,
	})
}

// Me returns the current authenticated user
func Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	m := models.NewModels()
	ctx := c.Request.Context()

	id := userID.(int64)
	user, err := m.Users.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// RefreshToken refreshes the JWT token
func RefreshToken(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	email, exists := c.Get("user_email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := userID.(int64)
	emailStr := email.(string)

	// Generate new token
	token, err := auth.GenerateToken(id, emailStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}
