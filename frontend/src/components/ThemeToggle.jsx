import { FaDesktop, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const LABELS = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ThemeToggle = ({ className = "" }) => {
  const { theme, cycleTheme } = useTheme();

  const Icon = theme === "dark" ? FaMoon : theme === "light" ? FaSun : FaDesktop;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={`Theme: ${LABELS[theme]} (click to change)`}
      aria-label={`Current theme ${LABELS[theme]}. Click to switch.`}
      className={`inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${className}`}
    >
      <Icon className="text-[11px]" />
      <span className="hidden sm:inline">{LABELS[theme]}</span>
    </button>
  );
};

export default ThemeToggle;
