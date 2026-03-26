import { useState, useEffect } from "react";

export type ThemeName = 
  | "monkey"
  | "dracula"
  | "tokyo-night"
  | "nord"
  | "solarized-dark"
  | "solarized-light"
  | "matrix"
  | "gruvbox-dark"
  | "cyberpunk"
  | "midnight"
  | "cafe";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>("monkey");

  // Load initial theme
  useEffect(() => {
    chrome.storage.local.get("theme", (res) => {
      if (res.theme) {
        setThemeState(res.theme as ThemeName);
        document.documentElement.setAttribute("data-theme", res.theme);
      }
    });
  }, []);

  // Listen for cross-context theme changes (e.g. from popup to dashboard)
  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === "local" && changes.theme) {
        setThemeState(changes.theme.newValue as ThemeName);
        document.documentElement.setAttribute("data-theme", changes.theme.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const setTheme = (newTheme: ThemeName) => {
    // Optimistic UI update
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    // Persist
    chrome.storage.local.set({ theme: newTheme });
  };

  return { theme, setTheme };
}
