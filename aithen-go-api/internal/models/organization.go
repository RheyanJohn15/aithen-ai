package models

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/aithen/go-api/internal/id"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrOrganizationNotFound = errors.New("organization not found")
	ErrSlugAlreadyExists    = errors.New("organization slug already exists")
)

// Organization represents an organization in the database
type Organization struct {
	ID          int64     `json:"-" db:"id"`
	Name        string    `json:"name" db:"name"`
	Slug        string    `json:"slug" db:"slug"`
	Description string    `json:"description" db:"description"`
	LogoURL     string    `json:"logo_url" db:"logo_url"`
	Website     string    `json:"website" db:"website"`
	Email       string    `json:"email" db:"email"`
	Phone       string    `json:"phone" db:"phone"`
	Address     string    `json:"address" db:"address"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// MarshalJSON custom marshaling to convert int64 ID to string
func (o Organization) MarshalJSON() ([]byte, error) {
	type Alias Organization
	return json.Marshal(&struct {
		ID string `json:"id"`
		*Alias
	}{
		ID:    fmt.Sprintf("%d", o.ID),
		Alias: (*Alias)(&o),
	})
}

// OrganizationMember represents a user's membership in an organization
type OrganizationMember struct {
	ID             int64     `json:"-" db:"id"`
	OrganizationID int64     `json:"-" db:"organization_id"`
	UserID         int64     `json:"-" db:"user_id"`
	Role           string    `json:"role" db:"role"`
	Status         string    `json:"status" db:"status"`
	JoinedAt       time.Time `json:"joined_at" db:"joined_at"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" db:"updated_at"`
}

// MarshalJSON custom marshaling to convert int64 IDs to strings
func (om OrganizationMember) MarshalJSON() ([]byte, error) {
	type Alias OrganizationMember
	return json.Marshal(&struct {
		ID             string `json:"id"`
		OrganizationID string `json:"organization_id"`
		UserID         string `json:"user_id"`
		*Alias
	}{
		ID:             fmt.Sprintf("%d", om.ID),
		OrganizationID: fmt.Sprintf("%d", om.OrganizationID),
		UserID:         fmt.Sprintf("%d", om.UserID),
		Alias:          (*Alias)(&om),
	})
}

// OrganizationModel handles database operations for organizations
type OrganizationModel struct {
	DB *pgxpool.Pool
}

// NewOrganizationModel creates a new OrganizationModel instance
func NewOrganizationModel(db *pgxpool.Pool) *OrganizationModel {
	return &OrganizationModel{DB: db}
}

// GenerateSlug generates a URL-friendly slug from a name
func GenerateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.TrimSpace(slug)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")
	// Remove special characters except hyphens
	var result strings.Builder
	for _, char := range slug {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '-' {
			result.WriteRune(char)
		}
	}
	slug = result.String()
	// Remove multiple consecutive hyphens
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	slug = strings.Trim(slug, "-")
	// Ensure slug is not empty
	if slug == "" {
		slug = "org"
	}
	return slug
}

// GenerateUniqueSlug generates a unique slug by checking the database and appending a number if needed
func (m *OrganizationModel) GenerateUniqueSlug(ctx context.Context, baseSlug string) (string, error) {
	slug := GenerateSlug(baseSlug)
	originalSlug := slug
	counter := 1

	// Check if slug exists, if so append a number
	for {
		_, err := m.FindBySlug(ctx, slug)
		if err != nil {
			// Slug doesn't exist, it's available
			return slug, nil
		}
		// Slug exists, try with a number appended
		slug = fmt.Sprintf("%s-%d", originalSlug, counter)
		counter++
		// Prevent infinite loop (max 1000 attempts)
		if counter > 1000 {
			return "", fmt.Errorf("unable to generate unique slug after 1000 attempts")
		}
	}
}

// Create creates a new organization
func (m *OrganizationModel) Create(ctx context.Context, name, slug, description, logoURL, website, email, phone, address string) (*Organization, error) {
	// Generate Snowflake ID
	orgID := id.Generate()

	query := `
		INSERT INTO organizations (id, name, slug, description, logo_url, website, email, phone, address, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING id, name, slug, description, logo_url, website, email, phone, address, created_at, updated_at
	`

	var org Organization
	err := m.DB.QueryRow(ctx, query, orgID, name, slug, description, logoURL, website, email, phone, address).Scan(
		&org.ID, &org.Name, &org.Slug, &org.Description, &org.LogoURL, &org.Website, &org.Email, &org.Phone, &org.Address, &org.CreatedAt, &org.UpdatedAt,
	)

	if err != nil {
		// Check if it's a unique constraint violation
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			return nil, ErrSlugAlreadyExists
		}
		return nil, fmt.Errorf("failed to create organization: %w", err)
	}

	return &org, nil
}

// FindByID finds an organization by ID
func (m *OrganizationModel) FindByID(ctx context.Context, id int64) (*Organization, error) {
	query := `
		SELECT id, name, slug, description, logo_url, website, email, phone, address, created_at, updated_at
		FROM organizations
		WHERE id = $1
	`

	var org Organization
	err := m.DB.QueryRow(ctx, query, id).Scan(
		&org.ID, &org.Name, &org.Slug, &org.Description, &org.LogoURL, &org.Website, &org.Email, &org.Phone, &org.Address, &org.CreatedAt, &org.UpdatedAt,
	)

	if err != nil {
		return nil, ErrOrganizationNotFound
	}

	return &org, nil
}

// FindBySlug finds an organization by slug
func (m *OrganizationModel) FindBySlug(ctx context.Context, slug string) (*Organization, error) {
	query := `
		SELECT id, name, slug, description, logo_url, website, email, phone, address, created_at, updated_at
		FROM organizations
		WHERE slug = $1
	`

	var org Organization
	err := m.DB.QueryRow(ctx, query, slug).Scan(
		&org.ID, &org.Name, &org.Slug, &org.Description, &org.LogoURL, &org.Website, &org.Email, &org.Phone, &org.Address, &org.CreatedAt, &org.UpdatedAt,
	)

	if err != nil {
		return nil, ErrOrganizationNotFound
	}

	return &org, nil
}

// AddMember adds a user to an organization
func (m *OrganizationModel) AddMember(ctx context.Context, organizationID, userID int64, role, status string) (*OrganizationMember, error) {
	// Generate Snowflake ID
	memberID := id.Generate()

	query := `
		INSERT INTO organization_members (id, organization_id, user_id, role, status, joined_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
		RETURNING id, organization_id, user_id, role, status, joined_at, created_at, updated_at
	`

	var member OrganizationMember
	err := m.DB.QueryRow(ctx, query, memberID, organizationID, userID, role, status).Scan(
		&member.ID, &member.OrganizationID, &member.UserID, &member.Role, &member.Status, &member.JoinedAt, &member.CreatedAt, &member.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to add member: %w", err)
	}

	return &member, nil
}

// GetUserOrganizations gets all organizations a user belongs to
func (m *OrganizationModel) GetUserOrganizations(ctx context.Context, userID int64) ([]*Organization, error) {
	query := `
		SELECT o.id, o.name, o.slug, o.description, o.logo_url, o.website, o.email, o.phone, o.address, o.created_at, o.updated_at
		FROM organizations o
		INNER JOIN organization_members om ON o.id = om.organization_id
		WHERE om.user_id = $1 AND om.status = 'active'
		ORDER BY o.created_at DESC
	`

	rows, err := m.DB.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orgs []*Organization
	for rows.Next() {
		var org Organization
		err := rows.Scan(
			&org.ID, &org.Name, &org.Slug, &org.Description, &org.LogoURL, &org.Website, &org.Email, &org.Phone, &org.Address, &org.CreatedAt, &org.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		orgs = append(orgs, &org)
	}

	return orgs, rows.Err()
}
