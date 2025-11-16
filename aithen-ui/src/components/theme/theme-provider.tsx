'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with 'light' to match server-side default
  // The blocking script in layout.tsx will apply the correct theme before hydration
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // On mount, read the actual theme from the DOM (set by blocking script) or localStorage
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const hasDarkClass = root.classList.contains('dark');
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      
      // Determine actual theme
      let actualTheme: Theme;
      if (savedTheme) {
        actualTheme = savedTheme;
      } else if (hasDarkClass) {
        actualTheme = 'dark';
      } else {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      setThemeState(actualTheme);
      // Apply theme class if not already applied
      if (actualTheme === 'dark' && !hasDarkClass) {
        root.classList.add('dark');
      } else if (actualTheme === 'light' && hasDarkClass) {
        root.classList.remove('dark');
      }
      setMounted(true);
    }
  }, []);

  const updateTheme = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    updateTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Always provide the context, even before mount
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

