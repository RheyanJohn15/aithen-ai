'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { getChats, createChat, type Chat } from '@/api';

interface SidebarProps {
  onNewChat?: () => void;
  onSettingsClick: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ onNewChat, onSettingsClick, isOpen = false, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Load chats function
  const loadChats = async () => {
    try {
      setIsLoading(true);
      const response = await getChats();
      // Ensure we always have an array, even if API returns null/undefined
      // IDs are now strings to preserve precision (handled by backend JSON marshaling)
      setChats(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load chats on initial mount and when pathname changes (new chat created or navigated)
  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleNewChat = async () => {
    if (isCreatingChat) return;
    
    setIsCreatingChat(true);
    try {
      // Create a new chat
      const response = await createChat({ title: 'New Chat' });
      // Convert to string to preserve precision (should already be string from JSON reviver)
      const chatId = String(response.data.id);
      
      // Call the onNewChat callback if provided
      if (onNewChat) {
        onNewChat();
      }
      
      // Redirect to the new chat page
      router.push(`/chat/${chatId}`);
      
      // Refresh chat list
      await loadChats();
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    // Chat IDs are always strings to preserve precision (handled by backend JSON marshaling)
    router.push(`/chat/${chatId}`);
    if (onToggle) {
      onToggle(); // Close sidebar on mobile
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 bg-white dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-4 px-2">
            <div className="relative h-8 w-8 dark:hidden">
              <Image 
                src="/logo/nobg/logo-light.png" 
                alt="Aithens AI Logo" 
                fill
                className="object-contain"
              />
            </div>
            <div className="relative h-8 w-8 hidden dark:block">
              <Image 
                src="/logo/nobg/logo-dark.png" 
                alt="Aithens AI Logo" 
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white font-heading">
              Aithens AI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              disabled={isCreatingChat}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg transition-colors font-medium text-sm font-heading disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingChat ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Chat</span>
                </>
              )}
            </button>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
              Recent Chats
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
              </div>
            ) : chats && Array.isArray(chats) && chats.length > 0 ? (
              <div className="space-y-1">
                {chats.map((chat) => {
                  const isActive = pathname === `/chat/${chat.id}`;
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 group ${
                        isActive
                          ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <svg 
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-gray-400 group-hover:text-[var(--color-aithen-teal)]'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="flex-1 truncate">{chat.title}{chat.id}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <svg 
                  className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
                  No chat history yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Start a conversation to see it here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Advanced Settings */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Advanced Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}

