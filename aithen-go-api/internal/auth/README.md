# JWT Authentication

This package handles JWT token generation and validation for the Aithen Go API.

## Features

- JWT token generation with configurable expiration (default: 24 hours)
- Token validation and parsing
- Secure password hashing using bcrypt
- Token extraction from Authorization header

## Configuration

Add to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**⚠️ Important:** Use a strong, random secret key in production. Generate one using:

```bash
# Linux/macOS
openssl rand -base64 32

# Or use an online generator
```

## Usage

### Generate Token

```go
import "github.com/aithen/go-api/internal/auth"

token, err := auth.GenerateToken(userID, email)
if err != nil {
    // Handle error
}
```

### Validate Token

```go
claims, err := auth.ValidateToken(tokenString)
if err != nil {
    // Token is invalid or expired
}

// Access user info
userID := claims.UserID
email := claims.Email
```

### Extract Token from Header

```go
authHeader := c.GetHeader("Authorization")
token, err := auth.ExtractTokenFromHeader(authHeader)
```

## Token Structure

The JWT token contains:

```json
{
  "user_id": 1,
  "email": "user@example.com",
  "exp": 1234567890,
  "iat": 1234567890,
  "nbf": 1234567890,
  "iss": "aithen-api",
  "sub": "user@example.com"
}
```

## Security Notes

1. **JWT Secret**: Always use a strong, random secret key
2. **HTTPS**: Always use HTTPS in production to protect tokens in transit
3. **Token Expiration**: Tokens expire after 24 hours by default
4. **Password Hashing**: Passwords are hashed using bcrypt with default cost

## API Endpoints

### Register
```
POST /api/auth/register
Body: { "email": "user@example.com", "name": "John Doe", "password": "password123" }
Response: { "user": {...}, "token": "jwt-token-here" }
```

### Login
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password123" }
Response: { "user": {...}, "token": "jwt-token-here" }
```

### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { "id": 1, "email": "user@example.com", "name": "John Doe", ... }
```

### Refresh Token
```
POST /api/auth/refresh
Headers: Authorization: Bearer <token>
Response: { "token": "new-jwt-token-here" }
```

