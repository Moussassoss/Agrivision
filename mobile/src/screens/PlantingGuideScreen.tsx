import React from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { StepAnimation, getStepType } from "../components/StepAnimation";

const CROP_EMOJI: Record<string, string> = {
  rice: "🌾", maize: "🌽", kidneybeans: "🫘", blackgram: "🫘",
  lentil: "🌿", banana: "🍌", mango: "🥭", watermelon: "🍉",
  orange: "🍊", papaya: "🍈", coconut: "🥥", coffee: "☕",
  avocado: "🥑", cassava: "🌿", potato: "🥔", sorghum: "🌾",
  soybean: "🫘", sweetpotato: "🍠", tea: "🍵", tomato: "🍅", wheat: "🌾",
};

export default function PlantingGuideScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { cropKey } = route.params as { cropKey: string };

  const cropName    = t(`crops.${cropKey}`, { defaultValue: cropKey });
  const emoji       = CROP_EMOJI[cropKey] || "🌱";
  const requirements = t(`guide.${cropKey}.requirements`, { defaultValue: "" });
  const steps        = t(`guide.${cropKey}.steps`, { returnObjects: true, defaultValue: [] }) as string[];
  const tips         = t(`guide.${cropKey}.tips`, { defaultValue: "" });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
          {t("guide.plantingGuideFor", { crop: cropName })}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.heroBg }]}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <Text style={[styles.heroName, { color: colors.heroText }]}>{cropName}</Text>
        </View>

        {/* Requirements */}
        {requirements ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🌍  {t("guide.requirements")}</Text>
            <View style={[styles.reqCard, { backgroundColor: colors.primarySurface }]}>
              {requirements.split(" · ").map((req, i) => (
                <View key={i} style={styles.reqRow}>
                  <Text style={[styles.reqDot, { color: colors.primary }]}>✓</Text>
                  <Text style={[styles.reqText, { color: colors.text }]}>{req.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Steps with animations */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋  {t("guide.steps")}</Text>
            {steps.map((step, i) => (
              <View key={i} style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <StepAnimation type={getStepType(step)} stepIndex={i} />
                <View style={styles.stepRight}>
                  <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        {tips ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>💡  {t("guide.tips")}</Text>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsText}>{tips}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.backBtn2, { borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backBtn2Text, { color: colors.primary }]}>{t("common.back")}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn:  { width: 60 },
  backText: { fontSize: 17, fontWeight: "600" },
  topTitle: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "center" },

  body: { padding: 20, paddingBottom: 48, gap: 20 },

  hero:      { backgroundColor: "#2D6A4F", borderRadius: 20, padding: 28, alignItems: "center", gap: 10 },
  heroEmoji: { fontSize: 72 },
  heroName:  { fontSize: 28, fontWeight: "700", color: "#fff" },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },

  reqCard: { borderRadius: 14, padding: 16, gap: 8 },
  reqRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reqDot:  { fontSize: 14, fontWeight: "700", marginTop: 1 },
  reqText: { fontSize: 14, lineHeight: 20, flex: 1 },

  stepCard:  { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, padding: 12, gap: 12, borderWidth: 0.5 },
  stepRight: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10, paddingTop: 4 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  stepBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  stepText:  { fontSize: 14, lineHeight: 21, flex: 1 },

  tipsCard: { backgroundColor: "#FFFDE7", borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: "#FDD835", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  tipsText: { fontSize: 14, color: "#795548", lineHeight: 21 },

  backBtn2:     { borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 0.5, marginTop: 4 },
  backBtn2Text: { fontWeight: "600", fontSize: 14 },
});
