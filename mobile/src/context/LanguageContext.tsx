import React, { createContext, useContext, useState } from "react";
import i18n, { setLanguage } from "../i18n";

type LanguageContextType = {
  language: string;
  toggleLanguage: () => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  toggleLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState(i18n.language || "en");

  const toggleLanguage = async () => {
    const next = language === "en" ? "rw" : "en";
    await setLanguage(next);
    setLang(next);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
