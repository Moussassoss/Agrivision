import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_KEY = "@agrivision_onboarded";

interface OnboardingCtx {
  onboarded: boolean | null;   // null = still loading
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingCtx>({
  onboarded: null,
  completeOnboarding: async () => {},
});

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setOnboarded(v === "true"))
      .catch(() => setOnboarded(false)); // on error → show onboarding
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true").catch(() => {});
    setOnboarded(true);
  };

  return (
    <OnboardingContext.Provider value={{ onboarded, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
