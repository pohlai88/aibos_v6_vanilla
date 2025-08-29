import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

type MoodKey = "happy" | "neutral" | "dreamy";

const MoodPicker: React.FC = () => {
  const { mood, setMood, moods } = useTheme();
  return (
    <div className="flex gap-2 items-center">
      {(
        Object.entries(moods) as [MoodKey, { emoji: string; theme: string }][]
      ).map(([key, m]) => (
        <button
          key={key}
          className={`text-2xl px-2 py-1 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
            mood === key
              ? "ring-2 ring-accent bg-accent/20 scale-110"
              : "hover:bg-gray-100"
          }`}
          onClick={() => setMood(key)}
          aria-label={m.emoji + " mood"}
        >
          {m.emoji}
        </button>
      ))}
    </div>
  );
};

export default MoodPicker;
