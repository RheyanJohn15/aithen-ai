package models

import (
	"github.com/aithen/go-api/internal/db"
)

// Models holds all model instances
type Models struct {
	Users         *UserModel
	Chats         *ChatModel
	Organizations *OrganizationModel
	// Add other models here as you create them
	// Sessions *SessionModel
	// Messages *MessageModel
}

// NewModels creates a new Models instance with all model instances
func NewModels() *Models {
	return &Models{
		Users:         NewUserModel(db.DB),
		Chats:         NewChatModel(db.DB),
		Organizations: NewOrganizationModel(db.DB),
		// Initialize other models here
		// Sessions: NewSessionModel(db.DB),
		// Messages: NewMessageModel(db.DB),
	}
}
