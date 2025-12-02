import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/api/auth';

export interface WebSocketMessage {
  type: string;
  channel: string;
  data?: any;
  progress?: {
    current_file: number;
    total_files: number;
    current_chunk: number;
    total_chunks: number;
    percentage: number;
    status: string;
    current_file_url?: string;
    message?: string;
  };
  error?: string;
}

export interface UseWebSocketOptions {
  channel: string | null;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  enabled?: boolean;
}

export function useWebSocket({
  channel,
  onMessage,
  onError,
  onOpen,
  onClose,
  enabled = true,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Use refs for callbacks to avoid recreating connection when callbacks change
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
  }, [onMessage, onError, onOpen, onClose]);

  const connect = useCallback(() => {
    if (!channel || !enabled) {
      return;
    }

    // Get API base URL and convert to WebSocket URL
    const apiUrl = getApiUrl(); // e.g., "http://localhost:8080/api"
    // Convert http/https to ws/wss and remove /api suffix if present
    const wsBaseUrl = apiUrl
      .replace(/^https?:\/\//, '') // Remove http:// or https://
      .replace(/\/api$/, ''); // Remove /api suffix if present
    const protocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
    
    // Get authentication token
    const token = getToken();
    if (!token) {
      console.error('WebSocket: No authentication token available');
      onErrorRef.current?.(new Event('no_token'));
      return;
    }
    
    // Include token in query params (WebSocket doesn't support custom headers easily)
    const wsUrl = `${protocol}//${wsBaseUrl}/api/ws?channel=${encodeURIComponent(channel)}&token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        onOpenRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        // WebSocket error events don't have much detail, log connection state instead
        // Only log errors if connection was actually established or if it's a real error
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          const errorMessage = ws.readyState === WebSocket.CONNECTING
            ? 'WebSocket connection failed'
            : 'WebSocket error occurred';
          // Only log if not in a reconnection attempt to avoid spam
          if (reconnectAttemptsRef.current === 0) {
            console.warn('WebSocket error:', errorMessage, {
              readyState: ws.readyState,
              url: wsUrl,
            });
            onErrorRef.current?.(error);
          }
        }
        // Don't log CLOSED state errors as they're handled by onclose
      };

      ws.onclose = (event) => {
        const wasConnected = isConnected;
        setIsConnected(false);
        
        // Only log if it was an unexpected closure (not normal closure or going away)
        // Code 1000 = normal closure, 1001 = going away
        if (event.code !== 1000 && event.code !== 1001 && wasConnected) {
          console.warn('WebSocket connection closed unexpectedly', {
            code: event.code,
            reason: event.reason || 'No reason provided',
            wasClean: event.wasClean,
          });
        }
        
        // Only call onClose if we were actually connected
        if (wasConnected) {
          onCloseRef.current?.();
        }

        // Attempt to reconnect only if:
        // 1. Not a normal closure
        // 2. Channel still exists and enabled
        // 3. Haven't exceeded max attempts
        if (event.code !== 1000 && event.code !== 1001 && 
            channel && enabled && 
            reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            // Only reconnect if channel still exists
            if (channel && enabled) {
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts && wasConnected) {
          // Max reconnection attempts reached - only notify if we were connected
          console.warn('WebSocket: Max reconnection attempts reached');
          onErrorRef.current?.(new Event('max_reconnect_attempts'));
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      onErrorRef.current?.(error as Event);
    }
  }, [channel, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      // Only close if connection is open or connecting (not already closed)
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close(1000, 'Client disconnecting'); // Normal closure
      }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (channel && enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Cleanup on unmount or when channel/enabled changes
      disconnect();
    };
  }, [channel, enabled]); // Remove connect/disconnect from deps to avoid unnecessary re-renders

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
  };
}

