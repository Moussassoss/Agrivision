import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../context/LanguageContext";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  const fadeAnim      = useRef(new Animated.Value(0)).current;
  const slideAnim     = useRef(new Animated.Value(40)).current;
  const buttonAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.background} />
      <View style={styles.backgroundOverlay} />

      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      {/* Language toggle */}
      <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
        <Text style={styles.langToggleText}>🌐 {t("language.switchTo")}</Text>
      </TouchableOpacity>

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🌱</Text>
        </View>

        <Text style={styles.title}>AgriVision</Text>
        <Text style={styles.tagline}>{t("welcome.tagline")}</Text>

        <View style={styles.features}>
          <FeatureItem emoji="🛰️" text={t("welcome.feature1")} />
          <FeatureItem emoji="🌦️" text={t("welcome.feature2")} />
          <FeatureItem emoji="🤖" text={t("welcome.feature3")} />
          <FeatureItem emoji="📍" text={t("welcome.feature4")} />
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, { opacity: buttonAnim }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.primaryButtonText}>{t("welcome.getStarted")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.secondaryButtonText}>
            {t("welcome.alreadyHaveAccount")}{" "}
            <Text style={styles.secondaryButtonBold}>{t("welcome.logIn")}</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const FeatureItem = ({ emoji, text }: { emoji: string; text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B4332",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1B4332",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#2D6A4F",
    opacity: 0.5,
  },
  circle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#40916C",
    opacity: 0.3,
    top: -80,
    right: -80,
  },
  circle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#52B788",
    opacity: 0.2,
    bottom: 180,
    left: -60,
  },
  circle3: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#74C69D",
    opacity: 0.15,
    bottom: 80,
    right: -40,
  },
  langToggle: {
    position: "absolute",
    top: 52,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    zIndex: 10,
  },
  langToggleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoEmoji: {
    fontSize: 52,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
  },
  features: {
    marginTop: 40,
    width: "100%",
    gap: 14,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  featureEmoji: {
    fontSize: 22,
    marginRight: 14,
  },
  featureText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  buttons: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#2D6A4F",
    fontWeight: "bold",
    fontSize: 17,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  secondaryButtonBold: {
    color: "#fff",
    fontWeight: "bold",
  },
});
