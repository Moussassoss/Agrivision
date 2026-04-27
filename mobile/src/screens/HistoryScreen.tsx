import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  RefreshControl,
} from "react-native";
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
  const [records, setRecords]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getHistory(20);
      setRecords(data);
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.detail || "Could not load history"
      );
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
      day:   "numeric",
      month: "short",
      year:  "numeric",
      hour:  "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Past Recommendations</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🌱</Text>
          <Text style={styles.emptyTitle}>No recommendations yet</Text>
          <Text style={styles.emptySubtitle}>
            Your past crop recommendations will appear here.
          </Text>
          <TouchableOpacity
            style={styles.goHomeBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.goHomeBtnText}>Get your first recommendation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchHistory(true)}
              tintColor="#2D6A4F"
            />
          }
        >
          <Text style={styles.countText}>
            {records.length} recommendation{records.length > 1 ? "s" : ""} found
          </Text>

          {records.map((record, index) => {
            const topCrop = record.top_crops[0];
            return (
              <TouchableOpacity
                key={record.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("Result", {
                    result: {
                      top_crops:    record.top_crops,
                      soil_used:    { ...record.soil, source: record.soil.source },
                      weather_used: record.weather,
                      disclaimer:
                        "Recommendations are AI-assisted. Always consult a local agronomist.",
                    },
                  })
                }
              >
                {/* Top section */}
                <View style={styles.cardTop}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cropEmoji}>
                      {CROP_EMOJI[topCrop.crop] || "🌱"}
                    </Text>
                    <View>
                      <Text style={styles.cropName}>
                        {topCrop.crop.charAt(0).toUpperCase() + topCrop.crop.slice(1)}
                      </Text>
                      <Text style={styles.confidence}>
                        {Math.round(topCrop.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.dateText}>{formatDate(record.created_at)}</Text>
                    <Text style={styles.viewText}>View →</Text>
                  </View>
                </View>

                {/* Confidence bar */}
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.round(topCrop.confidence * 100)}%` },
                    ]}
                  />
                </View>

                {/* Other crops */}
                {record.top_crops.length > 1 && (
                  <View style={styles.otherCrops}>
                    <Text style={styles.otherLabel}>Also considered: </Text>
                    <Text style={styles.otherNames}>
                      {record.top_crops
                        .slice(1)
                        .map((c: any) =>
                          c.crop.charAt(0).toUpperCase() + c.crop.slice(1)
                        )
                        .join(", ")}
                    </Text>
                  </View>
                )}

                {/* Location + weather summary */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaItem}>
                    📍 {record.latitude.toFixed(3)}, {record.longitude.toFixed(3)}
                  </Text>
                  <Text style={styles.metaItem}>
                    🌡️ {record.weather.temperature}°C
                  </Text>
                  <Text style={styles.metaItem}>
                    🌧️ {record.weather.rainfall.toFixed(0)}mm
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F4",
  },
  header: {
    backgroundColor: "#2D6A4F",
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    color: "#666",
    marginTop: 12,
    fontSize: 14,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D6A4F",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  goHomeBtn: {
    backgroundColor: "#2D6A4F",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  goHomeBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  body: {
    padding: 20,
    gap: 14,
    paddingBottom: 48,
  },
  countText: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cropEmoji: {
    fontSize: 36,
  },
  cropName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B4332",
  },
  confidence: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#aaa",
  },
  viewText: {
    fontSize: 13,
    color: "#2D6A4F",
    fontWeight: "600",
  },
  barBg: {
    height: 6,
    backgroundColor: "#E8F5E9",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#2D6A4F",
    borderRadius: 3,
  },
  otherCrops: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  otherLabel: {
    fontSize: 12,
    color: "#aaa",
  },
  otherNames: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    flexWrap: "wrap",
  },
  metaItem: {
    fontSize: 12,
    color: "#777",
  },
});