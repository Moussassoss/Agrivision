import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useOnboarding } from "../context/OnboardingContext";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    key: "1",
    emoji:    "🌱",
    bgColor:  "#1B4332",
    dotColor: "#52B788",
    titleKey: "onboarding.slide1Title",
    descKey:  "onboarding.slide1Desc",
  },
  {
    key: "2",
    emoji:    "🤖",
    bgColor:  "#1A3D60",
    dotColor: "#64B5F6",
    titleKey: "onboarding.slide2Title",
    descKey:  "onboarding.slide2Desc",
  },
  {
    key: "3",
    emoji:    "📋",
    bgColor:  "#3E2723",
    dotColor: "#FFAB40",
    titleKey: "onboarding.slide3Title",
    descKey:  "onboarding.slide3Desc",
  },
  {
    key: "4",
    emoji:    "🌐",
    bgColor:  "#1A237E",
    dotColor: "#9FA8DA",
    titleKey: "onboarding.slide4Title",
    descKey:  "onboarding.slide4Desc",
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboarding();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // completeOnboarding sets onboarded=true in context → App.tsx re-renders
  // and automatically shows the correct screen (Welcome or Home)
  const finish = async () => {
    await completeOnboarding();
  };

  const next = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width, backgroundColor: item.bgColor }]}>
            <View style={styles.emojiCircle}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
            <Text style={styles.slideDesc}>{t(item.descKey)}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: "clamp" });
          const opacity  = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: "clamp" });
          return (
            <Animated.View
              key={s.key}
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[activeIndex].dotColor }]}
            />
          );
        })}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity onPress={finish} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={next}
          style={[styles.nextBtn, { backgroundColor: SLIDES[activeIndex].dotColor }]}
        >
          <Text style={styles.nextText}>
            {isLast ? t("onboarding.getStarted") : t("onboarding.next")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#1B4332" },

  slide:      { alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 24, paddingBottom: 100 },
  emojiCircle:{ width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" },
  emoji:      { fontSize: 72 },
  slideTitle: { fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 36 },
  slideDesc:  { fontSize: 15, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 23 },

  dotsRow:    { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, position: "absolute", bottom: 110, left: 0, right: 0 },
  dot:        { height: 8, borderRadius: 4 },

  btnRow:     { position: "absolute", bottom: 48, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skipBtn:    { paddingVertical: 12, paddingHorizontal: 20 },
  skipText:   { color: "rgba(255,255,255,0.55)", fontSize: 15, fontWeight: "600" },
  nextBtn:    { borderRadius: 30, paddingVertical: 14, paddingHorizontal: 32 },
  nextText:   { color: "#1B4332", fontWeight: "800", fontSize: 16 },
});
