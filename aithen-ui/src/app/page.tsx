'use client';

import { useRef, useEffect, useState } from 'react';
import { useAi } from '@/hooks/ai/useAi';
import Message from '@/components/chat/message';
import { Plus, Mic, Send } from 'lucide-react';

export default function PublicChat() {
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearConversation,
    checkApiHealth 
  } = useAi();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    clearConversation();
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Simple Header */}
      <header className="border-b border-gray-200/60 dark:border-gray-700/60 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white font-heading truncate pr-2">
            Aithen AI - Public Chat
          </h1>
          {messages.length > 1 && (
            <button
              onClick={handleNewConversation}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap flex-shrink-0"
            >
              <span className="hidden sm:inline">New Conversation</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 1 ? (
          // Welcome screen when only initial message
          <div className="flex flex-col items-center justify-center h-full px-3 sm:px-4 py-4 sm:py-6">
            <div className="text-center max-w-2xl w-full">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3 font-heading">
                Start a conversation
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Ask me anything - no account required
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                <div 
                  className="p-3 sm:p-3.5 border border-gray-200/60 dark:border-gray-700/60 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/80 cursor-pointer transition-all hover:border-[var(--color-aithen-teal)]/30 dark:hover:border-[var(--color-aithen-teal)]/30 hover:shadow-sm"
                  onClick={() => setInput("Help me plan a weekend getaway")}
                >
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-1.5 font-heading">Plan a trip</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Help me plan a weekend getaway</p>
                </div>
                <div 
                  className="p-3 sm:p-3.5 border border-gray-200/60 dark:border-gray-700/60 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/80 cursor-pointer transition-all hover:border-[var(--color-aithen-teal)]/30 dark:hover:border-[var(--color-aithen-teal)]/30 hover:shadow-sm"
                  onClick={() => setInput("Generate a Python function that calculates the factorial of a number")}
                >
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-1.5 font-heading">Write code</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Generate a Python function</p>
                </div>
                <div 
                  className="p-3 sm:p-3.5 border border-gray-200/60 dark:border-gray-700/60 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/80 cursor-pointer transition-all hover:border-[var(--color-aithen-teal)]/30 dark:hover:border-[var(--color-aithen-teal)]/30 hover:shadow-sm"
                  onClick={() => setInput("Help me analyze and understand my data better")}
                >
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-1.5 font-heading">Analyze data</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Help me understand my data</p>
                </div>
                <div 
                  className="p-3 sm:p-3.5 border border-gray-200/60 dark:border-gray-700/60 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-800/80 cursor-pointer transition-all hover:border-[var(--color-aithen-teal)]/30 dark:hover:border-[var(--color-aithen-teal)]/30 hover:shadow-sm"
                  onClick={() => setInput("Help me write a creative short story")}
                >
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-1.5 font-heading">Creative writing</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Help me write a story</p>
                </div>
              </div>
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

      {/* Input */}
      <div className="border-t border-gray-200/60 dark:border-gray-700/60 px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="flex items-center border border-gray-300/60 dark:border-gray-600/60 rounded-xl bg-white dark:bg-gray-800/50 shadow-sm hover:shadow-md transition-shadow">
              <button 
                onClick={handleNewConversation}
                className="p-2 sm:p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                aria-label="New conversation"
                title="New conversation"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className="flex-1 resize-none border-0 bg-transparent px-2 sm:px-3 py-2 sm:py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none min-h-[44px]"
                rows={1}
                disabled={isLoading}
              />
              <div className="flex items-center space-x-0.5 sm:space-x-1 p-1 sm:p-1.5 flex-shrink-0">
                <button 
                  type="button"
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Voice input"
                  title="Voice input (coming soon)"
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
  );
}
