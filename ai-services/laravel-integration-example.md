# Laravel Integration Example

This document shows how to integrate the streaming AI service with your Laravel backend.

## Available Endpoints

Your AI service now provides these endpoints:

1. **`POST /chat`** - Main chat endpoint with streaming support
2. **`POST /chat/stream`** - Dedicated Server-Sent Events streaming endpoint  
3. **`POST /api/chat/stream`** - Legacy endpoint for backward compatibility

## Laravel Controller Example

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ChatController extends Controller
{
    private $aiServiceUrl;

    public function __construct()
    {
        $this->aiServiceUrl = env('AI_SERVICE_URL', 'http://localhost:8000');
    }

    /**
     * Stream chat response from AI service
     */
    public function streamChat(Request $request)
    {
        $payload = [
            'messages' => $request->input('messages', []),
            'personality' => $request->input('personality'),
            'max_tokens' => $request->input('max_tokens', 512),
            'stream' => true
        ];

        $response = Http::timeout(60)->post("{$this->aiServiceUrl}/chat", $payload);
        
        if ($response->successful()) {
            return response()->stream(function () use ($response) {
                foreach ($response->getBody() as $chunk) {
                    echo $chunk;
                    flush();
                }
            }, 200, [
                'Content-Type' => 'text/plain; charset=utf-8',
                'Cache-Control' => 'no-cache',
                'Connection' => 'keep-alive',
            ]);
        }

        return response()->json(['error' => 'Failed to get AI response'], 500);
    }

    /**
     * Use Server-Sent Events endpoint
     */
    public function streamChatSSE(Request $request)
    {
        $payload = [
            'messages' => $request->input('messages', []),
            'personality' => $request->input('personality'),
            'max_tokens' => $request->input('max_tokens', 512)
        ];

        $response = Http::timeout(60)->post("{$this->aiServiceUrl}/chat/stream", $payload);
        
        if ($response->successful()) {
            return response()->stream(function () use ($response) {
                foreach ($response->getBody() as $chunk) {
                    echo $chunk;
                    flush();
                }
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin' => '*',
            ]);
        }

        return response()->json(['error' => 'Failed to get AI response'], 500);
    }

    /**
     * Non-streaming chat
     */
    public function chat(Request $request)
    {
        $payload = [
            'messages' => $request->input('messages', []),
            'personality' => $request->input('personality'),
            'max_tokens' => $request->input('max_tokens', 512),
            'stream' => false
        ];

        $response = Http::timeout(30)->post("{$this->aiServiceUrl}/chat", $payload);
        
        if ($response->successful()) {
            return response()->json($response->json());
        }

        return response()->json(['error' => 'Failed to get AI response'], 500);
    }
}
```

## Routes

Add these to your `routes/api.php` or `routes/web.php`:

```php
Route::post('/chat/stream', [ChatController::class, 'streamChat']);
Route::post('/chat/sse', [ChatController::class, 'streamChatSSE']);
Route::post('/chat', [ChatController::class, 'chat']);
```

## Frontend JavaScript Example

```javascript
async function streamChat(messages, personality = null) {
    const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain'
        },
        body: JSON.stringify({
            messages: messages,
            personality: personality,
            max_tokens: 512,
            stream: true
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;
        
        // Update your UI with the chunk
        document.getElementById('chat-response').innerHTML += chunk;
    }
    
    return fullResponse;
}

// Example usage
streamChat([
    { role: 'user', content: 'Hello, how are you?' }
], 'aithen_core');
```

## Environment Variables

Add to your `.env` file:

```env
AI_SERVICE_URL=http://localhost:8000
```

## Testing the Endpoints

You can test the endpoints directly:

```bash
# Test streaming endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "personality": "aithen_core",
    "stream": true
  }'

# Test Server-Sent Events endpoint
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "personality": "aithen_core"
  }'
```

## Personality Support

The service supports dynamic personalities stored in the `personalities/` directory. You can:

1. List available personalities: `GET /personalities`
2. Get a specific personality: `GET /personalities/{id}`
3. Create/update personalities: `POST /personalities`

Example personality usage:
```json
{
  "messages": [{"role": "user", "content": "Tell me a joke"}],
  "personality": "aithen_core",
  "stream": true
}
```
