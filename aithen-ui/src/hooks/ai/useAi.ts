import { useState, useCallback, useRef } from 'react';
import { 
  streamChatWithCallback,
  getPersonalities,
  getPersonality,
  getBaseUrl,
  type ChatMessage as ApiChatMessage,
  type Personality as ApiPersonality,
} from '@/api';
import { addMessage } from '@/api/chatApi';
import { getUserSession } from '@/lib/session';

// Helper to check if using production API
const isUsingProdApi = (): boolean => {
  return process.env.NEXT_PUBLIC_USE_PROD_API === 'true';
};

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

// Helper function to get initial greeting
const getInitialGreeting = (): string => {
  const user = getUserSession();
  const userName = user?.name || '';
  return userName ? `Hi ${userName}, how may I help you today?` : 'Hi, how may I help you today?';
};

// Main AI hook
export const useAi = () => {
  const [messages, setMessagesState] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getInitialGreeting(),
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ status: 'checking' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Health check hook - optional, doesn't block functionality
  const checkApiHealth = useCallback(async () => {
    // Set status to checking first
    setApiStatus({ status: 'checking', message: 'Checking connection...' });
    
    try {
      // Simple health check - just verify we can reach the API
      const baseUrl = getBaseUrl();
      const pingUrl = `${baseUrl.replace('/api', '')}/ping`;
      
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Don't throw on network errors, just catch them
      });
      
      if (response.ok) {
        setApiStatus({ 
          status: 'connected', 
          message: 'AI service is running' 
        });
        return true;
      } else {
        // Non-200 response, but server is reachable
        setApiStatus({ 
          status: 'connected', 
          message: 'AI service is running' 
        });
        return true;
      }
    } catch (error: any) {
      // Network error - server might not be running, but don't block UI
      console.warn('API health check failed (non-blocking):', error);
      setApiStatus({ 
        status: 'error', 
        message: 'Cannot verify connection (chat may still work)' 
      });
      // Return false but don't throw - allow chat to proceed
      return false;
    }
  }, []);

  // Send message hook
  const sendMessage = useCallback(async (
    content: string, 
    personality: string = 'aithen_core',
    maxTokens: number = 512,
    chatId?: string // Optional chat ID to save messages to database
  ) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessagesState(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Save user message to database if chatId is provided (non-blocking)
    if (chatId) {
      addMessage(chatId, 'user', content.trim()).catch(() => {
        // Silently fail - don't block the UI if saving fails
      });
    }

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    // Track assistant message content for saving to database
    let assistantContent = '';

    setMessagesState(prev => [...prev, assistantMessage]);

    try {
      // Convert messages to API format
      // Skip the initial greeting message (id === '1') to prevent duplicate responses
      const messagesToSend = messages.filter(msg => msg.id !== '1');
      const apiMessages: ApiChatMessage[] = [...messagesToSend, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Use the new streaming API
      await streamChatWithCallback(
        {
          messages: apiMessages,
          personality,
          max_tokens: maxTokens,
        },
        (content) => {
          // Update assistant message with streaming content
          assistantContent += content;
          setMessagesState(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: msg.content + content }
                : msg
            )
          );
        },
        (error) => {
          console.error('Stream error:', error);
          setMessagesState(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                : msg
            )
          );
        },
        async () => {
          // Stream completed - save assistant message to database if chatId is provided
          if (chatId && assistantContent) {
            // Save assistant message (non-blocking)
            addMessage(chatId, 'assistant', assistantContent).catch(() => {
              // Silently fail - don't block the UI if saving fails
            });
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setMessagesState(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  // Clear conversation hook
  const clearConversation = useCallback(() => {
    setMessagesState([{
      id: '1',
      role: 'assistant',
      content: getInitialGreeting(),
      timestamp: new Date()
    }]);
  }, []);

  // Set messages (useful for loading existing chat history)
  const setMessages = useCallback((newMessages: Message[]) => {
    setMessagesState(newMessages);
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
    setMessages,
    apiUrl: getBaseUrl()
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
      const response = await getPersonalities();
      // Fetch each personality detail
      const personalityPromises = response.data.map(id => getPersonality(id));
      const personalityResults = await Promise.all(personalityPromises);
      const personalities = personalityResults
        .map(res => res.data)
        .filter((p): p is ApiPersonality => p !== null) as Personality[];
      setPersonalities(personalities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch specific personality
  const fetchPersonality = useCallback(async (id: string): Promise<Personality | null> => {
    try {
      const response = await getPersonality(id);
      return response.data as Personality;
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
  return {
    apiUrl: getBaseUrl(),
    isProduction: isUsingProdApi(),
    isDevelopment: !isUsingProdApi(),
  };
};