"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle({ className, isCollapsed }: { className?: string; isCollapsed?: boolean }) {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`relative flex items-center gap-2 p-2 rounded-xl transition-all hover:bg-white/50 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground ${className}`}
      aria-label="Alternar tema"
    >
      <Sun size={17} className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon size={17} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      {(!isCollapsed && isCollapsed !== undefined) && (
        <span className="text-sm font-medium">Tema</span>
      )}
    </button>
  )
}
