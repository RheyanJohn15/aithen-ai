package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients.
	clients map[string]map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan *Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Mutex for thread-safe operations
	mu sync.RWMutex
}

// Message represents a WebSocket message
type Message struct {
	Type     string      `json:"type"`               // message, progress, error, complete
	Channel  string      `json:"channel"`            // Channel ID (e.g., training job ID)
	Data     interface{} `json:"data"`               // Message payload
	Progress *Progress   `json:"progress,omitempty"` // Progress information
	Error    string      `json:"error,omitempty"`    // Error message if any
}

// Progress represents training progress
type Progress struct {
	CurrentFile    int    `json:"current_file"`
	TotalFiles     int    `json:"total_files"`
	CurrentChunk   int    `json:"current_chunk"`
	TotalChunks    int    `json:"total_chunks"`
	Percentage     int    `json:"percentage"`
	Status         string `json:"status"` // processing, embedding, storing, completed
	CurrentFileURL string `json:"current_file_url,omitempty"`
	Message        string `json:"message,omitempty"`
	// Enhanced file details
	CurrentFileName string               `json:"current_file_name,omitempty"`
	CurrentFileSize int64                `json:"current_file_size,omitempty"`
	CurrentFileType string               `json:"current_file_type,omitempty"`
	FileDetails     []FileProgressDetail `json:"file_details,omitempty"`
	JobID           string               `json:"job_id,omitempty"`
	JobIndex        int                  `json:"job_index,omitempty"`
	TotalJobs       int                  `json:"total_jobs,omitempty"`
}

// FileProgressDetail represents detailed progress for a single file
type FileProgressDetail struct {
	FileID      string `json:"file_id"`
	FileName    string `json:"file_name"`
	FileSize    int64  `json:"file_size"`
	FileType    string `json:"file_type"`
	Status      string `json:"status"` // pending, processing, embedding, storing, completed, failed
	ChunksTotal int    `json:"chunks_total"`
	ChunksDone  int    `json:"chunks_done"`
	Percentage  int    `json:"percentage"`
	Error       string `json:"error,omitempty"`
	StartedAt   string `json:"started_at,omitempty"`
	CompletedAt string `json:"completed_at,omitempty"`
}

var (
	hubInstance *Hub
	hubOnce     sync.Once
)

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// GetHub returns the singleton hub instance
func GetHub() *Hub {
	hubOnce.Do(func() {
		hubInstance = NewHub()
		go hubInstance.Run()
	})
	return hubInstance
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if h.clients[client.channel] == nil {
				h.clients[client.channel] = make(map[*Client]bool)
			}
			h.clients[client.channel][client] = true
			h.mu.Unlock()
			log.Printf("Client registered to channel: %s (total: %d)", client.channel, len(h.clients[client.channel]))

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.channel]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.clients, client.channel)
					}
				}
			}
			h.mu.Unlock()
			log.Printf("Client unregistered from channel: %s", client.channel)

		case message := <-h.broadcast:
			h.mu.RLock()
			clients := h.clients[message.Channel]
			h.mu.RUnlock()

			if clients != nil {
				for client := range clients {
					select {
					case client.send <- message:
					default:
						close(client.send)
						delete(clients, client)
					}
				}
			}
		}
	}
}

// Broadcast sends a message to all clients in a channel
func (h *Hub) Broadcast(channel string, messageType string, data interface{}, progress *Progress, err error) {
	msg := &Message{
		Type:     messageType,
		Channel:  channel,
		Data:     data,
		Progress: progress,
	}
	if err != nil {
		msg.Error = err.Error()
		msg.Type = "error"
	}

	// Marshal to JSON for logging
	jsonData, _ := json.Marshal(msg)
	log.Printf("Broadcasting to channel %s: %s", channel, string(jsonData))

	h.broadcast <- msg
}
