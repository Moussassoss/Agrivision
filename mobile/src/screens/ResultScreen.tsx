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

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ResultScreen({ route, navigation }: any) {
  const { result } = route.params;
  const { top_crops, soil_used, weather_used, disclaimer } = result;
  const topCrop = top_crops[0];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Recommendation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero — top crop ── */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>
            {CROP_EMOJI[topCrop.crop] || "🌱"}
          </Text>
          <Text style={styles.heroLabel}>Best crop for your farm</Text>
          <Text style={styles.heroCrop}>{capitalize(topCrop.crop)}</Text>

          {/* Confidence bar */}
          <View style={styles.barWrap}>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.round(topCrop.confidence * 100)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>
              {Math.round(topCrop.confidence * 100)}% confidence
            </Text>
          </View>

          {/* Season badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>📅  {topCrop.planting_season}</Text>
          </View>

          {/* Why */}
          <View style={styles.whyBox}>
            <Text style={styles.whyText}>💡  {topCrop.why}</Text>
          </View>
        </View>

        {/* ── Other options ── */}
        {top_crops.length > 1 && (
          <>
            <Text style={styles.sectionTitle}>Other good options</Text>
            <View style={styles.altRow}>
              {top_crops.slice(1).map((crop: any, i: number) => (
                <View key={i} style={styles.altCard}>
                  <Text style={styles.altEmoji}>
                    {CROP_EMOJI[crop.crop] || "🌱"}
                  </Text>
                  <Text style={styles.altName}>{capitalize(crop.crop)}</Text>
                  <View style={styles.altPill}>
                    <Text style={styles.altPillText}>
                      {Math.round(crop.confidence * 100)}%
                    </Text>
                  </View>
                  <Text style={styles.altSeason} numberOfLines={2}>
                    {crop.planting_season.split("—")[0].trim()}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Soil data ── */}
        <Text style={styles.sectionTitle}>Soil data used</Text>
        <View style={styles.dataCard}>
          <View style={styles.dataGrid}>
            <DataTile label="Nitrogen (N)"   value={`${soil_used.nitrogen}`}   unit="mg/kg" color="#E8F5E9" />
            <DataTile label="Phosphorus (P)" value={`${soil_used.phosphorus}`} unit="mg/kg" color="#E3F2FD" />
            <DataTile label="Potassium (K)"  value={`${soil_used.potassium}`}  unit="mg/kg" color="#FFF8E1" />
            <DataTile label="pH"             value={`${soil_used.ph}`}         unit=""      color="#FCE4EC" />
          </View>
          <Text style={styles.sourceTag}>
            Source: {soil_used.source === "isdasoil" ? "🛰️ iSDAsoil satellite" : "🧪 Manual input"}
          </Text>
        </View>

        {/* ── Weather data ── */}
        <Text style={styles.sectionTitle}>Weather data used</Text>
        <View style={styles.dataCard}>
          <View style={styles.dataGrid}>
            <DataTile label="Temperature" value={`${weather_used.temperature}`} unit="°C"    color="#E3F2FD" />
            <DataTile label="Humidity"    value={`${weather_used.humidity}`}    unit="%"     color="#E8F5E9" />
            <DataTile label="Rainfall"    value={`${Math.round(weather_used.rainfall)}`} unit="mm/yr" color="#FFF8E1" />
          </View>
          <Text style={styles.sourceTag}>
            Source: 🌦️ OpenWeather + 🌧️ NASA POWER
          </Text>
        </View>

        {/* ── Disclaimer ── */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>⚠️  {disclaimer}</Text>
        </View>

        {/* ── Actions ── */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryBtnText}>🔄  Get new recommendation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.secondaryBtnText}>📋  View all past recommendations</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const DataTile = ({
  label, value, unit, color,
}: {
  label: string; value: string; unit: string; color: string;
}) => (
  <View style={[styles.dataTile, { backgroundColor: color }]}>
    <Text style={styles.dataTileLabel}>{label}</Text>
    <Text style={styles.dataTileValue}>
      {value}
      <Text style={styles.dataTileUnit}> {unit}</Text>
    </Text>
  </View>
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

  // ── Body ───────────────────────────────────────
  body: {
    padding: 20,
    gap: 14,
    paddingBottom: 48,
  },

  // ── Hero card ──────────────────────────────────
  heroCard: {
    backgroundColor: "#2D6A4F",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  heroEmoji: {
    fontSize: 72,
  },
  heroLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
  heroCrop: {
    fontSize: 34,
    fontWeight: "700",
    color: "#fff",
  },
  barWrap: {
    width: "100%",
    gap: 6,
    marginTop: 4,
  },
  barBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#95D5B2",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.25)",
    marginTop: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  whyBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginTop: 4,
  },
  whyText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  // ── Section title ──────────────────────────────
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: -4,
  },

  // ── Alt crops ──────────────────────────────────
  altRow: {
    flexDirection: "row",
    gap: 10,
  },
  altCard: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
  },
  altEmoji: {
    fontSize: 32,
  },
  altName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  altPill: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  altPillText: {
    color: "#2D6A4F",
    fontSize: 12,
    fontWeight: "700",
  },
  altSeason: {
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    lineHeight: 15,
  },

  // ── Data cards ─────────────────────────────────
  dataCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
    gap: 12,
  },
  dataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dataTile: {
    width: "47%",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  dataTileLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  dataTileValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  dataTileUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#888",
  },
  sourceTag: {
    fontSize: 11,
    color: "#aaa",
    textAlign: "right",
  },

  // ── Disclaimer ─────────────────────────────────
  disclaimer: {
    backgroundColor: "#FFFDE7",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#FDD835",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#795548",
    lineHeight: 18,
  },

  // ── Buttons ────────────────────────────────────
  primaryBtn: {
    backgroundColor: "#2D6A4F",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#DCDCDC",
  },
  secondaryBtnText: {
    color: "#2D6A4F",
    fontWeight: "600",
    fontSize: 14,
  },
});