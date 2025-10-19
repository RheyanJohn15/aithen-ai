    import { useState, useCallback, useRef } from 'react';
import { 
  getApiUrl, 
  getApiHealthUrl, 
  getApiChatStreamUrl, 
  getApiPersonalitiesUrl, 
  getApiPersonalityUrl,
  getApiInfo,
  isUsingProdApi 
} from '../../lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Personality {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  core_traits: string[];
  example_dialogue?: Array<{
    user: string;
    assistant: string;
  }>;
  tone_guidelines?: {
    preferred_style: string;
    avoid: string[];
    include: string[];
  };
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  personality?: string;
  max_tokens?: number;
  stream?: boolean;
}

export interface ApiStatus {
  status: 'checking' | 'connected' | 'error';
  message?: string;
}

// Main AI hook
export const useAi = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Aithen, your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ status: 'checking' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Health check hook
  const checkApiHealth = useCallback(async () => {
    try {
      const apiInfo = getApiInfo();
      console.log('API Configuration:', apiInfo);
      
      const response = await fetch(getApiHealthUrl());
      if (response.ok) {
        const data = await response.json();
        setApiStatus({ 
          status: 'connected', 
          message: data.message || 'AI service is running' 
        });
        return true;
      } else {
        setApiStatus({ 
          status: 'error', 
          message: 'API health check failed' 
        });
        return false;
      }
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus({ 
        status: 'error', 
        message: 'Cannot connect to AI service' 
      });
      return false;
    }
  }, []);

  // Send message hook
  const sendMessage = useCallback(async (
    content: string, 
    personality: string = 'aithen_core',
    maxTokens: number = 512
  ) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('Sending message to:', getApiChatStreamUrl());
      
      // Try SSE endpoint first, fallback to regular stream
      const streamUrl = getApiChatStreamUrl().replace('/stream', '/sse');
      console.log('Using stream URL:', streamUrl);
      
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          personality,
          max_tokens: maxTokens,
          stream: true
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        // If SSE endpoint fails, try regular streaming endpoint
        if (streamUrl.includes('/sse')) {
          console.log('SSE endpoint failed, trying regular streaming endpoint...');
          const regularStreamUrl = getApiChatStreamUrl();
          const fallbackResponse = await fetch(regularStreamUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'text/plain',
            },
            body: JSON.stringify({
              messages: [...messages, userMessage].map(msg => ({
                role: msg.role,
                content: msg.content
              })),
              personality,
              max_tokens: maxTokens,
              stream: true
            }),
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`API Error: ${fallbackResponse.status} - ${await fallbackResponse.text()}`);
          }
          
          // Use the fallback response - handle it inline
          const fallbackReader = fallbackResponse.body?.getReader();
          const fallbackDecoder = new TextDecoder();
          
          if (fallbackReader) {
            while (true) {
              const { done, value } = await fallbackReader.read();
              if (done) break;

              const chunk = fallbackDecoder.decode(value, { stream: true });
              if (chunk.trim()) {
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  )
                );
              }
            }
          }
          return;
        }
        
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (reader) {
        console.log('Starting to read stream...');
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream completed');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.substring(6); // Remove 'data: ' prefix
              
              if (data === '[DONE]') {
                console.log('Stream finished with [DONE]');
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content !== undefined) {
                  console.log('Parsed content:', parsed.content);
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: msg.content + parsed.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', data, e);
                // Fallback: treat as plain text if JSON parsing fails
                if (data.trim()) {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: msg.content + data }
                        : msg
                    )
                  );
                }
              }
            }
          }
        }
      } else {
        console.error('No reader available');
        throw new Error('No response body reader available');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // Clear conversation hook
  const clearConversation = useCallback(() => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Aithen, your AI assistant. How can I help you today?',
      timestamp: new Date()
    }]);
  }, []);

  // Get conversation history
  const getConversationHistory = useCallback(() => {
    return messages.slice(1); // Exclude initial greeting
  }, [messages]);

  // Export conversation
  const exportConversation = useCallback(() => {
    const conversation = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }));
    
    const blob = new Blob([JSON.stringify(conversation, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aithen-conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages]);

  return {
    messages,
    isLoading,
    apiStatus,
    messagesEndRef,
    sendMessage,
    clearConversation,
    getConversationHistory,
    exportConversation,
    checkApiHealth,
    isUsingProdApi: isUsingProdApi(),
    apiUrl: getApiUrl()
  };
};

// Personalities hook
export const usePersonalities = () => {
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all personalities
  const fetchPersonalities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(getApiPersonalitiesUrl());
      if (response.ok) {
        const data = await response.json();
        setPersonalities(data);
      } else {
        throw new Error('Failed to fetch personalities');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch specific personality
  const fetchPersonality = useCallback(async (id: string): Promise<Personality | null> => {
    try {
      const response = await fetch(getApiPersonalityUrl(id));
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (err) {
      console.error('Error fetching personality:', err);
      return null;
    }
  }, []);

  return {
    personalities,
    isLoading,
    error,
    fetchPersonalities,
    fetchPersonality
  };
};

// Chat suggestions hook
export const useChatSuggestions = () => {
  const suggestions = [
    {
      title: "Plan a trip",
      description: "Help me plan a weekend getaway",
      prompt: "Help me plan a weekend getaway"
    },
    {
      title: "Write code",
      description: "Generate a Python function",
      prompt: "Generate a Python function that calculates the factorial of a number"
    },
    {
      title: "Analyze data",
      description: "Help me understand my data",
      prompt: "Help me analyze and understand my data better"
    },
    {
      title: "Creative writing",
      description: "Help me write a story",
      prompt: "Help me write a creative short story"
    },
    {
      title: "Explain concepts",
      description: "Break down complex topics",
      prompt: "Explain quantum computing in simple terms"
    },
    {
      title: "Solve problems",
      description: "Help me troubleshoot issues",
      prompt: "Help me solve a technical problem I'm facing"
    }
  ];

  return { suggestions };
};

// API configuration hook
export const useApiConfig = () => {
  const apiInfo = getApiInfo();
  
  return {
    ...apiInfo,
    isProduction: isUsingProdApi(),
    isDevelopment: !isUsingProdApi()
  };
};