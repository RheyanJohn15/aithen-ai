'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { getChats, createChat, type Chat } from '@/api';
import { Plus, X, MessageCircle, Loader2 } from 'lucide-react';

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
      
      // Get organization slug from pathname
      const orgMatch = pathname.match(/^\/org\/([^/]+)/);
      const orgSlug = orgMatch ? orgMatch[1] : '';
      
      // Redirect to the new chat page with org slug
      router.push(orgSlug ? `/org/${orgSlug}/chat/${chatId}` : `/chat/${chatId}`);
      
      // Refresh chat list
      await loadChats();
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    // Get organization slug from pathname
    const orgMatch = pathname.match(/^\/org\/([^/]+)/);
    const orgSlug = orgMatch ? orgMatch[1] : '';
    
    // Chat IDs are always strings to preserve precision (handled by backend JSON marshaling)
    router.push(orgSlug ? `/org/${orgSlug}/chat/${chatId}` : `/chat/${chatId}`);
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
        <div className="p-3 border-b border-gray-200/60 dark:border-gray-700/60">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-3 px-2">
            <div className="relative h-7 w-7 dark:hidden">
              <Image 
                src="/logo/nobg/logo-light.png" 
                alt="Aithens AI Logo" 
                fill
                className="object-contain"
              />
            </div>
            <div className="relative h-7 w-7 hidden dark:block">
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
              className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)] text-white rounded-lg transition-all font-medium text-sm font-heading disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isCreatingChat ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </>
              )}
            </button>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
              Recent Chats
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-aithen-teal)]"></div>
              </div>
            ) : chats && Array.isArray(chats) && chats.length > 0 ? (
              <div className="space-y-0.5">
                {chats.map((chat) => {
                  // Get organization slug from pathname
                  const orgMatch = pathname.match(/^\/org\/([^/]+)/);
                  const orgSlug = orgMatch ? orgMatch[1] : '';
                  const chatPath = orgSlug ? `/org/${orgSlug}/chat/${chat.id}` : `/chat/${chat.id}`;
                  const isActive = pathname === chatPath;
                  return (
                    <button
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-sm transition-colors flex items-center space-x-2 group ${
                        isActive
                          ? 'bg-[var(--color-aithen-teal)]/10 dark:bg-[var(--color-aithen-teal)]/20 text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)]'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80'
                      }`}
                    >
                      <MessageCircle 
                        className={`w-3.5 h-3.5 transition-colors ${
                          isActive
                            ? 'text-[var(--color-aithen-teal)] dark:text-[var(--color-aithen-teal-light)]'
                            : 'text-gray-400 group-hover:text-[var(--color-aithen-teal)]'
                        }`} 
                      />
                      <span className="flex-1 truncate">{chat.title}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <MessageCircle className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1.5">
                  No chat history yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Start a conversation to see it here
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

