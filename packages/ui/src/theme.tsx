import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'light' | 'dark';

const LS_KEY = 'qwipo:theme';

interface ThemeCtx {
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx | null>(null);

/**
 * Dark mode is driven by a `.dark` class on <html> — that is the contract
 * @mockups/design-tokens/theme.css reads (`@custom-variant dark (&:is(.dark *))`).
 *
 * The previous implementation set only a `data-theme` attribute, which the CSS
 * never read, so the in-app toggle changed nothing. We now toggle the class
 * (and keep the attribute for any consumer that reads it).
 */
function applyToDom(next: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', next === 'dark');
  root.setAttribute('data-theme', next);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = window.localStorage.getItem(LS_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Design reference is light-first — default to light regardless of OS
    // preference. Dark stays available via the in-app toggle.
    return 'light';
  });

  useEffect(() => {
    applyToDom(theme);
    try {
      window.localStorage.setItem(LS_KEY, theme);
    } catch {
      /* localStorage disabled — ignore */
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    []
  );

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme, setTheme, toggleTheme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
