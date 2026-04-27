import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../context/AuthContext";
import { getRecommendation } from "../services/api";

export default function HomeScreen({ navigation }: any) {
  const { user, signOut }                   = useAuth();
  const [location, setLocation]             = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName]     = useState<string>("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingRec, setLoadingRec]         = useState(false);
  const [soilOverride, setSoilOverride]     = useState({
    nitrogen:   "",
    phosphorus: "",
    potassium:  "",
    ph:         "",
  });
  const [showOverride, setShowOverride]     = useState(false);

  // ── Request GPS on mount ────────────────────────
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Required",
          "AgriVision needs your location to fetch soil and weather data for your farm.",
          [{ text: "OK" }]
        );
        setLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setLocation({ lat, lon });

      // Reverse geocode to get place name
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geocode.length > 0) {
        const place = geocode[0];
        setLocationName(
          [place.district, place.city, place.country]
            .filter(Boolean)
            .join(", ")
        );
      }
    } catch (e) {
      Alert.alert("Error", "Could not get your location. Please try again.");
    } finally {
      setLoadingLocation(false);
    }
  };

  // ── Get recommendation ──────────────────────────
  const handleGetRecommendation = async () => {
    if (!location) {
      Alert.alert("No Location", "Please allow location access first.");
      return;
    }

    setLoadingRec(true);
    try {
      // Build optional soil override
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

      // Navigate to result screen with data
      navigation.navigate("Result", { result });
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.detail || "Could not get recommendation. Please try again."
      );
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.full_name?.split(" ")[0]} 👋</Text>
          <Text style={styles.headerSub}>What should you grow today?</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Location card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Your Location</Text>
          {loadingLocation ? (
            <ActivityIndicator color="#2D6A4F" style={{ marginTop: 8 }} />
          ) : location ? (
            <>
              <Text style={styles.locationName}>{locationName || "Location detected"}</Text>
              <Text style={styles.locationCoords}>
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </Text>
              <TouchableOpacity onPress={requestLocation} style={styles.refreshBtn}>
                <Text style={styles.refreshText}>🔄 Refresh location</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={requestLocation} style={styles.allowBtn}>
              <Text style={styles.allowBtnText}>Allow Location Access</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* What we fetch automatically */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 Auto-fetched Data</Text>
          <Text style={styles.autoText}>
            Once you tap <Text style={{ fontWeight: "bold" }}>Get Recommendation</Text>,
            AgriVision will automatically fetch:
          </Text>
          <View style={styles.autoList}>
            <AutoItem emoji="🛰️" text="Soil N, P, K, pH from iSDAsoil" />
            <AutoItem emoji="🌦️" text="Temperature & humidity from OpenWeather" />
            <AutoItem emoji="🌧️" text="Annual rainfall from NASA POWER" />
          </View>
        </View>

        {/* Optional soil override */}
        <TouchableOpacity
          style={styles.overrideToggle}
          onPress={() => setShowOverride(!showOverride)}
        >
          <Text style={styles.overrideToggleText}>
            {showOverride ? "▼" : "▶"} Have lab soil results? Enter manually
          </Text>
        </TouchableOpacity>

        {showOverride && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧪 Manual Soil Override (optional)</Text>
            <Text style={styles.overrideNote}>
              Leave blank to use satellite data automatically.
            </Text>
            {[
              { label: "Nitrogen (N) mg/kg",   key: "nitrogen" },
              { label: "Phosphorus (P) mg/kg", key: "phosphorus" },
              { label: "Potassium (K) mg/kg",  key: "potassium" },
              { label: "pH",                   key: "ph" },
            ].map(({ label, key }) => (
              <View key={key}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.input}>
                  <Text
                    style={styles.inputText}
                    onPress={() => {}}
                  >
                    {(soilOverride as any)[key] || ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity
          style={[
            styles.recButton,
            (!location || loadingRec) && styles.recButtonDisabled,
          ]}
          onPress={handleGetRecommendation}
          disabled={!location || loadingRec}
        >
          {loadingRec ? (
            <View style={styles.recButtonInner}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.recButtonText}>  Analyzing your farm...</Text>
            </View>
          ) : (
            <Text style={styles.recButtonText}>🌾 Get Crop Recommendation</Text>
          )}
        </TouchableOpacity>

        {/* History shortcut */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.historyBtnText}>📋 View past recommendations</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const AutoItem = ({ emoji, text }: { emoji: string; text: string }) => (
  <View style={styles.autoItem}>
    <Text style={styles.autoEmoji}>{emoji}</Text>
    <Text style={styles.autoItemText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F4",
  },
  header: {
    backgroundColor: "#2D6A4F",
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  logoutText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  body: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B4332",
    marginBottom: 10,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  refreshBtn: {
    marginTop: 10,
  },
  refreshText: {
    color: "#2D6A4F",
    fontSize: 13,
    fontWeight: "600",
  },
  allowBtn: {
    backgroundColor: "#2D6A4F",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  allowBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  autoText: {
    fontSize: 13,
    color: "#555",
    lineHeight: 19,
    marginBottom: 10,
  },
  autoList: {
    gap: 8,
  },
  autoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  autoEmoji: {
    fontSize: 18,
  },
  autoItemText: {
    fontSize: 13,
    color: "#444",
    flex: 1,
  },
  overrideToggle: {
    paddingVertical: 4,
  },
  overrideToggleText: {
    color: "#2D6A4F",
    fontSize: 14,
    fontWeight: "600",
  },
  overrideNote: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
  },
  inputText: {
    fontSize: 14,
    color: "#333",
  },
  recButton: {
    backgroundColor: "#2D6A4F",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#2D6A4F",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recButtonDisabled: {
    opacity: 0.5,
  },
  recButtonInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  recButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  historyBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  historyBtnText: {
    color: "#2D6A4F",
    fontSize: 14,
    fontWeight: "600",
  },
});