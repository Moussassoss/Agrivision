import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { initI18n } from "./src/i18n";

// Screens
import LoginScreen           from "./src/screens/LoginScreen";
import RegisterScreen        from "./src/screens/RegisterScreen";
import HomeScreen            from "./src/screens/HomeScreen";
import ResultScreen          from "./src/screens/ResultScreen";
import HistoryScreen         from "./src/screens/HistoryScreen";
import ForgotPasswordScreen  from "./src/screens/ForgotPasswordScreen";
import WelcomeScreen         from "./src/screens/WelcomeScreen";
import ProfileScreen         from "./src/screens/ProfileScreen";
import PlantingGuideScreen   from "./src/screens/PlantingGuideScreen";
import HowItWorksScreen      from "./src/screens/HowItWorksScreen";
import OnboardingScreen, { ONBOARDING_KEY } from "./src/screens/OnboardingScreen";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((v) => setOnboarded(v === "true"))
      .catch(() => setOnboarded(true));
  }, []);

  if (isLoading || onboarded === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Home"          component={HomeScreen} />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            getId={({ params }) => String((params as any)?.key)} />
          <Stack.Screen name="History"       component={HistoryScreen} />
          <Stack.Screen name="Profile"       component={ProfileScreen} />
          <Stack.Screen name="PlantingGuide" component={PlantingGuideScreen} />
          <Stack.Screen name="HowItWorks"    component={HowItWorksScreen} />
        </>
      ) : (
        <>
          {!onboarded && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
          <Stack.Screen name="Welcome"        component={WelcomeScreen} />
          <Stack.Screen name="Login"          component={LoginScreen} />
          <Stack.Screen name="Register"       component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NavigationContainer>
            <Navigation />
          </NavigationContainer>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
