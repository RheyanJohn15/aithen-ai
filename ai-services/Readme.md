# Aithen AI Service

A FastAPI microservice that provides AI chat capabilities with streaming support and knowledge base training, powered by Ollama. Features dynamic personality system, real-time streaming responses, and vector embedding generation for knowledge base management.

## 🚀 Features

- **Real-time Streaming**: Multiple streaming endpoints for different use cases
- **Dynamic Personalities**: JSON-based personality system with customizable AI behaviors
- **Knowledge Base Training**: Process files, generate embeddings, and store in PostgreSQL with pgvector
- **File Processing**: Support for PDF, DOCX, Excel, and text files
- **Vector Embeddings**: Generate embeddings using Ollama's nomic-embed-text model
- **Queue-based Training**: Chunked training jobs with concurrent processing
- **Docker Support**: Production-ready containerization
- **Health Checks**: Built-in health monitoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │    Go API       │    │   AI Service    │
│   (Port 3000)   │◄──►│   (Port 8080)   │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │   PostgreSQL    │    │     Ollama      │
│   (Port 6379)   │    │  + pgvector     │    │   (Port 11434)  │
└─────────────────┘    │   (Port 5432)   │    └─────────────────┘
                       └─────────────────┘
```

## 📋 Prerequisites

- **Python 3.11+**
- **Ollama** with Mistral and embedding models installed
- **PostgreSQL** with pgvector extension enabled
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

4. **Set up PostgreSQL with pgvector:**
   
   **Option A: Using WSL (Recommended for Windows)**
   
   See detailed instructions in `docs/pg-vector-installation.md`
   
   **Option B: Using Docker**
   ```bash
   docker run -d \
     --name aithen-postgres \
     -e POSTGRES_PASSWORD=your_password \
     -e POSTGRES_DB=aithen_db \
     -p 5432:5432 \
     pgvector/pgvector:pg16
   ```
   
   Then enable the extension:
   ```bash
   docker exec -it aithen-postgres psql -U postgres -d aithen_db
   ```
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

5. **Start Ollama service and install required models:**
   ```bash
   ollama serve
   ollama pull mistral
   ollama pull nomic-embed-text
   ```

6. **Configure environment variables:**
   
   Create a `.env` file or set environment variables:
   ```bash
   OLLAMA_URL=http://localhost:11434
   EMBEDDING_MODEL=nomic-embed-text
   CHUNK_SIZE=1000
   CHUNK_OVERLAP=200
   ```

7. **Run the AI service:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Deployment

1. **Build the Docker image:**
   ```bash
   docker build -t aithen-ai-service .
   ```

2. **Run with Docker Compose (recommended):**
   
   The service is included in the main `docker-compose.yml`:
   ```yaml
   ai-service:
     build: ./ai-services
     ports:
       - "8000:8000"
     environment:
       - OLLAMA_URL=http://ollama:11434
       - MODEL=mistral
       - EMBEDDING_MODEL=nomic-embed-text
     depends_on:
       ollama:
         condition: service_healthy
   
   ollama:
     image: ollama/ollama:latest
     ports:
       - "11434:11434"
     volumes:
       - ollama_data:/root/.ollama
   ```

3. **Or run standalone:**
   ```bash
   docker run -p 8000:8000 \
     -e OLLAMA_URL=http://host.docker.internal:11434 \
     -e MODEL=mistral \
     -e EMBEDDING_MODEL=nomic-embed-text \
     aithen-ai-service
   ```

## 🔌 API Endpoints

### Chat Endpoints

| Endpoint | Method | Description | Streaming |
|----------|--------|-------------|-----------|
| `/chat` | POST | Main chat endpoint with streaming toggle | Optional |
| `/chat/stream` | POST | Dedicated Server-Sent Events streaming | Yes |
| `/api/chat/stream` | POST | Legacy streaming endpoint | Yes |

### Training Endpoints

| Endpoint | Method | Description | Streaming |
|----------|--------|-------------|-----------|
| `/training/stream` | POST | Stream training progress with file-by-file details | Yes |

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

### Training Knowledge Base

```bash
curl -X POST http://localhost:8000/training/stream \
  -H "Content-Type: application/json" \
  -d '{
    "knowledge_base_id": "123456789",
    "version_id": "987654321",
    "files": [
      {
        "id": "file123",
        "name": "document.pdf",
        "path": "/path/to/document.pdf",
        "mime_type": "application/pdf",
        "size": 1024000
      }
    ],
    "db_config": {
      "host": "localhost",
      "port": "5432",
      "user": "postgres",
      "password": "password",
      "dbname": "aithen_db"
    }
  }'
```

## 🗄️ Vector Database (PostgreSQL + pgvector)

### Setup

The AI service stores embeddings in PostgreSQL using the pgvector extension. Ensure PostgreSQL has pgvector installed:

**Check if pgvector is installed:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Enable pgvector (if not already enabled):**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Embedding Storage

Embeddings are stored in the `knowledge_base_embeddings` table with the following structure:

- **id**: Unique identifier (BIGINT)
- **knowledge_base_id**: Reference to knowledge base (BIGINT)
- **knowledge_base_version_id**: Reference to version (BIGINT)
- **knowledge_base_file_id**: Reference to file (BIGINT)
- **chunk_index**: Index of chunk within file (INTEGER)
- **chunk_text**: Text content of chunk (TEXT)
- **embedding**: Vector embedding (vector(1536))
- **metadata**: Additional metadata (JSONB)

### Vector Search

The embeddings use 1536-dimensional vectors (compatible with OpenAI embeddings). Vector similarity search can be performed using PostgreSQL's vector operators:

```sql
-- Cosine similarity search
SELECT chunk_text, 
       1 - (embedding <=> query_embedding::vector) AS similarity
FROM knowledge_base_embeddings
WHERE knowledge_base_version_id = $1
ORDER BY embedding <=> query_embedding::vector
LIMIT 10;
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

## 🔧 Integration with Go API

The Go API (`aithen-go-api`) acts as the main backend and proxies requests to this AI service:

### Request Flow

```
Frontend (Next.js) → Go API (Port 8080) → AI Service (Port 8000) → Ollama
```

### Configuration

The Go API connects to the AI service using the `AI_SERVICE_URL` environment variable:

```env
AI_SERVICE_URL=http://localhost:8000
```

### Training Integration

The Go API manages training jobs through a queue system and calls the AI service's `/training/stream` endpoint. The AI service processes files, generates embeddings, and stores them directly in PostgreSQL.

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama service URL |
| `MODEL` | `mistral` | Default AI model to use |
| `EMBEDDING_MODEL` | `nomic-embed-text` | Embedding model for knowledge bases |
| `CHUNK_SIZE` | `1000` | Characters per chunk for text processing |
| `CHUNK_OVERLAP` | `200` | Overlap between chunks |
| `PORT` | `8000` | Service port |

### Docker Environment

```bash
docker run -p 8000:8000 \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  -e MODEL=mistral \
  -e EMBEDDING_MODEL=nomic-embed-text \
  -e CHUNK_SIZE=1000 \
  -e CHUNK_OVERLAP=200 \
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

### Test Embedding Generation

```bash
curl -X POST http://localhost:8000/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "input": "This is a test text for embedding generation"
  }'
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
  -e EMBEDDING_MODEL=nomic-embed-text \
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
│   ├── training_service.py  # Training and embedding service
│   ├── personality_store.py # Personality management
│   ├── schema.py           # Pydantic models
│   └── routes/
│       ├── chat_routes.py   # Chat endpoints
│       └── training_routes.py # Training endpoints
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
   - Verify models are installed: `ollama pull mistral` and `ollama pull nomic-embed-text`

2. **Embedding Generation 404 Error**
   - Verify the embedding model is installed: `ollama pull nomic-embed-text`
   - Check that Ollama API is accessible at the configured URL
   - Ensure the API endpoint uses `input` instead of `prompt` in the payload

3. **PostgreSQL Connection Failed**
   - Verify PostgreSQL is running and accessible
   - Check database credentials in db_config
   - Ensure pgvector extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`

4. **File Processing Errors**
   - For PDF files: Ensure PyPDF2 is installed (`pip install PyPDF2`)
   - For DOCX files: Ensure python-docx is installed (`pip install python-docx`)
   - For Excel files: Ensure pandas and openpyxl are installed (`pip install pandas openpyxl`)

5. **Streaming Not Working**
   - Use curl with `-N` flag for unbuffered output
   - Check if endpoint supports streaming
   - Verify `stream: true` in request body

6. **Docker Issues**
   - Use `host.docker.internal` for Ollama URL in Docker (Windows/Mac)
   - Use service name `ollama` for Docker Compose networking
   - Ensure ports are properly exposed
   - Check container logs: `docker logs <container_id>`

### Debug Mode

```bash
# Run with debug logging
uvicorn app.main:app --reload --log-level debug

# Docker with debug
docker run -p 8000:8000 -e LOG_LEVEL=debug aithen-ai-service
```

## 📊 Performance Optimization

### Chunking Configuration

Adjust chunk size and overlap based on your use case:

- **Smaller chunks (500-800)**: Better for precise retrieval, more embeddings
- **Larger chunks (1500-2000)**: Better context, fewer embeddings
- **Overlap (10-20% of chunk size)**: Prevents context loss at boundaries

### Concurrent Processing

The training service processes multiple files concurrently. Adjust based on system resources:

- Default: 3 concurrent jobs
- Max files per job: 5 files

## 🔐 Security Considerations

- **Database Credentials**: Never commit database credentials to version control
- **API Keys**: Store sensitive keys in environment variables
- **File Uploads**: Validate file types and sizes before processing
- **Network**: Use HTTPS in production environments

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
