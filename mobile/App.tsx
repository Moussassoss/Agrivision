import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { initI18n } from "./src/i18n";

// Screens
import LoginScreen      from "./src/screens/LoginScreen";
import RegisterScreen   from "./src/screens/RegisterScreen";
import HomeScreen       from "./src/screens/HomeScreen";
import ResultScreen     from "./src/screens/ResultScreen";
import HistoryScreen    from "./src/screens/HistoryScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import WelcomeScreen        from "./src/screens/WelcomeScreen";

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ── Authenticated screens ──────────────────
        <>
          <Stack.Screen name="Home"    component={HomeScreen} />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            getId={({ params }) => String((params as any)?.key)}/>
          <Stack.Screen name="History" component={HistoryScreen} />
        </>
      ) : (
        // ── Auth screens ───────────────────────────
        <>
          <Stack.Screen name="Welcome"       component={WelcomeScreen} />
          <Stack.Screen name="Login"         component={LoginScreen} />
          <Stack.Screen name="Register"      component={RegisterScreen} />
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </AuthProvider>
    </LanguageProvider>
  );
}
