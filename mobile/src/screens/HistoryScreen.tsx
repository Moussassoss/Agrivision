import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, SafeAreaView, StatusBar, RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { getHistory } from "../services/api";
import { SkeletonCard, Skeleton } from "../components/Skeleton";

const CROP_EMOJI: Record<string, string> = {
  rice: "🌾", maize: "🌽", kidneybeans: "🫘", blackgram: "🫘",
  lentil: "🌿", banana: "🍌", mango: "🥭", watermelon: "🍉",
  orange: "🍊", papaya: "🍈", coconut: "🥥", coffee: "☕",
  avocado: "🥑", cassava: "🌿", potato: "🥔", sorghum: "🌾",
  soybean: "🫘", sweetpotato: "🍠", tea: "🍵", tomato: "🍅", wheat: "🌾",
};

export default function HistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [records, setRecords]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      setRecords(await getHistory(20));
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || t("history.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-RW", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      <View style={[styles.topBar, { borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>{t("history.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Skeleton loading ── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.body}>
          <Skeleton width="35%" height={13} borderRadius={6} />
          {[1, 2, 3].map(i => <SkeletonCard key={i} style={{ borderColor: colors.border }} />)}
        </ScrollView>

      /* ── Empty ── */
      ) : records.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("history.emptyTitle")}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t("history.emptySubtitle")}</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.emptyBtnText}>{t("history.analyseBtn")}</Text>
          </TouchableOpacity>
        </View>

      /* ── List ── */
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor={colors.accent} />}
        >
          <Text style={[styles.countText, { color: colors.textMuted }]}>
            {t("history.recommendationCount", { count: records.length })}
          </Text>

          {records.map((record) => {
            const topCrop = record.top_crops[0];
            const others  = record.top_crops.slice(1);
            return (
              <TouchableOpacity
                key={record.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate("Result", {
                  result: { top_crops: record.top_crops, soil_used: record.soil, weather_used: record.weather, disclaimer: t("history.disclaimer") },
                })}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.cardEmoji}>{CROP_EMOJI[topCrop.crop] || "🌱"}</Text>
                    <View>
                      <Text style={[styles.cardCropName, { color: colors.text }]}>
                        {t(`crops.${topCrop.crop}`, { defaultValue: topCrop.crop })}
                      </Text>
                      <Text style={[styles.cardDate, { color: colors.textMuted }]}>{formatDate(record.created_at)}</Text>
                    </View>
                  </View>
                  <View style={[styles.confidencePill, { backgroundColor: colors.primarySurface }]}>
                    <Text style={[styles.confidencePillText, { color: colors.primary }]}>
                      {Math.round(topCrop.confidence * 100)}%
                    </Text>
                  </View>
                </View>

                <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.barFill, { width: `${Math.round(topCrop.confidence * 100)}%` as any }]} />
                </View>

                {others.length > 0 && (
                  <View style={styles.othersRow}>
                    <Text style={[styles.othersLabel, { color: colors.textMuted }]}>{t("history.alsoConsidered")}  </Text>
                    {others.map((c: any, i: number) => (
                      <View key={i} style={[styles.otherChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.otherChipText, { color: colors.textSecondary }]}>
                          {CROP_EMOJI[c.crop] || "🌱"} {t(`crops.${c.crop}`, { defaultValue: c.crop })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                  <MetaChip icon="📍" value={`${record.latitude.toFixed(3)}, ${record.longitude.toFixed(3)}`} colors={colors} />
                  <MetaChip icon="🌡️" value={`${record.weather.temperature}°C`} colors={colors} />
                  <MetaChip icon="🌧️" value={`${Math.round(record.weather.rainfall)}mm`} colors={colors} />
                </View>

                <Text style={[styles.viewArrow, { color: colors.accent }]}>{t("history.viewDetails")}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={[styles.tabBar, { borderTopColor: colors.borderLight, backgroundColor: colors.tabBar }]}>
        <TabItem emoji="🏠" label={t("common.home")} colors={colors} onPress={() => navigation.navigate("Home")} />
        <TabItem emoji="📋" label={t("common.history")} active colors={colors} />
      </View>
    </SafeAreaView>
  );
}

const MetaChip = ({ icon, value, colors }: any) => (
  <View style={[styles.metaChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <Text style={[styles.metaValue, { color: colors.textSecondary }]}>{value}</Text>
  </View>
);

const TabItem = ({ emoji, label, active, onPress, colors }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text style={[styles.tabLabel, { color: active ? colors.accent : colors.textMuted }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe:    { flex: 1 },
  topBar:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 60 },
  backText:{ fontSize: 17, fontWeight: "600" },
  topTitle:{ fontSize: 16, fontWeight: "700" },

  centered:      { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  emptyEmoji:    { fontSize: 56 },
  emptyTitle:    { fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  emptyBtn:      { borderRadius: 30, paddingVertical: 13, paddingHorizontal: 28, marginTop: 8 },
  emptyBtnText:  { color: "#fff", fontWeight: "700", fontSize: 15 },

  body:      { padding: 20, gap: 14, paddingBottom: 32 },
  countText: { fontSize: 13, fontWeight: "500", marginBottom: -2 },

  card:      { borderRadius: 16, padding: 16, borderWidth: 0.5, gap: 10 },
  cardTop:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardEmoji:   { fontSize: 38 },
  cardCropName:{ fontSize: 18, fontWeight: "700", marginBottom: 2 },
  cardDate:    { fontSize: 12 },
  confidencePill:     { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  confidencePillText: { fontWeight: "700", fontSize: 13 },

  barBg:   { width: "100%", height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 3 },

  othersRow:    { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  othersLabel:  { fontSize: 12 },
  otherChip:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5 },
  otherChipText:{ fontSize: 12, fontWeight: "500" },

  metaRow:  { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 6, borderTopWidth: 0.5 },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5 },
  metaIcon: { fontSize: 11 },
  metaValue:{ fontSize: 11, fontWeight: "500" },
  viewArrow:{ fontSize: 12, fontWeight: "600", textAlign: "right" },

  tabBar:  { flexDirection: "row", borderTopWidth: 0.5, paddingBottom: 24, paddingTop: 10 },
  tabItem: { flex: 1, alignItems: "center", gap: 3 },
  tabEmoji:{ fontSize: 20 },
  tabLabel:{ fontSize: 11, fontWeight: "600" },
});
