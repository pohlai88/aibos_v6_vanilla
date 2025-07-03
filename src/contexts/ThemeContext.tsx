import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type ThemeKey = "sun" | "moon" | "magic";
type MoodKey = "happy" | "neutral" | "dreamy";

const themes = {
  sun: { bg: "#FFF9EC", text: "#333", accent: "#FFCF7D", emoji: "🌞" },
  moon: { bg: "#1A1A2E", text: "#EEE", accent: "#5D6DFF", emoji: "🌙" },
  magic: { bg: "#F0ECFF", text: "#2A1744", accent: "#D67BF3", emoji: "🪄" },
} as const;

const moods = {
  happy: { emoji: "😊", theme: "sun" },
  neutral: { emoji: "😐", theme: "moon" },
  dreamy: { emoji: "😵", theme: "magic" },
} as const;

type ThemeContextType = {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  mood: MoodKey;
  setMood: (mood: MoodKey) => void;
  themes: typeof themes;
  moods: typeof moods;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeKey>("sun");
  const [mood, setMood] = useState<MoodKey>("happy");

  // Sync CSS variables to theme
  useEffect(() => {
    const t = themes[theme];
    document.documentElement.style.setProperty("--bg", t.bg);
    document.documentElement.style.setProperty("--text", t.text);
    document.documentElement.style.setProperty("--accent", t.accent);
  }, [theme]);

  // Optionally sync theme to mood
  const setMoodAndTheme = (moodKey: MoodKey) => {
    setMood(moodKey);
    setTheme(moods[moodKey].theme);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, mood, setMood: setMoodAndTheme, themes, moods }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
};
