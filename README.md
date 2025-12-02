# Aithen AI - Full Stack Application

A complete AI-powered application stack featuring Laravel API, Next.js frontend, and FastAPI AI service with streaming capabilities, all orchestrated with Docker.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js UI    │    │   Laravel API   │    │   AI Service    │
│   (Port 3000)   │◄──►│   (Port 80)     │◄──►│   (Port 8000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │     MySQL       │    │     Ollama      │
│   (Port 8080)   │    │   (Port 3306)   │    │   (Port 11434)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│     Redis       │    │   Health Checks │
│   (Port 6379)   │    │   & Monitoring  │
└─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose**
- **Git**

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd aithen-ai
cp env.example .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Database
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_root_password

# Application
APP_KEY=base64:your-generated-key-here

# AI Model
AI_MODEL=mistral  # or llama2, codellama, etc.
```

### 3. Start All Services

```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application

- **Frontend (Next.js)**: http://localhost:3000
- **API (Laravel)**: http://localhost:80
- **AI Service**: http://localhost:8000
- **Nginx Proxy**: http://localhost:8080
- **API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
aithen-ai/
├── aithen-api/              # Laravel API
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── routes/
│   ├── Dockerfile
│   └── .dockerignore
├── aithen-ui/               # Next.js Frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── .dockerignore
├── ai-services/             # FastAPI AI Service
│   ├── app/
│   ├── personalities/
│   ├── Dockerfile
│   └── .dockerignore
├── nginx/                   # Nginx Configuration
│   ├── nginx.conf
│   └── conf.d/
├── docker-compose.yml       # Main orchestration
├── env.example             # Environment template
└── README.md               # This file
```

## 🔧 Services Overview

### 🎨 Frontend (Next.js)
- **Port**: 3000
- **Features**: React 19, TypeScript, Tailwind CSS
- **Build**: Optimized production build with standalone output
- **Health Check**: Built-in health monitoring

### 🔌 API (Laravel)
- **Port**: 80
- **Features**: Laravel 12, PHP 8.2, Apache
- **Database**: MySQL 8.0 with Redis caching
- **Health Check**: Application health monitoring

### 🤖 AI Service (FastAPI)
- **Port**: 8000
- **Features**: Streaming AI responses, personality system
- **Model**: Ollama with Mistral (configurable)
- **Health Check**: Service availability monitoring

### 🗄️ Database (MySQL)
- **Port**: 3306
- **Features**: MySQL 8.0 with persistent storage
- **Health Check**: Database connectivity monitoring

### 📦 Cache (Redis)
- **Port**: 6379
- **Features**: Session storage, caching, queues
- **Health Check**: Redis connectivity monitoring

### 🔄 Proxy (Nginx)
- **Port**: 8080
- **Features**: Load balancing, SSL termination, rate limiting
- **Routes**: Intelligent routing to appropriate services

## 🛠️ Development

### Local Development

```bash
# Start only specific services
docker-compose up api ui ai-service

# View logs
docker-compose logs -f ai-service

# Execute commands in containers
docker-compose exec api php artisan migrate
docker-compose exec ai-service python -m pip list
```

### Adding New Services

1. Create Dockerfile in service directory
2. Add service to `docker-compose.yml`
3. Configure networking and dependencies
4. Update Nginx configuration if needed

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Application environment | `production` |
| `DB_PASSWORD` | Database password | `aithen_password` |
| `AI_MODEL` | AI model to use | `mistral` |
| `AI_SERVICE_URL` | AI service URL | `http://ai-service:8000` |

## 🧪 Testing

### Health Checks

```bash
# Check all services
curl http://localhost:3000/  # UI
curl http://localhost:80/    # API
curl http://localhost:8000/  # AI Service
curl http://localhost:8080/health  # Nginx

# Check specific service health
docker-compose ps
```

### API Testing

```bash
# Test AI streaming
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}],"stream":true}'

# Test Laravel API
curl http://localhost:80/api/health
```

## 🔍 Monitoring & Logs

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-service
docker-compose logs -f api
docker-compose logs -f ui

# Last 100 lines
docker-compose logs --tail=100 ai-service
```

### Service Status

```bash
# Check running containers
docker-compose ps

# Check resource usage
docker stats

# Check health status
docker-compose exec ai-service curl -f http://localhost:8000/
```

## 🚀 Production Deployment

### 1. Environment Setup

```bash
# Copy and configure environment
cp env.example .env
# Edit .env with production values
```

### 2. Security Configuration

```bash
# Generate secure keys
openssl rand -base64 32  # For APP_KEY
openssl rand -base64 32  # For JWT_SECRET

# Set secure passwords
# Update DB_PASSWORD, DB_ROOT_PASSWORD
```

### 3. Deploy

```bash
# Build and start
docker-compose up -d --build

# Verify deployment
docker-compose ps
curl http://localhost:8080/health
```

### 4. SSL/HTTPS (Optional)

Add SSL certificates to nginx configuration:

```bash
# Add SSL configuration to nginx/conf.d/default.conf
# Update docker-compose.yml to expose port 443
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   # Change ports in docker-compose.yml
   ```

2. **Database Connection Issues**
   ```bash
   # Check MySQL logs
   docker-compose logs mysql
   # Verify database credentials in .env
   ```

3. **AI Service Not Responding**
   ```bash
   # Check Ollama status
   docker-compose logs ollama
   # Verify models are downloaded
   docker-compose exec ollama ollama list
   # Install required models if missing
   docker-compose exec ollama ollama pull mistral
   docker-compose exec ollama ollama pull nomic-embed-text
   ```

4. **Build Failures**
   ```bash
   # Clean build
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

### Debug Mode

```bash
# Enable debug logging
export APP_DEBUG=true
docker-compose up --build

# Access container shell
docker-compose exec api bash
docker-compose exec ai-service bash
```

## 📊 Performance Optimization

### Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Scaling Services

```bash
# Scale specific service
docker-compose up -d --scale api=3

# Update Nginx for load balancing
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check individual service READMEs
- **Issues**: Open GitHub issues for bugs
- **Discussions**: Use GitHub discussions for questions

## 🔗 Useful Commands

```bash
# Quick start
docker-compose up -d --build

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose up --build ai-service

# View service logs
docker-compose logs -f [service-name]

# Execute commands
docker-compose exec api php artisan [command]
docker-compose exec ai-service python [script]

# Clean up
docker-compose down -v
docker system prune -f
```
