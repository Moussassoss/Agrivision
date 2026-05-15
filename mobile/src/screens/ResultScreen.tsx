import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Share, Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const CROP_EMOJI: Record<string, string> = {
  rice: "🌾", maize: "🌽", chickpea: "🫘", kidneybeans: "🫘",
  pigeonpeas: "🌿", mothbeans: "🌱", mungbean: "🌱", blackgram: "🫘",
  lentil: "🌿", pomegranate: "🍎", banana: "🍌", mango: "🥭",
  grapes: "🍇", watermelon: "🍉", muskmelon: "🍈", apple: "🍏",
  orange: "🍊", papaya: "🍈", coconut: "🥥", cotton: "☁️",
  jute: "🌿", coffee: "☕",
};

export default function ResultScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { result } = route.params;
  const { top_crops, soil_used, weather_used, disclaimer } = result;
  const topCrop = top_crops[0];

  const handleShare = async () => {
    const cropName = t(`crops.${topCrop.crop}`, { defaultValue: topCrop.crop });
    try {
      await Share.share({
        message:
          `🌾 CropVana — ${t("result.shareTitle")}\n\n` +
          `${t("result.bestCrop")}: ${cropName} (${Math.round(topCrop.confidence * 100)}%)\n` +
          `📅 ${topCrop.planting_season}\n\n` +
          `💡 ${topCrop.why}\n\n` +
          `${t("result.shareFooter")}`,
      });
    } catch {
      Alert.alert(t("common.error"), t("result.shareError"));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>{t("result.title")}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={[styles.shareText, { color: colors.primary }]}>⬆️ {t("result.share")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Hero — top crop ── */}
        <View style={[styles.heroCard, { backgroundColor: colors.heroBg }]}>
          <Text style={styles.heroEmoji}>{CROP_EMOJI[topCrop.crop] || "🌱"}</Text>
          <Text style={[styles.heroLabel, { color: "rgba(255,255,255,0.65)" }]}>{t("result.bestCrop")}</Text>
          <Text style={styles.heroCrop}>{t(`crops.${topCrop.crop}`, { defaultValue: topCrop.crop })}</Text>

          <View style={styles.barWrap}>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${Math.round(topCrop.confidence * 100)}%` as any }]} />
            </View>
            <Text style={styles.barLabel}>{t("result.confidence", { value: Math.round(topCrop.confidence * 100) })}</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>📅  {topCrop.planting_season}</Text>
          </View>

          <View style={styles.whyBox}>
            <Text style={styles.whyText}>💡  {topCrop.why}</Text>
          </View>

          <TouchableOpacity
            style={styles.guideBtn}
            onPress={() => navigation.navigate("PlantingGuide", { cropKey: topCrop.crop })}
          >
            <Text style={styles.guideBtnText}>{t("result.plantingGuide")}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Fertilizer advice ── */}
        {topCrop.fertilizer && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("result.fertilizerTitle")}</Text>
            <View style={[styles.fertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {topCrop.fertilizer.items.map((item: string, i: number) => {
                const isOk = item.toLowerCase().includes("adequate") || item.toLowerCase().includes("irahuye") || item.toLowerCase().includes("fix");
                return (
                  <View key={i} style={styles.fertRow}>
                    <Text style={[styles.fertDot, { color: isOk ? colors.accent : "#FF9800" }]}>
                      {isOk ? "✓" : "⚠"}
                    </Text>
                    <Text style={[styles.fertText, { color: colors.text }]}>{item}</Text>
                  </View>
                );
              })}
              <View style={[styles.fertNote, { backgroundColor: colors.primarySurface }]}>
                <Text style={[styles.fertNoteText, { color: colors.primary }]}>
                  ℹ️  {topCrop.fertilizer.note}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Other options ── */}
        {top_crops.length > 1 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("result.otherOptions")}</Text>
            <View style={styles.altRow}>
              {top_crops.slice(1).map((crop: any, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.altCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => navigation.navigate("PlantingGuide", { cropKey: crop.crop })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.altEmoji}>{CROP_EMOJI[crop.crop] || "🌱"}</Text>
                  <Text style={[styles.altName, { color: colors.text }]}>{t(`crops.${crop.crop}`, { defaultValue: crop.crop })}</Text>
                  <View style={[styles.altPill, { backgroundColor: colors.primarySurface }]}>
                    <Text style={[styles.altPillText, { color: colors.primary }]}>{Math.round(crop.confidence * 100)}%</Text>
                  </View>
                  <Text style={[styles.altSeason, { color: colors.textMuted }]} numberOfLines={2}>
                    {crop.planting_season.split("—")[0].trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Soil data ── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("result.soilDataUsed")}</Text>
        <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dataGrid}>
            <DataTile label="Nitrogen (N)"   value={`${soil_used.nitrogen}`}   unit="mg/kg" color="#E8F5E9" />
            <DataTile label="Phosphorus (P)" value={`${soil_used.phosphorus}`} unit="mg/kg" color="#E3F2FD" />
            <DataTile label="Potassium (K)"  value={`${soil_used.potassium}`}  unit="mg/kg" color="#FFF8E1" />
            <DataTile label="pH"             value={`${soil_used.ph}`}         unit=""      color="#FCE4EC" />
          </View>
          <Text style={[styles.sourceTag, { color: colors.textMuted }]}>
            {t("common.source")} {soil_used.source === "isdasoil" ? t("result.soilSourceSatellite") : t("result.soilSourceManual")}
          </Text>
        </View>

        {/* ── Weather data ── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("result.weatherDataUsed")}</Text>
        <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dataGrid}>
            <DataTile label={t("result.temperature")} value={`${weather_used.temperature}`}          unit="°C"    color="#E3F2FD" />
            <DataTile label={t("result.humidity")}    value={`${weather_used.humidity}`}             unit="%"     color="#E8F5E9" />
            <DataTile label={t("result.rainfall")}    value={`${Math.round(weather_used.rainfall)}`} unit="mm/yr" color="#FFF8E1" />
          </View>
          <Text style={[styles.sourceTag, { color: colors.textMuted }]}>
            {t("common.source")} {t("result.weatherSource")}
          </Text>
        </View>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>⚠️  {disclaimer}</Text>
        </View>

        {/* ── Actions ── */}
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.popToTop()}>
          <Text style={styles.primaryBtnText}>{t("result.newRecommendation")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => navigation.navigate("History")}>
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{t("result.viewAllPast")}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const DataTile = ({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) => (
  <View style={[styles.dataTile, { backgroundColor: color }]}>
    <Text style={styles.dataTileLabel}>{label}</Text>
    <Text style={styles.dataTileValue}>{value}<Text style={styles.dataTileUnit}> {unit}</Text></Text>
  </View>
);

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  topBar:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 60 },
  backText:{ fontSize: 17, fontWeight: "600" },
  topTitle:{ fontSize: 16, fontWeight: "700" },
  shareBtn:{ alignItems: "flex-end" },
  shareText:{ fontSize: 13, fontWeight: "600" },

  body: { padding: 20, gap: 14, paddingBottom: 48 },

  heroCard:  { backgroundColor: "#2D6A4F", borderRadius: 20, padding: 24, alignItems: "center", gap: 10 },
  heroEmoji: { fontSize: 72 },
  heroLabel: { fontSize: 13, fontWeight: "500" },
  heroCrop:  { fontSize: 34, fontWeight: "700", color: "#fff" },
  barWrap:   { width: "100%", gap: 6, marginTop: 4 },
  barBg:     { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  barFill:   { height: "100%", backgroundColor: "#95D5B2", borderRadius: 4 },
  barLabel:  { fontSize: 12, color: "rgba(255,255,255,0.7)", textAlign: "right" },
  badge:     { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.25)", marginTop: 4 },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  whyBox:    { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, width: "100%", marginTop: 4 },
  whyText:   { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 20, textAlign: "center" },
  guideBtn:  { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.3)", marginTop: 4 },
  guideBtnText:{ color: "#fff", fontWeight: "700", fontSize: 13, textAlign: "center" },

  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: -4 },

  fertCard: { borderRadius: 14, padding: 14, borderWidth: 0.5, gap: 10 },
  fertRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  fertDot:  { fontSize: 15, fontWeight: "700", marginTop: 1, width: 18 },
  fertText: { fontSize: 13, lineHeight: 20, flex: 1 },
  fertNote: { borderRadius: 10, padding: 12, marginTop: 4 },
  fertNoteText: { fontSize: 12, lineHeight: 18, fontWeight: "500" },

  altRow:   { flexDirection: "row", gap: 10 },
  altCard:  { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 6, borderWidth: 0.5 },
  altEmoji: { fontSize: 32 },
  altName:  { fontSize: 14, fontWeight: "700", textAlign: "center" },
  altPill:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  altPillText: { fontSize: 12, fontWeight: "700" },
  altSeason:{ fontSize: 11, textAlign: "center", lineHeight: 15 },

  dataCard:      { borderRadius: 14, padding: 14, borderWidth: 0.5, gap: 12 },
  dataGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dataTile:      { width: "47%", borderRadius: 12, padding: 12, gap: 4 },
  dataTileLabel: { fontSize: 11, color: "#666", fontWeight: "500" },
  dataTileValue: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  dataTileUnit:  { fontSize: 12, fontWeight: "400", color: "#888" },
  sourceTag:     { fontSize: 11, textAlign: "right" },

  disclaimer:     { backgroundColor: "#FFFDE7", borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: "#FDD835", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  disclaimerText: { fontSize: 12, color: "#795548", lineHeight: 18 },

  primaryBtn:     { borderRadius: 14, padding: 16, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn:   { borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 0.5 },
  secondaryBtnText: { fontWeight: "600", fontSize: 14 },
});
