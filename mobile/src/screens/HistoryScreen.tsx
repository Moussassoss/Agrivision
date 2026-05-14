import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { getHistory } from "../services/api";

const CROP_EMOJI: Record<string, string> = {
  rice:        "🌾",
  maize:       "🌽",
  chickpea:    "🫘",
  kidneybeans: "🫘",
  pigeonpeas:  "🌿",
  mothbeans:   "🌱",
  mungbean:    "🌱",
  blackgram:   "🫘",
  lentil:      "🌿",
  pomegranate: "🍎",
  banana:      "🍌",
  mango:       "🥭",
  grapes:      "🍇",
  watermelon:  "🍉",
  muskmelon:   "🍈",
  apple:       "🍏",
  orange:      "🍊",
  papaya:      "🍈",
  coconut:     "🥥",
  cotton:      "☁️",
  jute:        "🌿",
  coffee:      "☕",
};

export default function HistoryScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [records, setRecords]       = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getHistory(20);
      setRecords(data);
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || t("history.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString("en-RW", {
      day:    "numeric",
      month:  "short",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t("history.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* ── Loading ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t("history.loading")}</Text>
        </View>

      /* ── Empty ── */
      ) : records.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>{t("history.emptyTitle")}</Text>
          <Text style={styles.emptySubtitle}>{t("history.emptySubtitle")}</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyBtnText}>{t("history.analyseBtn")}</Text>
          </TouchableOpacity>
        </View>

      /* ── List ── */
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistory(true)}
              tintColor="#4CAF50"
            />
          }
        >
          <Text style={styles.countText}>
            {t("history.recommendationCount", { count: records.length })}
          </Text>

          {records.map((record) => {
            const topCrop = record.top_crops[0];
            const others  = record.top_crops.slice(1);

            return (
              <TouchableOpacity
                key={record.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("Result", {
                    result: {
                      top_crops:    record.top_crops,
                      soil_used:    record.soil,
                      weather_used: record.weather,
                      disclaimer:   t("history.disclaimer"),
                    },
                  })
                }
              >
                {/* Card top row */}
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <Text style={styles.cardEmoji}>
                      {CROP_EMOJI[topCrop.crop] || "🌱"}
                    </Text>
                    <View>
                      <Text style={styles.cardCropName}>
                        {t(`crops.${topCrop.crop}`, { defaultValue: topCrop.crop })}
                      </Text>
                      <Text style={styles.cardDate}>
                        {formatDate(record.created_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.confidencePill}>
                    <Text style={styles.confidencePillText}>
                      {Math.round(topCrop.confidence * 100)}%
                    </Text>
                  </View>
                </View>

                {/* Confidence bar */}
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.round(topCrop.confidence * 100)}%` as any },
                    ]}
                  />
                </View>

                {/* Other crops */}
                {others.length > 0 && (
                  <View style={styles.othersRow}>
                    <Text style={styles.othersLabel}>{t("history.alsoConsidered")}  </Text>
                    {others.map((c: any, i: number) => (
                      <View key={i} style={styles.otherChip}>
                        <Text style={styles.otherChipText}>
                          {CROP_EMOJI[c.crop] || "🌱"} {t(`crops.${c.crop}`, { defaultValue: c.crop })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <MetaChip
                    icon="📍"
                    value={`${record.latitude.toFixed(3)}, ${record.longitude.toFixed(3)}`}
                  />
                  <MetaChip icon="🌡️" value={`${record.weather.temperature}°C`} />
                  <MetaChip icon="🌧️" value={`${Math.round(record.weather.rainfall)}mm`} />
                </View>

                {/* View arrow */}
                <Text style={styles.viewArrow}>{t("history.viewDetails")}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        <TabItem
          emoji="🏠"
          label={t("common.home")}
          onPress={() => navigation.navigate("Home")}
        />
        <TabItem emoji="📋" label={t("common.history")} active />
      </View>

    </SafeAreaView>
  );
}

const MetaChip = ({ icon, value }: { icon: string; value: string }) => (
  <View style={styles.metaChip}>
    <Text style={styles.metaIcon}>{icon}</Text>
    <Text style={styles.metaValue}>{value}</Text>
  </View>
);

const TabItem = ({
  emoji, label, active, onPress,
}: {
  emoji: string; label: string; active?: boolean; onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },

  // ── Top bar ────────────────────────────────────
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
  backBtn: {
    width: 60,
  },
  backText: {
    fontSize: 17,
    color: "#4CAF50",
    fontWeight: "600",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  // ── States ─────────────────────────────────────
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
  },
  emptyBtn: {
    backgroundColor: "#2D6A4F",
    borderRadius: 30,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // ── List ───────────────────────────────────────
  body: {
    padding: 20,
    gap: 14,
    paddingBottom: 32,
  },
  countText: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: "500",
    marginBottom: -2,
  },

  // ── Card ───────────────────────────────────────
  card: {
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardEmoji: {
    fontSize: 38,
  },
  cardCropName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: "#aaa",
  },
  confidencePill: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  confidencePillText: {
    color: "#2D6A4F",
    fontWeight: "700",
    fontSize: 13,
  },

  // ── Confidence bar ─────────────────────────────
  barBg: {
    width: "100%",
    height: 5,
    backgroundColor: "#EBEBEB",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },

  // ── Others ─────────────────────────────────────
  othersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  othersLabel: {
    fontSize: 12,
    color: "#aaa",
  },
  otherChip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: "#DCDCDC",
  },
  otherChipText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },

  // ── Meta ───────────────────────────────────────
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#EBEBEB",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
  },
  metaIcon: {
    fontSize: 11,
  },
  metaValue: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },

  // ── View arrow ─────────────────────────────────
  viewArrow: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "right",
  },

  // ── Bottom tab bar ─────────────────────────────
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#fff",
    paddingBottom: 24,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 11,
    color: "#aaa",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#4CAF50",
  },
});
