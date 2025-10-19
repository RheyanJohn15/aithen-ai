'use client';

import { useRef, useEffect, useState } from 'react';
import { useAi, useApiConfig } from '../hooks/ai/useAi';

// Client-only timestamp component to avoid hydration mismatch
const FormattedTimestamp = ({ timestamp }: { timestamp: Date }) => {
  const [clientTime, setClientTime] = useState('');

  useEffect(() => {
    setClientTime(timestamp.toLocaleTimeString());
  }, [timestamp]);

  return <>{clientTime}</>;
};

export default function Home() {
  const { 
    messages, 
    isLoading, 
    apiStatus, 
    sendMessage, 
    clearConversation,
    checkApiHealth 
  } = useAi();
  
  const { isProduction } = useApiConfig();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
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

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header - ChatGPT style */}
      <header className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div></div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aithen
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus.status === 'connected' ? 'bg-green-500' : 
              apiStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {apiStatus.status === 'connected' ? 'Connected' : 
               apiStatus.status === 'error' ? 'Disconnected' : 'Checking...'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({isProduction ? 'PROD' : 'DEV'})
            </span>
          </div>
        </div>
      </header>

      {/* Messages - ChatGPT style */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 1 ? (
          // Welcome screen when only initial message
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-center max-w-2xl">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                What's on the agenda today?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                <div 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Help me plan a weekend getaway")}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Plan a trip</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Help me plan a weekend getaway</p>
                </div>
                <div 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Generate a Python function that calculates the factorial of a number")}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Write code</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generate a Python function</p>
                </div>
                <div 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Help me analyze and understand my data better")}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Analyze data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Help me understand my data</p>
                </div>
                <div 
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => setInput("Help me write a creative short story")}
                >
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Creative writing</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Help me write a story</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat messages
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.slice(1).map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 py-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {message.role === 'user' ? 'U' : 'A'}
                </div>
                
                {/* Message content */}
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-4 py-6">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  A
                </div>
                <div className="flex-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - ChatGPT style */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
              <button className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything"
                className="flex-1 resize-none border-0 bg-transparent px-3 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                rows={1}
                disabled={isLoading}
              />
              <div className="flex items-center space-x-2 p-3">
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Aithen can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  );
}
