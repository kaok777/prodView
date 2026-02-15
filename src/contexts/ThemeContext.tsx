import { createContext, useContext, useEffect, useState } from "react";
import { StorageService, StorageKeys } from "../services/StorageService";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Validates theme value from storage
 * Fixed: MEDIUM-F6 - Theme Validation Gaps
 */
function validateTheme(value: unknown): Theme {
  if (value === "light" || value === "dark") {
    return value;
  }
  // Default to light theme if invalid value
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = StorageService.get<Theme>(StorageKeys.THEME);
    return validateTheme(saved);
  });

  useEffect(() => {
    StorageService.set(StorageKeys.THEME, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
