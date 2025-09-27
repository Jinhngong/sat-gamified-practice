import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference, default to dark
    const saved = localStorage.getItem('sat_theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('sat_theme', isDarkMode ? 'dark' : 'light');
    
    // Update document class for global styling
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Update CSS custom properties for theme colors
    const root = document.documentElement;
    const colors = isDarkMode ? darkColors : lightColors;
    
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set preference
      const saved = localStorage.getItem('sat_theme');
      if (!saved) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Define color palettes
  const lightColors = {
    primary: '#3b82f6',
    'primary-hover': '#2563eb',
    'primary-light': '#dbeafe',
    secondary: '#6b7280',
    accent: '#10b981',
    'accent-light': '#d1fae5',
    background: '#ffffff',
    surface: '#f8fafc',
    'surface-secondary': '#f1f5f9',
    'surface-hover': '#e2e8f0',
    text: '#1f2937',
    'text-secondary': '#6b7280',
    'text-muted': '#9ca3af',
    border: '#e5e7eb',
    'border-light': '#f3f4f6',
    error: '#ef4444',
    'error-light': '#fef2f2',
    warning: '#f59e0b',
    'warning-light': '#fffbeb',
    success: '#10b981',
    'success-light': '#ecfdf5',
    info: '#3b82f6',
    'info-light': '#eff6ff',
  };

  const darkColors = {
    primary: '#60a5fa',
    'primary-hover': '#3b82f6',
    'primary-light': '#1e3a8a',
    secondary: '#9ca3af',
    accent: '#34d399',
    'accent-light': '#064e3b',
    background: '#0f172a',
    surface: '#1e293b',
    'surface-secondary': '#334155',
    'surface-hover': '#475569',
    text: '#f1f5f9',
    'text-secondary': '#cbd5e1',
    'text-muted': '#94a3b8',
    border: '#475569',
    'border-light': '#334155',
    error: '#f87171',
    'error-light': '#7f1d1d',
    warning: '#fbbf24',
    'warning-light': '#78350f',
    success: '#34d399',
    'success-light': '#064e3b',
    info: '#60a5fa',
    'info-light': '#1e3a8a',
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? darkColors : lightColors,
    // Utility functions
    getColor: (colorName) => {
      return isDarkMode ? darkColors[colorName] : lightColors[colorName];
    },
    // CSS classes for common patterns
    classes: {
      card: `rounded-lg border transition-all duration-200`,
      button: `px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2`,
      input: `px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2`,
      text: {
        primary: isDarkMode ? 'text-slate-100' : 'text-gray-900',
        secondary: isDarkMode ? 'text-slate-300' : 'text-gray-600',
        muted: isDarkMode ? 'text-slate-400' : 'text-gray-500',
      },
      bg: {
        primary: isDarkMode ? 'bg-slate-900' : 'bg-white',
        secondary: isDarkMode ? 'bg-slate-800' : 'bg-gray-50',
        surface: isDarkMode ? 'bg-slate-700' : 'bg-white',
      },
      border: isDarkMode ? 'border-slate-600' : 'border-gray-200',
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
