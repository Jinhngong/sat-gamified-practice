import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      applyTheme(initial);
    }
  }, []);

  const applyTheme = (mode) => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.style.setProperty("--color-bg", "#121212");
      root.style.setProperty("--color-text", "#e0e0e0");
      root.style.setProperty("--color-surface", "#1e1e1e");
    } else {
      root.style.setProperty("--color-bg", "#ffffff");
      root.style.setProperty("--color-text", "#000000");
      root.style.setProperty("--color-surface", "#f5f5f5");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
