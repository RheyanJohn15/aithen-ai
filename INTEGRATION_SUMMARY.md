# AI Service Integration Summary

This document describes how the AI service (Python FastAPI) has been integrated with the Go API backend and connected to the frontend.

## Architecture Overview

```
Frontend (Next.js)
    ↓
Go API Backend (Gin)
    ↓
AI Service (Python FastAPI + Ollama)
```

## Components

### 1. Go API Backend (`aithen-go-api`)

#### New Handler: `internal/handlers/ai.go`
- **Chat**: Non-streaming chat endpoint
- **ChatStreamImproved**: Streaming chat endpoint with SSE support
- **GetPersonalities**: List all available personalities
- **GetPersonality**: Get specific personality by ID

#### Routes Added: `internal/router/router.go`
- `POST /api/ai/chat` - Non-streaming chat
- `POST /api/ai/chat/stream` - Streaming chat (SSE)
- `GET /api/ai/personalities` - List personalities
- `GET /api/ai/personalities/:id` - Get personality by ID

#### Environment Variable
- `AI_SERVICE_URL` - URL of the Python AI service (default: `http://localhost:8000`)

### 2. Frontend API Module (`aithen-ui/src/api/aiApi.ts`)

New API functions:
- `chat()` - Non-streaming chat request
- `chatStream()` - Streaming chat request (returns StreamingResponse)
- `streamChatWithCallback()` - Convenience function with callbacks
- `getPersonalities()` - Get all personalities
- `getPersonality(id)` - Get specific personality

### 3. Updated Frontend Hook (`aithen-ui/src/hooks/ai/useAi.ts`)

The `useAi` hook now uses the new centralized API module:
- Uses `streamChatWithCallback()` for streaming chat
- Uses `getPersonalities()` and `getPersonality()` for personality management
- Simplified code with better error handling

## API Endpoints

### Chat Endpoints

#### POST `/api/ai/chat`
Non-streaming chat request.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "personality": "aithen_core",
  "max_tokens": 512
}
```

**Response:**
```json
{
  "response": "Hello! How can I help you today?"
}
```

#### POST `/api/ai/chat/stream`
Streaming chat request (Server-Sent Events).

**Request:** Same as `/api/ai/chat`

**Response:** SSE stream with format:
```
data: {"content": "Hello"}
data: {"content": "!"}
data: {"content": " How"}
...
data: [DONE]
```

### Personality Endpoints

#### GET `/api/ai/personalities`
Returns list of personality IDs.

**Response:**
```json
["aithen_core", "creative", "technical"]
```

#### GET `/api/ai/personalities/:id`
Returns personality details.

**Response:**
```json
{
  "id": "aithen_core",
  "name": "Aithen Core",
  "description": "Default personality",
  "system_prompt": "You are a helpful assistant...",
  "core_traits": ["helpful", "friendly"]
}
```

## Usage Examples

### Frontend: Streaming Chat

```typescript
import { streamChatWithCallback } from '@/api';

await streamChatWithCallback(
  {
    messages: [{ role: 'user', content: 'Hello!' }],
    personality: 'aithen_core',
  },
  (content) => {
    // Handle each chunk
    console.log('Received:', content);
    // Update UI
  },
  (error) => {
    // Handle errors
    console.error('Error:', error);
  },
  () => {
    // Handle completion
    console.log('Stream completed');
  }
);
```

### Frontend: Using the Hook

```typescript
import { useAi } from '@/hooks/ai/useAi';

function ChatComponent() {
  const { sendMessage, messages, isLoading } = useAi();
  
  const handleSend = () => {
    sendMessage('Hello!', 'aithen_core', 512);
  };
  
  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <button onClick={handleSend} disabled={isLoading}>
        Send
      </button>
    </div>
  );
}
```

## Environment Setup

### Go API Backend
Add to `.env`:
```env
AI_SERVICE_URL=http://localhost:8000
PORT=8080
```

### Frontend
Already configured via:
```env
NEXT_PUBLIC_USE_PROD_API=false
NEXT_PUBLIC_API_DEV=http://localhost:8080/api
NEXT_PUBLIC_API_PROD=https://your-production-api.com/api
```

## Testing

1. **Start AI Service:**
   ```bash
   cd ai-services
   # Start Python FastAPI service on port 8000
   ```

2. **Start Go API:**
   ```bash
   cd aithen-go-api
   go run cmd/server/main.go
   # Server runs on port 8080
   ```

3. **Start Frontend:**
   ```bash
   cd aithen-ui
   npm run dev
   # Frontend runs on port 3000
   ```

4. **Test Endpoint:**
   ```bash
   curl -X POST http://localhost:8080/api/ai/chat/stream \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [{"role": "user", "content": "Hello!"}],
       "personality": "aithen_core"
     }'
   ```

## Flow Diagram

```
User Input
    ↓
Frontend (useAi hook)
    ↓
streamChatWithCallback()
    ↓
chatStream() → POST /api/ai/chat/stream
    ↓
Go Handler (ChatStreamImproved)
    ↓
Proxy to Python AI Service
    ↓
POST http://localhost:8000/chat/stream
    ↓
Python FastAPI (chat_routes.py)
    ↓
Ollama Client (stream_chat)
    ↓
Ollama API (Mistral Model)
    ↓
Stream Response (SSE)
    ↓
Go Handler (forwards SSE)
    ↓
Frontend (parseSSE)
    ↓
Update UI (real-time)
```

## Key Features

✅ **Streaming Support**: Real-time SSE streaming from AI service  
✅ **Error Handling**: Comprehensive error handling at all layers  
✅ **Type Safety**: Full TypeScript support in frontend  
✅ **Centralized API**: Uses the new centralized API module  
✅ **Proxy Pattern**: Go API acts as proxy to Python service  
✅ **Personality Support**: Full personality management  
✅ **Extensible**: Easy to add new endpoints

## Next Steps

1. Add authentication middleware to Go endpoints
2. Add rate limiting
3. Add request logging
4. Add metrics/monitoring
5. Add caching for personalities
6. Add WebSocket support for bi-directional communication

