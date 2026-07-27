import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="relative flex h-8 w-14 items-center rounded-full bg-bg-raised border border-border/20 px-1 transition-colors"
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm transition-transform duration-200"
        style={{ transform: isDark ? 'translateX(0)' : 'translateX(24px)' }}
      >
        {isDark ? <Moon size={13} /> : <Sun size={13} />}
      </span>
    </button>
  )
}
