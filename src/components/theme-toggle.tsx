"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <button
      className="icon-button"
      aria-label="Toggle color theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="sun" size={19} />
      <Moon className="moon" size={19} />
    </button>
  );
}
