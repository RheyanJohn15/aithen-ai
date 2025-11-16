# API Module

A centralized, extensible API client module for making HTTP requests with JWT Bearer token authentication.

## Features

- ✅ Conditional base URL based on environment variables (`NEXT_PUBLIC_USE_PROD_API`)
- ✅ JWT Bearer token authentication (with future API key support)
- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Extensible architecture for domain-specific API modules
- ✅ Request timeout handling
- ✅ TypeScript support with full type safety
- ✅ Error handling

## Environment Variables

Configure these in your `.env.local` or `next.config.ts`:

```env
NEXT_PUBLIC_USE_PROD_API=false
NEXT_PUBLIC_API_DEV=http://localhost:8080/api
NEXT_PUBLIC_API_PROD=https://your-production-api.com/api
```

## Basic Usage

```typescript
import { get, post, put, del } from '@/api';

// GET request
const response = await get('/users');
console.log(response.data);

// POST request with data
const response = await post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const response = await put('/users/1', {
  name: 'Jane Doe'
});

// DELETE request
const response = await del('/users/1');
```

## Authentication

### JWT Bearer Token (Default)

The module automatically includes the JWT token from localStorage in the `Authorization` header:

```typescript
import { setToken, getToken, removeToken } from '@/api';

// Set token (usually done after login)
setToken('your-jwt-token-here');

// Get current token
const token = getToken();

// Remove token (usually done on logout)
removeToken();
```

### Custom Token Getter

You can set a custom token getter if you store tokens differently:

```typescript
import { setTokenGetter } from '@/api';

setTokenGetter(() => {
  // Your custom logic to retrieve token
  return sessionStorage.getItem('auth_token');
});
```

### API Key (Future Support)

API key authentication is already supported for future use:

```typescript
import { setApiKey, getApiKey } from '@/api';

// Set API key
setApiKey('your-api-key');

// Use API key in request
const response = await get('/admin/stats', {
  authType: 'api-key'
});
```

## Advanced Usage

### Custom Configuration

```typescript
import { get, post } from '@/api';

// Request with custom timeout
const response = await get('/users', {
  timeout: 5000 // 5 seconds
});

// Public endpoint (skip authentication)
const response = await get('/public/data', {
  skipAuth: true
});

// Custom headers
const response = await post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Custom token for this request
const response = await get('/users', {
  token: 'custom-token-for-this-request'
});
```

### Creating Domain-Specific API Modules

Create separate files for different API domains:

**`src/api/users.ts`**
```typescript
import { createApiClient } from '@/api';

const userApi = createApiClient({
  timeout: 10000
});

export const getUserById = (id: string) => {
  return userApi.get(`/users/${id}`);
};

export const createUser = (data: { name: string; email: string }) => {
  return userApi.post('/users', data);
};

export const updateUser = (id: string, data: Partial<User>) => {
  return userApi.put(`/users/${id}`, data);
};

export const deleteUser = (id: string) => {
  return userApi.delete(`/users/${id}`);
};
```

**Usage:**
```typescript
import { getUserById, createUser } from '@/api/users';

const user = await getUserById('123');
const newUser = await createUser({ name: 'John', email: 'john@example.com' });
```

## Error Handling

All API methods throw `ApiError` objects that you can catch:

```typescript
import { get, type ApiError } from '@/api';

try {
  const response = await get('/users');
  console.log(response.data);
} catch (error: ApiError) {
  console.error('API Error:', error.message);
  console.error('Status:', error.status);
  console.error('Data:', error.data);
}
```

## Streaming Support

The API module supports streaming responses for Server-Sent Events (SSE) and raw streaming.

### SSE Streaming (Server-Sent Events)

```typescript
import { streamPost, parseSSE } from '@/api';

// Create streaming request
const streamResponse = await streamPost('/chat/stream', {
  messages: [{ role: 'user', content: 'Hello' }],
});

// Parse SSE stream with callbacks
await parseSSE(
  streamResponse.reader,
  (data) => {
    // Handle each data chunk
    console.log('Received:', data);
    if (data.content) {
      // Update UI with streaming content
    }
  },
  (error) => {
    // Handle errors
    console.error('Stream error:', error);
  },
  () => {
    // Handle completion
    console.log('Stream completed');
  }
);
```

### Manual Stream Reading

```typescript
import { streamPost } from '@/api';

const streamResponse = await streamPost('/data/stream', { query: 'test' });
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await streamResponse.reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log('Chunk:', chunk);
}

// Cancel stream if needed
streamResponse.cancel();
```

### Streaming Methods

- `stream(method, path, config?)` - Generic streaming request
- `streamPost(path, data?, config?)` - POST streaming request
- `streamGet(path, config?)` - GET streaming request
- `parseSSE(reader, onData, onError?, onComplete?)` - Parse SSE stream
- `streamRaw(reader, onChunk, onError?, onComplete?)` - Stream raw chunks

## Type Safety

The API module is fully typed. You can specify response types:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const response = await get<User[]>('/users');
// response.data is typed as User[]
```

## API Reference

### Core Methods

- `get<T>(path, config?)` - GET request
- `post<T>(path, data?, config?)` - POST request
- `put<T>(path, data?, config?)` - PUT request
- `patch<T>(path, data?, config?)` - PATCH request
- `del<T>(path, config?)` - DELETE request
- `createApiClient(baseConfig?)` - Create a configured API client instance

### Streaming Methods

- `stream(method, path, config?)` - Generic streaming request
- `streamPost(path, data?, config?)` - POST streaming request
- `streamGet(path, config?)` - GET streaming request
- `parseSSE(reader, onData, onError?, onComplete?)` - Parse Server-Sent Events stream
- `streamRaw(reader, onChunk, onError?, onComplete?)` - Stream raw chunks

### Authentication

- `setToken(token)` - Set JWT token
- `getToken()` - Get current JWT token
- `removeToken()` - Remove JWT token
- `setApiKey(key)` - Set API key
- `getApiKey()` - Get current API key
- `removeApiKey()` - Remove API key
- `setTokenGetter(getter)` - Set custom token getter
- `setApiKeyGetter(getter)` - Set custom API key getter

### Configuration

- `getBaseUrl()` - Get the current base API URL
- `getDefaultHeaders()` - Get default request headers
- `DEFAULT_TIMEOUT` - Default request timeout (30000ms)

## File Structure

```
src/api/
├── index.ts          # Main exports
├── api.ts            # Core API client
├── auth.ts           # Authentication utilities
├── config.ts         # Configuration
├── types.ts          # TypeScript types
├── example.ts        # Usage examples
└── README.md         # This file
```

