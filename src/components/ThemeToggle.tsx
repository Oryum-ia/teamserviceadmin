"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center justify-center rounded-lg w-10 h-10 bg-gray-50 border border-gray-300 transition-all duration-200"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5 text-gray-400" />
      </button>
    );
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-lg w-10 h-10 border transition-all duration-200 ${
        theme === "light" 
          ? "bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-700 hover:text-gray-900" 
          : "bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300 hover:text-gray-100"
      }`}
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </button>
  );
}