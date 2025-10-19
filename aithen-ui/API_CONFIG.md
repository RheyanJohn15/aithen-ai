# API Configuration Guide

## Environment Variables

Add these variables to your `.env.local` file:

```env
# API Configuration
# Set to 'true' to use production API, 'false' for development
NEXT_PUBLIC_USE_PROD_API=false

# Development API URL (used when NEXT_PUBLIC_USE_PROD_API=false)
NEXT_PUBLIC_API_DEV=http://localhost:8080/api

# Production API URL (used when NEXT_PUBLIC_USE_PROD_API=true)
NEXT_PUBLIC_API_PROD=https://your-production-api.com/api
```

## Usage Examples

### Development Mode
```env
NEXT_PUBLIC_USE_PROD_API=false
NEXT_PUBLIC_API_DEV=http://localhost:8080/api
```
- Uses local Laravel API
- Shows "(DEV)" in the header
- Connects to `http://localhost:8080/api`

### Production Mode
```env
NEXT_PUBLIC_USE_PROD_API=true
NEXT_PUBLIC_API_PROD=https://api.aithen.ai/api
```
- Uses production API
- Shows "(PROD)" in the header
- Connects to `https://api.aithen.ai/api`

## Switching Environments

To switch between development and production:

1. **For Development:**
   ```env
   NEXT_PUBLIC_USE_PROD_API=false
   ```

2. **For Production:**
   ```env
   NEXT_PUBLIC_USE_PROD_API=true
   ```

3. **Restart your Next.js development server:**
   ```bash
   npm run dev
   ```

## API Endpoints

The following endpoints are automatically configured:

- **Health Check:** `{API_URL}/ai/health`
- **Chat Stream:** `{API_URL}/ai/chat/stream`
- **Personalities:** `{API_URL}/ai/personalities`
- **Personality by ID:** `{API_URL}/ai/personalities/{id}`

## Debugging

Check the browser console for API configuration details:
- Current API URL being used
- Environment mode (DEV/PROD)
- Connection status
