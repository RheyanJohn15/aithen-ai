package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/aithen/go-api/internal/models"
	"github.com/gin-gonic/gin"
)

// CreateChatRequest represents request to create a new chat
type CreateChatRequest struct {
	Title string `json:"title,omitempty"`
}

// CreateChat handles creating a new chat
func CreateChat(c *gin.Context) {
	var req CreateChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	models := models.NewModels()
	ctx := c.Request.Context()

	// Use provided title or default to empty string
	title := req.Title
	if title == "" {
		title = "New Chat"
	}

	// Create chat
	chat, err := models.Chats.Create(ctx, userID.(int64), title)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create chat",
			"details": err.Error(),
		})
		return
	}

	// Log for debugging
	fmt.Printf("CreateChat: Created chat - ID: %d, UserID: %d, Title: %s\n", chat.ID, chat.UserID, chat.Title)

	c.JSON(http.StatusCreated, chat)
}

// GetChat handles getting a chat by ID
func GetChat(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	models := models.NewModels()
	ctx := c.Request.Context()

	// Parse chat ID
	id, err := strconv.ParseInt(chatID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chat ID"})
		return
	}

	// Log for debugging
	fmt.Printf("GetChat: Looking for chat ID: %d, User ID: %d\n", id, userID.(int64))

	// Get chat
	chat, err := models.Chats.FindByID(ctx, id)
	if err != nil {
		fmt.Printf("GetChat: Chat not found - ID: %d, Error: %v\n", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	fmt.Printf("GetChat: Found chat - ID: %d, UserID: %d\n", chat.ID, chat.UserID)

	// Verify chat belongs to user
	if chat.UserID != userID.(int64) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Get messages for this chat
	messages, err := models.Chats.GetMessages(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"chat":     chat,
		"messages": messages,
	})
}

// AddMessageRequest represents request to add a message to a chat
type AddMessageRequest struct {
	Role    string `json:"role" binding:"required"`
	Content string `json:"content" binding:"required"`
}

// AddMessage handles adding a message to a chat
func AddMessage(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	var req AddMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role
	if req.Role != "user" && req.Role != "assistant" && req.Role != "system" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Must be 'user', 'assistant', or 'system'"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	models := models.NewModels()
	ctx := c.Request.Context()

	// Parse chat ID
	id, err := strconv.ParseInt(chatID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chat ID"})
		return
	}

	// Verify chat exists and belongs to user
	chat, err := models.Chats.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	if chat.UserID != userID.(int64) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Add message to chat
	message, err := models.Chats.AddMessage(ctx, id, req.Role, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add message"})
		return
	}

	c.JSON(http.StatusCreated, message)
}

// GetChats handles getting all chats for the current user
func GetChats(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	models := models.NewModels()
	ctx := c.Request.Context()

	// Get all chats for user
	chats, err := models.Chats.FindByUserID(ctx, userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chats"})
		return
	}

	c.JSON(http.StatusOK, chats)
}

// UpdateChat handles updating a chat's title
func UpdateChat(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	var req CreateChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	models := models.NewModels()
	ctx := c.Request.Context()

	// Parse chat ID
	id, err := strconv.ParseInt(chatID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chat ID"})
		return
	}

	// Verify chat exists and belongs to user
	chat, err := models.Chats.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	if chat.UserID != userID.(int64) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Update chat
	updatedChat, err := models.Chats.Update(ctx, id, req.Title)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update chat"})
		return
	}

	c.JSON(http.StatusOK, updatedChat)
}

// DeleteChat handles deleting a chat
func DeleteChat(c *gin.Context) {
	chatID := c.Param("id")
	if chatID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Chat ID is required"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	models := models.NewModels()
	ctx := c.Request.Context()

	// Parse chat ID
	id, err := strconv.ParseInt(chatID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chat ID"})
		return
	}

	// Verify chat exists and belongs to user
	chat, err := models.Chats.FindByID(ctx, id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	if chat.UserID != userID.(int64) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
		return
	}

	// Delete chat (messages will be cascade deleted)
	err = models.Chats.Delete(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chat deleted successfully"})
}
