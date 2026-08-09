import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "quotwellix-theme";
const LEGACY_STORAGE_KEYS = ["quillora-theme", "quoteapp-theme"];

const readStoredTheme = () => {
  if (typeof window === "undefined") return "system";
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return current;
  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return legacy;
  }
  return "system";
};

const getSystemDark = () =>
  window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;

const resolveDark = (theme) => {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return getSystemDark();
};

const applyThemeClass = (theme) => {
  const root = document.documentElement;
  const dark = resolveDark(theme);
  root.classList.toggle("dark", dark);
  root.dataset.theme = theme;
  root.style.colorScheme = dark ? "dark" : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => readStoredTheme());
  const [isDark, setIsDark] = useState(() =>
    typeof window === "undefined" ? false : resolveDark(readStoredTheme())
  );

  const setTheme = useCallback((next) => {
    const value = ["light", "dark", "system"].includes(next) ? next : "system";
    setThemeState(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyThemeClass(value);
    setIsDark(resolveDark(value));
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  }, [setTheme, theme]);

  useEffect(() => {
    applyThemeClass(theme);
    setIsDark(resolveDark(theme));

    if (theme !== "system") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyThemeClass("system");
      setIsDark(getSystemDark());
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      cycleTheme,
      isDark,
    }),
    [theme, setTheme, cycleTheme, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
