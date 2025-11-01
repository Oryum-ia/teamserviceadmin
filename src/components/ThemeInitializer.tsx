"use client";

import { useEffect, useState } from 'react';

export function ThemeInitializer() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side and after component is mounted
    if (!isClient || typeof window === 'undefined') return;
    
    // Force initial theme application
    const initializeTheme = () => {
      const root = document.documentElement;
      const body = document.body;
      
      // Get stored theme or default to light
      const storedTheme = localStorage.getItem('teamservice-theme') || 'light';
      
      let appliedTheme: 'light' | 'dark' = 'light';
      
      if (storedTheme === 'system') {
        appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        appliedTheme = storedTheme as 'light' | 'dark';
      }
      
      // Remove any existing theme classes
      root.classList.remove('light', 'dark');
      body.classList.remove('light', 'dark');
      
      // Add the correct theme
      root.classList.add(appliedTheme);
      body.classList.add(appliedTheme);
      
      // Set attributes
      root.setAttribute('data-theme', appliedTheme);
      body.setAttribute('data-theme', appliedTheme);
      
      console.log('🔧 Theme initialized:', appliedTheme);
    };
    
    // Initialize immediately
    initializeTheme();
    
    // Also listen for storage changes (in case theme is changed in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teamservice-theme') {
        initializeTheme();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);
  
  return null; // This component doesn't render anything
}