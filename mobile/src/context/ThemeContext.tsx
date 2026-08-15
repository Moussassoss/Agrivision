import React, { createContext, useContext } from "react";

export const colors = {
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

interface ThemeContextType {
  colors: typeof colors;
}

const ThemeContext = createContext<ThemeContextType>({ colors });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={{ colors }}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
