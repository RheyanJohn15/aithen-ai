'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAi, useApiConfig } from '../../hooks/ai/useAi';
import { signout } from '../../api';
import { useTheme } from '../theme/theme-provider';
import { getUserSession, clearUserSession } from '@/lib/session';
import type { User } from '@/api/authApi';
import { useRouter } from 'next/navigation';
import { Menu, Moon, Sun, User as UserIcon, Settings, LogOut } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { apiStatus } = useAi();
  const { isProduction } = useApiConfig();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); 
  // Load user data from session storage on mount
  useEffect(() => {
    const sessionUser = getUserSession();
    setUser(sessionUser);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await signout();
      // Clear user session from session storage
      clearUserSession();
      // Get organization slug from pathname or use default
      const pathname = window.location.pathname;
      const orgMatch = pathname.match(/^\/org\/([^/]+)/);
      const orgSlug = orgMatch ? orgMatch[1] : '';
      // Redirect to login page with org slug
      window.location.href = orgSlug ? `/org/${orgSlug}/login` : '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear session and redirect even if server logout fails
      clearUserSession();
      const pathname = window.location.pathname;
      const orgMatch = pathname.match(/^\/org\/([^/]+)/);
      const orgSlug = orgMatch ? orgMatch[1] : '';
      window.location.href = orgSlug ? `/org/${orgSlug}/login` : '/login';
    }
  };

  // Get user initial for avatar
  const getUserInitial = (): string => {
    if (!user?.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  const handleProfile = () => {
    setIsMenuOpen(false);
    // Navigate to profile page
    // router.push('/profile');
    console.log('Navigate to profile');
  };

  const handleSettings = () => {
    setIsMenuOpen(false);
    // Get organization slug from pathname or use default
    const pathname = window.location.pathname;
    const orgMatch = pathname.match(/^\/org\/([^/]+)/);
    const orgSlug = orgMatch ? orgMatch[1] : '';
    // Navigate to settings page with org slug
    router.push(orgSlug ? `/org/${orgSlug}/settings` : '/settings');
  };

  return (
    <header className="border-b border-gray-200/60 dark:border-gray-700/60 px-4 py-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button */}
        <div>
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Center - Logo and Title */}
        <div className="flex items-center space-x-2">
          <div className="relative h-7 w-7 dark:hidden">
            <Image 
              src="/logo/nobg/logo-light.png" 
              alt="Aithens AI Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="relative h-7 w-7 hidden dark:block">
            <Image 
              src="/logo/nobg/logo-dark.png" 
              alt="Aithens AI Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-sm font-semibold text-gray-900 dark:text-white font-heading">
            Aithens AI
          </h1>
        </div>

        {/* Right side - Status, Theme Toggle, and User Menu */}
        <div className="flex items-center space-x-2.5">
          {/* API Status */}
          <div className="flex items-center space-x-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${
              apiStatus.status === 'connected' ? 'bg-green-500' : 
              apiStatus.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              {apiStatus.status === 'connected' ? 'Connected' : 
               apiStatus.status === 'error' ? 'Disconnected' : 'Checking...'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
              ({isProduction ? 'PROD' : 'DEV'})
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            suppressHydrationWarning
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {/* User Avatar Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-aithen-teal)] hover:bg-[var(--color-aithen-teal-dark)] text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-aithen-teal)] focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              aria-label="User menu"
            >
              <span className="text-xs font-medium">{getUserInitial()}</span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200/60 dark:border-gray-700/60 py-1 z-50 backdrop-blur-sm">
                {/* User Info */}
                <div className="px-3 py-2 border-b border-gray-200/60 dark:border-gray-700/60">
                  <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>

                {/* Menu Items */}
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors flex items-center space-x-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={handleSettings}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>

                <div className="border-t border-gray-200/60 dark:border-gray-700/60 my-1"></div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
