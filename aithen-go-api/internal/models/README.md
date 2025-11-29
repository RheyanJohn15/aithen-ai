# Models

This directory contains database models for the Aithen Go API. Models are similar to Laravel's Eloquent models but use Go structs with manual database operations.

## Structure

```
models/
├── models.go    # Model registry and initialization
├── user.go      # User model
└── README.md    # This file
```

## Usage

### Basic Example

```go
package handlers

import (
    "context"
    "net/http"
    
    "github.com/aithen/go-api/internal/models"
    "github.com/gin-gonic/gin"
)

func GetUser(c *gin.Context) {
    models := models.NewModels()
    ctx := c.Request.Context()
    
    // Find user by ID
    user, err := models.Users.FindByID(ctx, 1)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, user)
}

func CreateUser(c *gin.Context) {
    var req struct {
        Email string `json:"email"`
        Name  string `json:"name"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    models := models.NewModels()
    ctx := c.Request.Context()
    
    user, err := models.Users.Create(ctx, req.Email, req.Name)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, user)
}
```

## Available Methods

### User Model

- `Create(ctx, email, name string) (*User, error)` - Create a new user
- `FindByID(ctx, id int) (*User, error)` - Find user by ID
- `FindByEmail(ctx, email string) (*User, error)` - Find user by email
- `Update(ctx, id int, email, name string) (*User, error)` - Update user
- `Delete(ctx, id int) error` - Delete user
- `All(ctx) ([]*User, error)` - Get all users

## Creating New Models

1. Create a new file (e.g., `session.go`)
2. Define your struct with JSON and DB tags
3. Create a model struct with DB connection
4. Implement CRUD methods
5. Register in `models.go`

### Example: Creating a Session Model

```go
package models

import (
    "context"
    "time"
    "github.com/jackc/pgx/v5/pgxpool"
)

type Session struct {
    ID          int       `json:"id" db:"id"`
    UserID      int       `json:"user_id" db:"user_id"`
    Personality string    `json:"personality" db:"personality"`
    CreatedAt   time.Time `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type SessionModel struct {
    DB *pgxpool.Pool
}

func NewSessionModel(db *pgxpool.Pool) *SessionModel {
    return &SessionModel{DB: db}
}

func (m *SessionModel) Create(ctx context.Context, userID int, personality string) (*Session, error) {
    query := `
        INSERT INTO chat_sessions (user_id, personality, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, user_id, personality, created_at, updated_at
    `
    
    var session Session
    err := m.DB.QueryRow(ctx, query, userID, personality).Scan(
        &session.ID, &session.UserID, &session.Personality,
        &session.CreatedAt, &session.UpdatedAt,
    )
    
    if err != nil {
        return nil, err
    }
    
    return &session, nil
}

// Add other methods (FindByID, Update, Delete, etc.)
```

Then register it in `models.go`:

```go
type Models struct {
    Users    *UserModel
    Sessions *SessionModel  // Add this
}

func NewModels() *Models {
    return &Models{
        Users:    NewUserModel(db.DB),
        Sessions: NewSessionModel(db.DB),  // Add this
    }
}
```

## Comparison with Laravel

| Laravel | Go (This Setup) |
|---------|-----------------|
| `User::find($id)` | `models.Users.FindByID(ctx, id)` |
| `User::create([...])` | `models.Users.Create(ctx, email, name)` |
| `$user->update([...])` | `models.Users.Update(ctx, id, email, name)` |
| `$user->delete()` | `models.Users.Delete(ctx, id)` |
| `User::all()` | `models.Users.All(ctx)` |

## Alternative: Using GORM (More Laravel-like)

If you prefer a more Laravel-like ORM experience, you can use GORM:

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
```

Then your models would look like:

```go
type User struct {
    ID        uint      `gorm:"primaryKey"`
    Email     string    `gorm:"uniqueIndex;not null"`
    Name      string    `gorm:"not null"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// Usage
db.First(&user, id)
db.Create(&user)
db.Save(&user)
db.Delete(&user)
```

However, the current manual approach gives you more control and is lighter weight.

