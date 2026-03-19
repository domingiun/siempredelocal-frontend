import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'themeMode';

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem(STORAGE_KEY) || 'dark';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (mode === 'dark') {
      document.body.dataset.theme = 'dark';
    } else {
      delete document.body.dataset.theme;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  const value = useMemo(() => {
    const toggleTheme = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
    return { mode, setMode, toggleTheme };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
