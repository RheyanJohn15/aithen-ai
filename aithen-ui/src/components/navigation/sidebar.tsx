'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SidebarProps {
  onNewChat: () => void;
  onSettingsClick: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ onNewChat, onSettingsClick, isOpen = false, onToggle }: SidebarProps) {
  const [chatHistory] = useState<string[]>([
    'Chat 1',
    'Chat 2',
    'Chat 3',
  ]);

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
              onClick={onNewChat}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg transition-colors font-medium text-sm font-heading"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
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
            <div className="space-y-1">
              {chatHistory.length > 0 ? (
                chatHistory.map((chat, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-2 group"
                  >
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-[var(--color-aithen-teal)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="flex-1 truncate">{chat}</span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">
                  No chat history
                </p>
              )}
            </div>
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

