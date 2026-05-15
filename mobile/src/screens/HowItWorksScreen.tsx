import React from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const PIPELINE = [
  { icon: "📍", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc", color: "#E8F5E9" },
  { icon: "🛰️", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc", color: "#E3F2FD" },
  { icon: "🌦️", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc", color: "#FFF8E1" },
  { icon: "🤖", titleKey: "howItWorks.step4Title", descKey: "howItWorks.step4Desc", color: "#FCE4EC" },
  { icon: "🌾", titleKey: "howItWorks.step5Title", descKey: "howItWorks.step5Desc", color: "#E8F5E9" },
];

const SOURCES = [
  { icon: "🛰️", name: "iSDAsoil", desc: "howItWorks.sourceIsda",    color: "#E8F5E9" },
  { icon: "🌦️", name: "OpenWeather", desc: "howItWorks.sourceOw",   color: "#E3F2FD" },
  { icon: "🌧️", name: "NASA POWER",  desc: "howItWorks.sourceNasa", color: "#FFF8E1" },
];

export default function HowItWorksScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>{t("howItWorks.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.heroBg }]}>
          <Text style={styles.heroEmoji}>🌱</Text>
          <Text style={styles.heroTitle}>CropVana</Text>
          <Text style={styles.heroSub}>{t("howItWorks.heroSub")}</Text>
        </View>

        {/* Model accuracy badge */}
        <View style={[styles.accuracyCard, { backgroundColor: colors.primarySurface }]}>
          <Text style={styles.accuracyEmoji}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.accuracyTitle, { color: colors.primary }]}>{t("howItWorks.accuracyTitle")}</Text>
            <Text style={[styles.accuracySub, { color: colors.textSecondary }]}>{t("howItWorks.accuracySub")}</Text>
          </View>
          <View style={[styles.accuracyBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.accuracyValue}>97.3%</Text>
          </View>
        </View>

        {/* Pipeline */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("howItWorks.pipelineTitle")}</Text>

        {PIPELINE.map((step, i) => (
          <View key={i} style={styles.pipelineRow}>
            <View style={[styles.pipelineIcon, { backgroundColor: step.color }]}>
              <Text style={styles.pipelineEmoji}>{step.icon}</Text>
            </View>
            <View style={styles.pipelineRight}>
              <Text style={[styles.pipelineTitle, { color: colors.text }]}>{t(step.titleKey)}</Text>
              <Text style={[styles.pipelineDesc, { color: colors.textSecondary }]}>{t(step.descKey)}</Text>
            </View>
            {i < PIPELINE.length - 1 && (
              <View style={[styles.pipelineConnector, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}

        {/* Data sources */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("howItWorks.sourcesTitle")}</Text>
        {SOURCES.map((src, i) => (
          <View key={i} style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sourceIcon, { backgroundColor: src.color }]}>
              <Text style={{ fontSize: 22 }}>{src.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sourceName, { color: colors.text }]}>{src.name}</Text>
              <Text style={[styles.sourceDesc, { color: colors.textSecondary }]}>{t(src.desc)}</Text>
            </View>
          </View>
        ))}

        {/* Dataset note */}
        <View style={[styles.noteCard, { backgroundColor: isDark ? "#1a2518" : "#FFFDE7", borderLeftColor: "#FDD835" }]}>
          <Text style={[styles.noteText, { color: isDark ? "#c8d8c0" : "#795548" }]}>
            📊  {t("howItWorks.datasetNote")}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  topBar:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 60 },
  backText:{ fontSize: 17, fontWeight: "600" },
  topTitle:{ fontSize: 16, fontWeight: "700" },

  body: { padding: 20, paddingBottom: 48, gap: 16 },

  hero:      { backgroundColor: "#2D6A4F", borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#fff" },
  heroSub:   { fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "center", lineHeight: 20 },

  accuracyCard:  { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, gap: 12 },
  accuracyEmoji: { fontSize: 28 },
  accuracyTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  accuracySub:   { fontSize: 12, lineHeight: 17 },
  accuracyBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  accuracyValue: { color: "#fff", fontWeight: "800", fontSize: 16 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: -4 },

  pipelineRow:       { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingBottom: 8 },
  pipelineIcon:      { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pipelineEmoji:     { fontSize: 22 },
  pipelineRight:     { flex: 1, paddingTop: 4 },
  pipelineTitle:     { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  pipelineDesc:      { fontSize: 12, lineHeight: 18 },
  pipelineConnector: { position: "absolute", left: 23, top: 52, width: 2, height: 20 },

  sourceCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, borderWidth: 0.5, gap: 12 },
  sourceIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sourceName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  sourceDesc: { fontSize: 12, lineHeight: 17 },

  noteCard: { borderRadius: 12, padding: 14, borderLeftWidth: 3, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  noteText:  { fontSize: 12, lineHeight: 18 },
});
