import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "@agrivision_theme";

export const lightColors = {
  background:    "#FFFFFF",
  backgroundAlt: "#F9F9F9",
  surface:       "#E8F5E9",
  card:          "#F9F9F9",
  border:        "#EBEBEB",
  borderLight:   "#F0F0F0",
  text:          "#1a1a1a",
  textSecondary: "#666666",
  textMuted:     "#aaaaaa",
  primary:       "#2D6A4F",
  primaryLight:  "#52B788",
  primarySurface:"#E8F5E9",
  accent:        "#4CAF50",
  heroBg:        "#2D6A4F",
  heroText:      "#FFFFFF",
  inputBg:       "#F9F9F9",
  inputBorder:   "#E0E0E0",
  tabBar:        "#FFFFFF",
  statusBar:     "dark-content" as "dark-content" | "light-content",
};

export const darkColors: typeof lightColors = {
  background:    "#0D1B12",
  backgroundAlt: "#132019",
  surface:       "#1A2E20",
  card:          "#1A2E20",
  border:        "#2A4035",
  borderLight:   "#1F3028",
  text:          "#E8F5E9",
  textSecondary: "#9DB8A6",
  textMuted:     "#5A7A65",
  primary:       "#52B788",
  primaryLight:  "#74C69D",
  primarySurface:"#1A2E20",
  accent:        "#52B788",
  heroBg:        "#1A3D29",
  heroText:      "#E8F5E9",
  inputBg:       "#1A2E20",
  inputBorder:   "#2A4035",
  tabBar:        "#0D1B12",
  statusBar:     "light-content" as "dark-content" | "light-content",
};

interface ThemeContextType {
  isDark: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved !== null) setIsDark(saved === "dark");
    }).catch(() => {});
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light").catch(() => {});
      return next;
    });
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
