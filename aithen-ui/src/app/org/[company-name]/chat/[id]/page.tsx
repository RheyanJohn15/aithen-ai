'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAi } from '@/hooks/ai/useAi';
import { getChat } from '@/api';
import Header from '@/components/navigation/header';
import Sidebar from '@/components/navigation/sidebar';
import Message from '@/components/chat/message';
import { AlertCircle, Plus, Mic, Send } from 'lucide-react';

// Client-only timestamp component to avoid hydration mismatch
const FormattedTimestamp = ({ timestamp }: { timestamp: Date }) => {
  const [clientTime, setClientTime] = useState('');

  useEffect(() => {
    setClientTime(timestamp.toLocaleTimeString());
  }, [timestamp]);

  return <>{clientTime}</>;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params?.id as string;
  const initialMessage = searchParams?.get('initialMessage');
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearConversation,
    checkApiHealth,
    setMessages 
  } = useAi();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [chatTitle, setChatTitle] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const hasSentInitialMessageRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat data on mount with retry logic
  useEffect(() => {
    const loadChat = async (retryCount = 0) => {
      if (!chatId) return;
      
      const maxRetries = 3;
      const retryDelay = 500; // 500ms delay between retries
      
      try {
        setIsLoadingChat(true);
        // Keep chat ID as string to avoid precision loss with large Snowflake IDs
        // JavaScript Number can only safely represent integers up to 2^53-1
        // Snowflake IDs are int64 and can exceed this, causing precision loss
        
        const response = await getChat(chatId); // Pass as string
        
        // Check if response and data exist
        if (!response || !response.data) {
          throw new Error('Invalid response from server');
        }
        
        const { chat, messages: chatMessages } = response.data;
        
        if (!chat) {
          throw new Error('Chat not found');
        }
        
        setChatTitle(chat.title);
        
        // Load existing messages from the chat
        const messagesArray = Array.isArray(chatMessages) ? chatMessages : [];
        
        if (messagesArray.length > 0) {
          // Convert API messages to useAi format
          const loadedMessages = messagesArray.map(msg => ({
            id: String(msg.id),
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }));
          
          // Set messages in the hook (replace the default greeting)
          setMessages(loadedMessages);
        } else if (initialMessage && !hasSentInitialMessageRef.current) {
          // If no messages exist and there's an initial message from redirect, send it
          hasSentInitialMessageRef.current = true;
          // Get organization slug from params
          const companyName = params?.['company-name'] as string || '';
          // Remove the query parameter from URL for cleaner navigation
          const newUrl = companyName ? `/org/${companyName}/chat/${chatId}` : `/chat/${chatId}`;
          window.history.replaceState({}, '', newUrl);
          // Send the initial message after a brief delay to ensure smooth transition
          // Note: sendMessage now skips the initial greeting message automatically
          setTimeout(() => {
            sendMessage(initialMessage);
          }, 100);
        }
        
      } catch (error: any) {
        // Try to extract error information
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        const errorStatus = error?.status || error?.response?.status;
        
        // Retry logic for 404 errors (chat might not be committed to database yet)
        if (errorStatus === 404 && retryCount < maxRetries) {
          setTimeout(() => {
            loadChat(retryCount + 1);
          }, retryDelay);
          return;
        }
        
        // Don't set loading to false if we're retrying
        if (retryCount < maxRetries && errorStatus === 404) {
          return;
        }
        
        // Don't redirect - show error on page for debugging
        const errorMsg = `Failed to load chat: ${errorMessage} (Status: ${errorStatus || 'unknown'})`;
        setError(errorMsg);
        setIsLoadingChat(false);
      } finally {
        // Set loading to false if not retrying
        const errorStatus = (error as any)?.status || (error as any)?.response?.status;
        if (!(errorStatus === 404 && retryCount < maxRetries)) {
          setIsLoadingChat(false);
        }
      }
    };

    loadChat(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, initialMessage]);

  // Check API health on component mount (non-blocking)
  useEffect(() => {
    // Delay health check slightly to avoid race conditions
    const timer = setTimeout(() => {
      checkApiHealth().catch(() => {
        // Silently fail - health check is optional
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [checkApiHealth]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    // Pass chatId to save messages to database
    await sendMessage(message, 'aithen_core', 512, chatId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    // Sidebar handles new chat creation now
    setSidebarOpen(false); // Close sidebar on mobile after selecting
  };

  const handleSettingsClick = () => {
    // Navigate to settings or open settings modal
    setSidebarOpen(false); // Close sidebar on mobile
  };

  if (isLoadingChat) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--color-aithen-teal)] mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading chat...</p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-red-700 dark:text-red-300 font-semibold mb-1.5">Error:</p>
              <p className="text-xs text-red-600 dark:text-red-400 break-all">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-white dark:bg-gray-900">
        <Sidebar
          onNewChat={handleNewChat}
          onSettingsClick={handleSettingsClick}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex-1 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
            <div className="max-w-2xl w-full">
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-2 sm:space-x-2.5">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-red-800 dark:text-red-200 mb-1 sm:mb-1.5">
                      Failed to Load Chat
                    </h3>
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mb-2 sm:mb-3 break-all">
                      {error}
                    </p>
                    <div className="space-y-1 sm:space-y-1.5 text-xs text-red-500 dark:text-red-500">
                      <p><strong>Chat ID:</strong> {chatId}</p>
                      <p><strong>Check console</strong> for more details</p>
                    </div>
                    <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setError(null);
                          setIsLoadingChat(true);
                          window.location.reload();
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => {
                          const companyName = params?.['company-name'] as string || '';
                          router.push(companyName ? `/org/${companyName}` : '/');
                        }}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                      >
                        Go Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        onNewChat={handleNewChat}
        onSettingsClick={handleSettingsClick}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Messages - ChatGPT style */}
        <div className="flex-1 overflow-y-auto">
        {messages.length === 1 ? (
          // Welcome screen when only initial message
          <div className="flex flex-col items-center justify-center h-full px-3 sm:px-4 py-4 sm:py-6">
            <div className="text-center max-w-2xl w-full">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 font-heading">
                {chatTitle || 'Chat'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Continue your conversation
              </p>
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
            {messages.slice(1).map((message, index, array) => {
              const isLast = index === array.length - 1;
              return (
                <Message
                  key={message.id}
                  id={message.id}
                  role={message.role}
                  content={message.content}
                  isLoading={isLoading && message.role === 'assistant' && !message.content.trim()}
                  isLast={isLast}
                />
              );
            })}
            
            {/* Only show separate loading indicator if there's no empty assistant message */}
            {isLoading && messages.slice(1).filter(m => m.role === 'assistant' && !m.content.trim()).length === 0 && (
              <Message
                id="loading"
                role="assistant"
                content=""
                isLoading={true}
                isLast={true}
              />
            )}
          </div>
        )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - ChatGPT style */}
        <div className="border-t border-gray-200/60 dark:border-gray-700/60 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="flex items-center border border-gray-300/60 dark:border-gray-600/60 rounded-xl bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow">
              <button className="p-2 sm:p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything"
                className="flex-1 resize-none border-0 bg-transparent px-2 sm:px-3 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none min-h-[44px]"
                rows={1}
                disabled={isLoading}
              />
              <div className="flex items-center space-x-0.5 sm:space-x-1 p-1 sm:p-1.5 flex-shrink-0">
                <button 
                  type="button"
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Voice input"
                >
                  <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className={`
                    p-1.5 sm:p-2 rounded-lg transition-all duration-200 flex-shrink-0
                    ${!input.trim() || isLoading
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-white bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)] shadow-sm hover:shadow-md'
                    }
                  `}
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 text-center px-2">
              Aithen can make mistakes. Consider checking important information.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
