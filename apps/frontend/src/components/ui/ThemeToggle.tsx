import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

type ThemeKey = "sun" | "moon" | "magic";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, themes } = useTheme();
  return (
    <div className="flex gap-2 items-center">
      {(Object.entries(themes) as [ThemeKey, { emoji: string }][]).map(
        ([key, t]) => (
          <button
            key={key}
            className={`text-2xl px-2 py-1 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
              theme === key
                ? "ring-2 ring-accent bg-accent/20 scale-110"
                : "hover:bg-gray-100"
            }`}
            onClick={() => setTheme(key)}
            aria-label={t.emoji + " theme"}
          >
            {t.emoji}
          </button>
        )
      )}
    </div>
  );
};

export default ThemeToggle;
