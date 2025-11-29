package models

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/aithen/go-api/internal/id"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
)

// User represents a user in the database
type User struct {
	ID        int64     `json:"-" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      string    `json:"name" db:"name"`
	Password  string    `json:"-" db:"password"` // Hidden from JSON
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// MarshalJSON custom marshaling to convert int64 ID to string
func (u User) MarshalJSON() ([]byte, error) {
	type Alias User
	return json.Marshal(&struct {
		ID string `json:"id"`
		*Alias
	}{
		ID:    fmt.Sprintf("%d", u.ID),
		Alias: (*Alias)(&u),
	})
}

// UserModel handles database operations for users
type UserModel struct {
	DB *pgxpool.Pool
}

// NewUserModel creates a new UserModel instance
func NewUserModel(db *pgxpool.Pool) *UserModel {
	return &UserModel{DB: db}
}

// Create creates a new user with hashed password
func (m *UserModel) Create(ctx context.Context, email, name, password string) (*User, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Generate Snowflake ID
	id := id.Generate()

	query := `
		INSERT INTO users (id, email, name, password, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
		RETURNING id, email, name, created_at, updated_at
	`

	var user User
	err = m.DB.QueryRow(ctx, query, id, email, name, string(hashedPassword)).Scan(
		&user.ID, &user.Email, &user.Name, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w (userID: %d, email: %s)", err, id, email)
	}

	return &user, nil
}

// Authenticate verifies user credentials and returns the user
func (m *UserModel) Authenticate(ctx context.Context, email, password string) (*User, error) {
	query := `
		SELECT id, email, name, password, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user User
	err := m.DB.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Name, &user.Password, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Don't return password hash
	user.Password = ""
	return &user, nil
}

// FindByID finds a user by ID
func (m *UserModel) FindByID(ctx context.Context, id int64) (*User, error) {
	query := `
		SELECT id, email, name, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user User
	err := m.DB.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.Name, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// FindByEmail finds a user by email (without password)
func (m *UserModel) FindByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, email, name, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user User
	err := m.DB.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.Name, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, ErrUserNotFound
	}

	return &user, nil
}

// Update updates a user
func (m *UserModel) Update(ctx context.Context, id int64, email, name string) (*User, error) {
	query := `
		UPDATE users
		SET email = $1, name = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING id, email, name, created_at, updated_at
	`

	var user User
	err := m.DB.QueryRow(ctx, query, email, name, id).Scan(
		&user.ID, &user.Email, &user.Name, &user.CreatedAt, &user.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// Delete deletes a user by ID
func (m *UserModel) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := m.DB.Exec(ctx, query, id)
	return err
}

// All retrieves all users
func (m *UserModel) All(ctx context.Context) ([]*User, error) {
	query := `
		SELECT id, email, name, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`

	rows, err := m.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		var user User
		err := rows.Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt, &user.UpdatedAt)
		if err != nil {
			return nil, err
		}
		users = append(users, &user)
	}

	return users, rows.Err()
}
