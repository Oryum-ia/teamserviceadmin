"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  mounted: false,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "teamservice-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    try {
      // Get stored theme
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        setTheme(storedTheme);
      }

      const root = document.documentElement;
      const body = document.body;

      // Remove all theme classes first
      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');

      // Add the current theme class
      root.classList.add(theme);
      body.classList.add(theme);

      // Set data attribute for CSS selectors
      root.setAttribute('data-theme', theme);
      body.setAttribute('data-theme', theme);

      console.log('🎨 Theme applied:', theme);
      console.log('📋 HTML classes:', root.className);
      console.log('📋 Body classes:', body.className);
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  }, [theme, mounted, storageKey]);

  const value = {
    theme,
    mounted,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      if (mounted && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch (error) {
          console.error('Error saving theme:', error);
        }
      }
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};