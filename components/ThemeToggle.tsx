"use client";

import { useTheme } from "@/lib/themeContext";

const ICONS: Record<string, string> = {
  dark: "🌙",
  light: "☀️",
  system: "💻",
};

const LABELS: Record<string, string> = {
  dark: "Темна",
  light: "Світла",
  system: "Авто",
};

const CYCLE: Array<"dark" | "light" | "system"> = ["dark", "light", "system"];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleClick = () => {
    const current = CYCLE.indexOf(theme as "dark" | "light" | "system");
    const next = CYCLE[(current + 1) % CYCLE.length];
    setTheme(next);
  };

  return (
    <button
      onClick={handleClick}
      title={`Тема: ${LABELS[theme]} — натисни щоб змінити`}
      className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-full
                 shadow-lg border transition-all duration-200
                 hover:scale-105 active:scale-95"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border-base)",
        color: "var(--text-secondary)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
      }}
    >
      <span className="text-base leading-none">{ICONS[theme]}</span>
      <span
        className="text-xs font-medium hidden sm:inline"
        style={{ color: "var(--text-muted)" }}
      >
        {LABELS[theme]}
      </span>
    </button>
  );
}
