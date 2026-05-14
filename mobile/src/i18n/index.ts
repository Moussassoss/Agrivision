import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./en.json";
import rw from "./rw.json";

export const LANG_KEY = "@agrivision_language";

export async function initI18n(): Promise<void> {
  const savedLang = await AsyncStorage.getItem(LANG_KEY).catch(() => null);

  await i18n.use(initReactI18next).init({
    lng: savedLang ?? "en",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      rw: { translation: rw },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

export async function setLanguage(lang: string): Promise<void> {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANG_KEY, lang).catch(() => {});
}

export default i18n;
