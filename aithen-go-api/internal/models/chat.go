package models

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/aithen/go-api/internal/id"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrChatNotFound = errors.New("chat not found")
)

// Chat represents a chat session in the database
type Chat struct {
	ID        int64     `json:"-" db:"id"`
	UserID    int64     `json:"-" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// MarshalJSON custom marshaling to convert int64 IDs to strings
func (c Chat) MarshalJSON() ([]byte, error) {
	type Alias Chat
	return json.Marshal(&struct {
		ID     string `json:"id"`
		UserID string `json:"user_id"`
		*Alias
	}{
		ID:     fmt.Sprintf("%d", c.ID),
		UserID: fmt.Sprintf("%d", c.UserID),
		Alias:  (*Alias)(&c),
	})
}

// Message represents a message in a chat
type Message struct {
	ID        int64     `json:"-" db:"id"`
	ChatID    int64     `json:"-" db:"chat_id"`
	Role      string    `json:"role" db:"role"`
	Content   string    `json:"content" db:"content"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// MarshalJSON custom marshaling to convert int64 IDs to strings
func (m Message) MarshalJSON() ([]byte, error) {
	type Alias Message
	return json.Marshal(&struct {
		ID     string `json:"id"`
		ChatID string `json:"chat_id"`
		*Alias
	}{
		ID:     fmt.Sprintf("%d", m.ID),
		ChatID: fmt.Sprintf("%d", m.ChatID),
		Alias:  (*Alias)(&m),
	})
}

// ChatModel handles database operations for chats
type ChatModel struct {
	DB *pgxpool.Pool
}

// NewChatModel creates a new ChatModel instance
func NewChatModel(db *pgxpool.Pool) *ChatModel {
	return &ChatModel{DB: db}
}

// Create creates a new chat
func (m *ChatModel) Create(ctx context.Context, userID int64, title string) (*Chat, error) {
	// Generate Snowflake ID
	chatID := id.Generate()

	query := `
		INSERT INTO chats (id, user_id, title, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		RETURNING id, user_id, title, created_at, updated_at
	`

	var chat Chat
	err := m.DB.QueryRow(ctx, query, chatID, userID, title).Scan(
		&chat.ID, &chat.UserID, &chat.Title, &chat.CreatedAt, &chat.UpdatedAt,
	)

	if err != nil {
		// Log the error for debugging
		return nil, fmt.Errorf("failed to create chat: %w (chatID: %d, userID: %d)", err, chatID, userID)
	}

	return &chat, nil
}

// FindByID finds a chat by ID
func (m *ChatModel) FindByID(ctx context.Context, id int64) (*Chat, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM chats
		WHERE id = $1
	`

	fmt.Printf("FindByID: Querying for chat ID: %d\n", id)

	var chat Chat
	err := m.DB.QueryRow(ctx, query, id).Scan(
		&chat.ID, &chat.UserID, &chat.Title, &chat.CreatedAt, &chat.UpdatedAt,
	)

	if err != nil {
		fmt.Printf("FindByID: Error querying chat ID %d: %v\n", id, err)
		return nil, ErrChatNotFound
	}

	fmt.Printf("FindByID: Found chat - ID: %d, UserID: %d\n", chat.ID, chat.UserID)
	return &chat, nil
}

// FindByUserID finds all chats for a user
func (m *ChatModel) FindByUserID(ctx context.Context, userID int64) ([]*Chat, error) {
	query := `
		SELECT id, user_id, title, created_at, updated_at
		FROM chats
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`

	rows, err := m.DB.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var chats []*Chat
	for rows.Next() {
		var chat Chat
		err := rows.Scan(&chat.ID, &chat.UserID, &chat.Title, &chat.CreatedAt, &chat.UpdatedAt)
		if err != nil {
			return nil, err
		}
		chats = append(chats, &chat)
	}

	return chats, rows.Err()
}

// Update updates a chat's title and updated_at
func (m *ChatModel) Update(ctx context.Context, id int64, title string) (*Chat, error) {
	query := `
		UPDATE chats
		SET title = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING id, user_id, title, created_at, updated_at
	`

	var chat Chat
	err := m.DB.QueryRow(ctx, query, title, id).Scan(
		&chat.ID, &chat.UserID, &chat.Title, &chat.CreatedAt, &chat.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &chat, nil
}

// Delete deletes a chat by ID
func (m *ChatModel) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM chats WHERE id = $1`
	_, err := m.DB.Exec(ctx, query, id)
	return err
}

// AddMessage adds a message to a chat
func (m *ChatModel) AddMessage(ctx context.Context, chatID int64, role, content string) (*Message, error) {
	// Generate Snowflake ID
	messageID := id.Generate()

	query := `
		INSERT INTO messages (id, chat_id, role, content, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, chat_id, role, content, created_at
	`

	var message Message
	err := m.DB.QueryRow(ctx, query, messageID, chatID, role, content).Scan(
		&message.ID, &message.ChatID, &message.Role, &message.Content, &message.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Update chat's updated_at timestamp
	_, err = m.DB.Exec(ctx, `UPDATE chats SET updated_at = NOW() WHERE id = $1`, chatID)
	if err != nil {
		// Log error but don't fail the message insertion
	}

	return &message, nil
}

// GetMessages retrieves all messages for a chat
func (m *ChatModel) GetMessages(ctx context.Context, chatID int64) ([]*Message, error) {
	query := `
		SELECT id, chat_id, role, content, created_at
		FROM messages
		WHERE chat_id = $1
		ORDER BY created_at ASC
	`

	rows, err := m.DB.Query(ctx, query, chatID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*Message
	for rows.Next() {
		var message Message
		err := rows.Scan(&message.ID, &message.ChatID, &message.Role, &message.Content, &message.CreatedAt)
		if err != nil {
			return nil, err
		}
		messages = append(messages, &message)
	}

	return messages, rows.Err()
}
