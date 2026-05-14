import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";

const CROP_EMOJI: Record<string, string> = {
  rice: "🌾", maize: "🌽", chickpea: "🫘", kidneybeans: "🫘",
  pigeonpeas: "🌿", mothbeans: "🌱", mungbean: "🌱", blackgram: "🫘",
  lentil: "🌿", pomegranate: "🍎", banana: "🍌", mango: "🥭",
  grapes: "🍇", watermelon: "🍉", muskmelon: "🍈", apple: "🍏",
  orange: "🍊", papaya: "🍈", coconut: "🥥", cotton: "☁️",
  jute: "🌿", coffee: "☕",
};

const STEP_ICONS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];

export default function PlantingGuideScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { cropKey } = route.params as { cropKey: string };

  const cropName    = t(`crops.${cropKey}`, { defaultValue: cropKey });
  const emoji       = CROP_EMOJI[cropKey] || "🌱";
  const requirements = t(`guide.${cropKey}.requirements`, { defaultValue: "" });
  const steps        = t(`guide.${cropKey}.steps`, { returnObjects: true, defaultValue: [] }) as string[];
  const tips         = t(`guide.${cropKey}.tips`, { defaultValue: "" });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#2D6A4F" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {t("guide.plantingGuideFor", { crop: cropName })}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <Text style={styles.heroName}>{cropName}</Text>
        </View>

        {/* Requirements */}
        {requirements ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌍  {t("guide.requirements")}</Text>
            <View style={styles.reqCard}>
              {requirements.split(" · ").map((req, i) => (
                <View key={i} style={styles.reqRow}>
                  <Text style={styles.reqDot}>✓</Text>
                  <Text style={styles.reqText}>{req.trim()}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Steps */}
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋  {t("guide.steps")}</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tips */}
        {tips ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡  {t("guide.tips")}</Text>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsText}>{tips}</Text>
            </View>
          </View>
        ) : null}

        {/* Back to recommendation */}
        <TouchableOpacity style={styles.backBtn2} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn2Text}>{t("common.back")}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#fff",
  },
  backBtn: { width: 60 },
  backText: { fontSize: 17, color: "#4CAF50", fontWeight: "600" },
  topTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", flex: 1, textAlign: "center" },

  body: { padding: 20, paddingBottom: 48, gap: 20 },

  hero: {
    backgroundColor: "#2D6A4F",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  heroEmoji: { fontSize: 72 },
  heroName:  { fontSize: 28, fontWeight: "700", color: "#fff" },

  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },

  reqCard: {
    backgroundColor: "#F0F7F4",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  reqRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reqDot:  { fontSize: 14, color: "#2D6A4F", fontWeight: "700", marginTop: 1 },
  reqText: { fontSize: 14, color: "#333", lineHeight: 20, flex: 1 },

  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumber: { color: "#fff", fontWeight: "700", fontSize: 13 },
  stepText:   { fontSize: 14, color: "#333", lineHeight: 21, flex: 1 },

  tipsCard: {
    backgroundColor: "#FFFDE7",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#FDD835",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  tipsText: { fontSize: 14, color: "#795548", lineHeight: 21 },

  backBtn2: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#DCDCDC",
    marginTop: 4,
  },
  backBtn2Text: { color: "#2D6A4F", fontWeight: "600", fontSize: 14 },
});
