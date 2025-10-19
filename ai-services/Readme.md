# Aithen AI Service

A FastAPI microservice that provides AI chat capabilities with streaming support, powered by Ollama and Mistral 7B. Features dynamic personality system and real-time streaming responses for seamless Laravel backend integration.

## 🚀 Features

- **Real-time Streaming**: Multiple streaming endpoints for different use cases
- **Dynamic Personalities**: JSON-based personality system with customizable AI behaviors
- **Laravel Integration**: Optimized for Laravel backend consumption
- **Modular Architecture**: Clean separation of concerns with dedicated route modules
- **Docker Support**: Production-ready containerization
- **Health Checks**: Built-in health monitoring
- **Security**: Non-root user execution and proper environment isolation

## 📋 Prerequisites

- **Python 3.11+**
- **Ollama** with Mistral model installed
- **Docker** (optional, for containerized deployment)

## 🛠️ Installation

### Local Development

1. **Clone and navigate to the service:**
   ```bash
   cd ai-services
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start Ollama service:**
   ```bash
   ollama serve
   ollama pull mistral
   ```

5. **Run the AI service:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t aithen-ai-service .
   ```

2. **Run with Docker Compose (recommended):**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     ai-service:
       build: .
       ports:
         - "8000:8000"
       environment:
         - OLLAMA_URL=http://host.docker.internal:11434
         - MODEL=mistral
       depends_on:
         - ollama
     
     ollama:
       image: ollama/ollama
       ports:
         - "11434:11434"
       volumes:
         - ollama_data:/root/.ollama
   
   volumes:
     ollama_data:
   ```

3. **Or run standalone:**
   ```bash
   docker run -p 8000:8000 -e OLLAMA_URL=http://host.docker.internal:11434 aithen-ai-service
   ```

## 🔌 API Endpoints

### Chat Endpoints

| Endpoint | Method | Description | Streaming |
|----------|--------|-------------|-----------|
| `/chat` | POST | Main chat endpoint with streaming toggle | Optional |
| `/chat/stream` | POST | Dedicated Server-Sent Events streaming | Yes |
| `/api/chat/stream` | POST | Legacy streaming endpoint | Yes |

### Personality Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/personalities` | GET | List all available personalities |
| `/personalities/{id}` | GET | Get specific personality details |
| `/personalities` | POST | Create or update personality |

### Health & Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service health check |
| `/docs` | GET | Interactive API documentation |

## 📝 Usage Examples

### Basic Chat (Non-streaming)

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "personality": "aithen_core",
    "stream": false
  }'
```

### Streaming Chat

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Tell me about AI"}],
    "personality": "aithen_core",
    "stream": true
  }'
```

### Server-Sent Events

```bash
curl -X POST http://localhost:8000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Explain quantum computing"}],
    "personality": "aithen_core"
  }'
```

## 🎭 Personality System

### Available Personalities

- **aithen_core**: Professional, adaptive AI assistant
- **personality_helper**: Support-focused personality

### Creating Custom Personalities

```bash
curl -X POST http://localhost:8000/personalities \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my_custom_personality",
    "name": "My Custom AI",
    "description": "A custom personality for specific use cases",
    "system_prompt": "You are a helpful assistant specialized in...",
    "core_traits": ["helpful", "knowledgeable", "friendly"]
  }'
```

### Personality JSON Structure

```json
{
  "id": "personality_id",
  "name": "Display Name",
  "description": "Personality description",
  "system_prompt": "System prompt for the AI",
  "core_traits": ["trait1", "trait2"],
  "example_dialogue": [
    {
      "user": "Example user message",
      "assistant": "Example AI response"
    }
  ],
  "tone_guidelines": {
    "preferred_style": "Professional, friendly",
    "avoid": ["sarcasm", "slang"],
    "include": ["clear explanations", "helpful tone"]
  }
}
```

## 🔧 Laravel Integration

### Basic Controller Method

```php
public function streamChat(Request $request)
{
    $response = Http::timeout(60)->post('http://localhost:8000/chat', [
        'messages' => $request->input('messages', []),
        'personality' => $request->input('personality'),
        'stream' => true
    ]);
    
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
```

### Frontend JavaScript

```javascript
async function streamChat(messages, personality = null) {
    const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: messages,
            personality: personality,
            stream: true
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Update UI with chunk
        document.getElementById('response').innerHTML += chunk;
    }
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama service URL |
| `MODEL` | `mistral` | Default AI model to use |
| `PORT` | `8000` | Service port |

### Docker Environment

```bash
docker run -p 8000:8000 \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  -e MODEL=mistral \
  aithen-ai-service
```

## 🧪 Testing

### Health Check

```bash
curl http://localhost:8000/
```

### List Personalities

```bash
curl http://localhost:8000/personalities
```

### Interactive Documentation

Visit `http://localhost:8000/docs` for Swagger UI documentation.

## 🐳 Docker Commands

```bash
# Build image
docker build -t aithen-ai-service .

# Run container
docker run -p 8000:8000 aithen-ai-service

# Run with custom environment
docker run -p 8000:8000 \
  -e OLLAMA_URL=http://your-ollama-host:11434 \
  -e MODEL=llama2 \
  aithen-ai-service

# View logs
docker logs <container_id>

# Health check
docker exec <container_id> curl -f http://localhost:8000/
```

## 📁 Project Structure

```
ai-services/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── ollama_client.py     # Ollama integration
│   ├── personality_store.py # Personality management
│   ├── schema.py           # Pydantic models
│   └── routes/
│       └── chat_routes.py  # Chat endpoints
├── personalities/
│   ├── aithen_core.json    # Default personality
│   └── personality_helper.json
├── Dockerfile              # Container configuration
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🔍 Troubleshooting

### Common Issues

1. **Ollama Connection Failed**
   - Ensure Ollama is running: `ollama serve`
   - Check OLLAMA_URL environment variable
   - Verify model is installed: `ollama pull mistral`

2. **Streaming Not Working**
   - Use curl with `-N` flag for unbuffered output
   - Check if endpoint supports streaming
   - Verify `stream: true` in request body

3. **Docker Issues**
   - Use `host.docker.internal` for Ollama URL in Docker
   - Ensure ports are properly exposed
   - Check container logs: `docker logs <container_id>`

### Debug Mode

```bash
# Run with debug logging
uvicorn app.main:app --reload --log-level debug

# Docker with debug
docker run -p 8000:8000 -e LOG_LEVEL=debug aithen-ai-service
```

## 📄 License

This project is part of the Aithen AI framework.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation at `/docs`
- Open an issue in the repository