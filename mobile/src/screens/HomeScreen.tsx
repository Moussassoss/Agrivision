import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { getRecommendation } from "../services/api";

export default function HomeScreen({ navigation }: any) {
  const { user, signOut }                       = useAuth();
  const [location, setLocation]                 = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName]         = useState<string>("");
  const [loadingLocation, setLoadingLocation]   = useState(false);
  const [loadingRec, setLoadingRec]             = useState(false);
  const [showOverride, setShowOverride]         = useState(false);
  const [soilOverride, setSoilOverride]         = useState({
    nitrogen:   "",
    phosphorus: "",
    potassium:  "",
    ph:         "",
  });

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setLoadingRec(false);
    });
    return unsubscribe;
  }, [navigation]);

  const requestLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "AgriVision needs your location to fetch soil and weather data.",
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setLocation({ lat, lon });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      if (geocode.length > 0) {
        const p = geocode[0];
        setLocationName(
          [p.district, p.city, p.country].filter(Boolean).join(", ")
        );
      }
    } catch {
      Alert.alert("Error", "Could not get your location. Please try again.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleGetRecommendation = async () => {
    if (!location) {
      Alert.alert("No Location", "Please allow location access first.");
      return;
    }
    setLoadingRec(true);
    try {
      const override: any = {};
      if (soilOverride.nitrogen)   override.nitrogen   = parseFloat(soilOverride.nitrogen);
      if (soilOverride.phosphorus) override.phosphorus = parseFloat(soilOverride.phosphorus);
      if (soilOverride.potassium)  override.potassium  = parseFloat(soilOverride.potassium);
      if (soilOverride.ph)         override.ph         = parseFloat(soilOverride.ph);

      const result = await getRecommendation(
        location.lat,
        location.lon,
        Object.keys(override).length > 0 ? override : undefined
      );
      setSoilOverride({ nitrogen: "", phosphorus: "", potassium: "", ph: "" });
      setShowOverride(false);
      navigation.replace("Result", { result });
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.detail || "Could not get recommendation."
      );
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name?.split(" ")[0]} 👋</Text>
          <TouchableOpacity onPress={requestLocation} style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            {loadingLocation ? (
              <ActivityIndicator size="small" color="#4CAF50" style={{ marginLeft: 4 }} />
            ) : (
              <Text style={styles.locationText} numberOfLines={1}>
                {locationName || "Detecting location..."}
              </Text>
            )}
            <Text style={styles.locationChevron}> ›</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.avatarBtn}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0).toUpperCase() || "A"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >

        {/* Hero CTA */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Get your crop{"\n"}recommendation</Text>
            <Text style={styles.heroSub}>
              AI-powered · Real soil data · Live weather
            </Text>
            <TouchableOpacity
              style={[styles.heroBtn, (!location || loadingRec) && styles.heroBtnDisabled]}
              onPress={handleGetRecommendation}
              disabled={!location || loadingRec}
            >
              {loadingRec ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.heroBtnText}>Analyse my farm →</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.heroEmoji}>🌾</Text>
        </View>

        {/* Auto data sources */}
        <Text style={styles.sectionTitle}>Auto-fetched data</Text>
        <View style={styles.sourceRow}>
          <SourceChip emoji="🛰️" label="iSDAsoil" sub="N · P · K · pH" color="#E8F5E9" />
          <SourceChip emoji="🌦️" label="OpenWeather" sub="Temp · Humidity" color="#E3F2FD" />
          <SourceChip emoji="🌧️" label="NASA POWER" sub="Rainfall" color="#FFF8E1" />
        </View>

        {/* Soil override toggle */}
        <TouchableOpacity
          style={styles.overrideHeader}
          onPress={() => setShowOverride(!showOverride)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.overrideTitle}>Have lab soil results?</Text>
            <Text style={styles.overrideSub}>
              Override satellite data with your lab values
            </Text>
          </View>
          <Text style={styles.overrideChevron}>{showOverride ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {showOverride && (
          <View style={styles.overrideCard}>
            <Text style={styles.overrideNote}>
              Leave blank to use satellite data automatically.
            </Text>
            <View style={styles.inputGrid}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nitrogen (N) mg/kg</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 40"
                  placeholderTextColor="#bbb"
                  value={soilOverride.nitrogen}
                  onChangeText={(v) => setSoilOverride({ ...soilOverride, nitrogen: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phosphorus (P) mg/kg</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 35"
                  placeholderTextColor="#bbb"
                  value={soilOverride.phosphorus}
                  onChangeText={(v) => setSoilOverride({ ...soilOverride, phosphorus: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Potassium (K) mg/kg</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 200"
                  placeholderTextColor="#bbb"
                  value={soilOverride.potassium}
                  onChangeText={(v) => setSoilOverride({ ...soilOverride, potassium: v })}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>pH</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 6.2"
                  placeholderTextColor="#bbb"
                  value={soilOverride.ph}
                  onChangeText={(v) => setSoilOverride({ ...soilOverride, ph: v })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {/* Clear button */}
            {Object.values(soilOverride).some(v => v !== "") && (
              <TouchableOpacity
                onPress={() => setSoilOverride({ nitrogen: "", phosphorus: "", potassium: "", ph: "" })}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Clear all values</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Past recommendations shortcut */}
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <TouchableOpacity
          style={styles.historyCard}
          onPress={() => navigation.navigate("History")}
          activeOpacity={0.7}
        >
          <View style={styles.historyLeft}>
            <Text style={styles.historyEmoji}>📋</Text>
            <View>
              <Text style={styles.historyTitle}>Past recommendations</Text>
              <Text style={styles.historySub}>View your crop history</Text>
            </View>
          </View>
          <Text style={styles.historyChevron}>›</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        <TabItem emoji="🏠" label="Home" active />
        <TabItem
          emoji="📋"
          label="History"
          onPress={() => navigation.navigate("History")}
        />
      </View>

    </SafeAreaView>
  );
}

const SourceChip = ({
  emoji, label, sub, color,
}: {
  emoji: string; label: string; sub: string; color: string;
}) => (
  <View style={[styles.sourceChip, { backgroundColor: color }]}>
    <Text style={styles.sourceEmoji}>{emoji}</Text>
    <Text style={styles.sourceLabel}>{label}</Text>
    <Text style={styles.sourceSub}>{sub}</Text>
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

  // ── Top bar ─────────────────────────────────────
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationPin: {
    fontSize: 12,
  },
  locationText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    maxWidth: 200,
  },
  locationChevron: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "700",
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D6A4F",
  },

  // ── Body ─────────────────────────────────────────
  body: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },

  // ── Hero card ────────────────────────────────────
  heroCard: {
    backgroundColor: "#2D6A4F",
    borderRadius: 20,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    lineHeight: 27,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: "#52B788",
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: "flex-start",
  },
  heroBtnDisabled: {
    opacity: 0.5,
  },
  heroBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  heroEmoji: {
    fontSize: 56,
  },

  // ── Section title ────────────────────────────────
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: -4,
  },

  // ── Source chips ─────────────────────────────────
  sourceRow: {
    flexDirection: "row",
    gap: 10,
  },
  sourceChip: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  sourceEmoji: {
    fontSize: 20,
  },
  sourceLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  sourceSub: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },

  // ── Soil override ────────────────────────────────
  overrideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
  },
  overrideTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  overrideSub: {
    fontSize: 12,
    color: "#888",
  },
  overrideChevron: {
    fontSize: 13,
    color: "#888",
  },
  overrideCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
    marginTop: -8,
    gap: 12,
  },
  overrideNote: {
    fontSize: 12,
    color: "#999",
  },
  inputGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  inputGroup: {
    width: "47%",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#DCDCDC",
    borderRadius: 10,
    padding: 11,
    fontSize: 14,
    color: "#1a1a1a",
  },
  clearBtn: {
    alignSelf: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  clearBtnText: {
    fontSize: 12,
    color: "#888",
  },

  // ── History card ─────────────────────────────────
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyEmoji: {
    fontSize: 28,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  historySub: {
    fontSize: 12,
    color: "#888",
  },
  historyChevron: {
    fontSize: 22,
    color: "#ccc",
    fontWeight: "700",
  },

  // ── Bottom tab bar ────────────────────────────────
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