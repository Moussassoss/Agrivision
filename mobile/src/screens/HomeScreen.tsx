import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, StatusBar, SafeAreaView, Animated,
} from "react-native";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { getRecommendation } from "../services/api";
import { Skeleton } from "../components/Skeleton";

const CROP_EMOJI: Record<string, string> = {
  rice: "🌾", maize: "🌽", chickpea: "🫘", kidneybeans: "🫘",
  pigeonpeas: "🌿", mothbeans: "🌱", mungbean: "🌱", blackgram: "🫘",
  lentil: "🌿", pomegranate: "🍎", banana: "🍌", mango: "🥭",
  grapes: "🍇", watermelon: "🍉", muskmelon: "🍈", apple: "🍏",
  orange: "🍊", papaya: "🍈", coconut: "🥥", cotton: "☁️",
  jute: "🌿", coffee: "☕",
};

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user }                                 = useAuth();
  const { colors }                               = useTheme();
  const [location, setLocation]                 = useState<{ lat: number; lon: number } | null>(null);
  const [locationName, setLocationName]         = useState("");
  const [loadingLocation, setLoadingLocation]   = useState(false);
  const [loadingRec, setLoadingRec]             = useState(false);
  const [showOverride, setShowOverride]         = useState(false);
  const [result, setResult]                     = useState<any>(null);
  const [soilOverride, setSoilOverride]         = useState({ nitrogen: "", phosphorus: "", potassium: "", ph: "" });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { requestLocation(); }, []);

  useEffect(() => {
    if (result) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [result]);

  const requestLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("home.locationRequired"), t("home.locationRequiredMsg"));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setLocation({ lat, lon });
      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (geocode.length > 0) {
        const p = geocode[0];
        setLocationName([p.district, p.city, p.country].filter(Boolean).join(", "));
      }
    } catch {
      Alert.alert(t("common.error"), t("home.locationError"));
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleGetRecommendation = async () => {
    if (!location) { Alert.alert(t("home.noLocation"), t("home.noLocationMsg")); return; }
    setLoadingRec(true);
    setResult(null);
    try {
      const override: any = {};
      if (soilOverride.nitrogen)   override.nitrogen   = parseFloat(soilOverride.nitrogen);
      if (soilOverride.phosphorus) override.phosphorus = parseFloat(soilOverride.phosphorus);
      if (soilOverride.potassium)  override.potassium  = parseFloat(soilOverride.potassium);
      if (soilOverride.ph)         override.ph         = parseFloat(soilOverride.ph);
      const hasOverride = Object.keys(override).length > 0;
      const data = await getRecommendation(location.lat, location.lon, hasOverride ? override : undefined, language);
      setResult(data);
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || t("home.recError"));
    } finally {
      setLoadingRec(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSoilOverride({ nitrogen: "", phosphorus: "", potassium: "", ph: "" });
    setShowOverride(false);
  };

  const topCrop = result?.top_crops?.[0];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t("home.greeting", { name: user?.full_name?.split(" ")[0] })}
          </Text>
          <TouchableOpacity onPress={requestLocation} style={styles.locationRow}>
            <Text style={styles.locationPin}>📍</Text>
            {loadingLocation ? (
              <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 4 }} />
            ) : (
              <Text style={[styles.locationText, { color: colors.accent }]} numberOfLines={1}>
                {locationName || t("home.detectingLocation")}
              </Text>
            )}
            <Text style={[styles.locationChevron, { color: colors.accent }]}> ›</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity onPress={toggleLanguage} style={[styles.langBtn, { backgroundColor: colors.primarySurface }]}>
            <Text style={[styles.langBtnText, { color: colors.primary }]}>🌐 {t("language.switchTo")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={[styles.avatarBtn, { backgroundColor: colors.primarySurface }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.full_name?.charAt(0).toUpperCase() || "A"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Loading skeleton ── */}
        {loadingRec && (
          <View style={{ gap: 14 }}>
            <View style={[styles.heroCard, { backgroundColor: colors.heroBg, height: 280, justifyContent: "center", alignItems: "center", gap: 16 }]}>
              <Skeleton width={80} height={80} borderRadius={40} />
              <Skeleton width="50%" height={20} borderRadius={10} />
              <Skeleton width="80%" height={10} borderRadius={5} />
              <Skeleton width="60%" height={36} borderRadius={18} />
            </View>
            <Skeleton height={17} width="40%" />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Skeleton height={100} style={{ flex: 1 }} borderRadius={14} />
              <Skeleton height={100} style={{ flex: 1 }} borderRadius={14} />
            </View>
          </View>
        )}

        {/* ── No result yet ── */}
        {!result && !loadingRec && (
          <>
            <View style={[styles.heroCard, { backgroundColor: colors.heroBg }]}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroTitle}>{t("home.heroTitle")}</Text>
                <Text style={styles.heroSub}>{t("home.heroSub")}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.heroBtn, (!location || loadingRec) && styles.heroBtnDisabled, { flex: 1 }]}
                    onPress={handleGetRecommendation}
                    disabled={!location || loadingRec}
                  >
                    <Text style={styles.heroBtnText}>{t("home.analyseBtn")}</Text>
                  </TouchableOpacity>
                  {Object.values(soilOverride).some(v => v !== "") && (
                    <TouchableOpacity style={styles.clearHeroBtn} onPress={handleReset}>
                      <Text style={styles.clearHeroBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.heroEmoji}>🌾</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.autoFetchedData")}</Text>
            <View style={styles.sourceRow}>
              <SourceChip emoji="🛰️" label="iSDAsoil"    sub="N · P · K · pH" color="#E8F5E9" />
              <SourceChip emoji="🌦️" label="OpenWeather" sub="Temp · Humidity"  color="#E3F2FD" />
              <SourceChip emoji="🌧️" label="NASA POWER"  sub="Seasonal rain"    color="#FFF8E1" />
            </View>

            <TouchableOpacity
              style={[styles.overrideHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowOverride(!showOverride)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={[styles.overrideTitle, { color: colors.text }]}>{t("home.labSoilTitle")}</Text>
                <Text style={[styles.overrideSub, { color: colors.textSecondary }]}>{t("home.labSoilSub")}</Text>
              </View>
              <Text style={[styles.overrideChevron, { color: colors.textMuted }]}>{showOverride ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {showOverride && (
              <View style={[styles.overrideCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.overrideNote, { color: colors.textMuted }]}>{t("home.labSoilNote")}</Text>
                <View style={styles.inputGrid}>
                  {[
                    { label: t("home.nitrogenLabel"),   key: "nitrogen" },
                    { label: t("home.phosphorusLabel"), key: "phosphorus" },
                    { label: t("home.potassiumLabel"),  key: "potassium" },
                    { label: t("home.phLabel"),         key: "ph" },
                  ].map(({ label, key }) => (
                    <View key={key} style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="—"
                        placeholderTextColor={colors.textMuted}
                        value={(soilOverride as any)[key]}
                        onChangeText={(v) => setSoilOverride({ ...soilOverride, [key]: v })}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
                {Object.values(soilOverride).some(v => v !== "") && (
                  <TouchableOpacity
                    onPress={() => setSoilOverride({ nitrogen: "", phosphorus: "", potassium: "", ph: "" })}
                    style={[styles.clearBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>{t("home.clearValues")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.recentActivity")}</Text>
            <TouchableOpacity
              style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate("History")}
              activeOpacity={0.7}
            >
              <View style={styles.historyLeft}>
                <Text style={styles.historyEmoji}>📋</Text>
                <View>
                  <Text style={[styles.historyTitle, { color: colors.text }]}>{t("home.pastRecs")}</Text>
                  <Text style={[styles.historySub, { color: colors.textSecondary }]}>{t("home.viewHistory")}</Text>
                </View>
              </View>
              <Text style={[styles.historyChevron, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Result view ── */}
        {result && !loadingRec && (
          <Animated.View style={{ opacity: fadeAnim, gap: 14 }}>

            {/* Top crop hero */}
            <View style={[styles.heroCard, { backgroundColor: colors.heroBg, flexDirection: "column" }]}>
              <View style={{ alignItems: "center", width: "100%", gap: 8 }}>
                <Text style={{ fontSize: 64 }}>{CROP_EMOJI[topCrop.crop] || "🌱"}</Text>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{t("home.bestCrop")}</Text>
                <Text style={{ color: "#fff", fontSize: 30, fontWeight: "700" }}>
                  {t(`crops.${topCrop.crop}`, { defaultValue: topCrop.crop })}
                </Text>
                <View style={{ width: "100%", gap: 4 }}>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${Math.round(topCrop.confidence * 100)}%` as any }]} />
                  </View>
                  <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textAlign: "right" }}>
                    {t("home.confidence", { value: Math.round(topCrop.confidence * 100) })}
                  </Text>
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
                  <Text style={styles.guideBtnText}>{t("home.plantingGuide")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fertilizer */}
            {topCrop.fertilizer && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("result.fertilizerTitle")}</Text>
                <View style={[styles.fertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {topCrop.fertilizer.items.map((item: string, i: number) => {
                    const isOk = item.toLowerCase().includes("adequate") || item.toLowerCase().includes("irahuye") || item.toLowerCase().includes("fix");
                    return (
                      <View key={i} style={styles.fertRow}>
                        <Text style={[styles.fertDot, { color: isOk ? colors.accent : "#FF9800" }]}>{isOk ? "✓" : "⚠"}</Text>
                        <Text style={[styles.fertText, { color: colors.text }]}>{item}</Text>
                      </View>
                    );
                  })}
                  <View style={[styles.fertNote, { backgroundColor: colors.primarySurface }]}>
                    <Text style={[styles.fertNoteText, { color: colors.primary }]}>ℹ️  {topCrop.fertilizer.note}</Text>
                  </View>
                </View>
              </>
            )}

            {/* Other options */}
            {result.top_crops.length > 1 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.otherOptions")}</Text>
                <View style={styles.altRow}>
                  {result.top_crops.slice(1).map((crop: any, i: number) => (
                    <View key={i} style={[styles.altCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={{ fontSize: 30 }}>{CROP_EMOJI[crop.crop] || "🌱"}</Text>
                      <Text style={[styles.altName, { color: colors.text }]}>{t(`crops.${crop.crop}`, { defaultValue: crop.crop })}</Text>
                      <View style={[styles.altPill, { backgroundColor: colors.primarySurface }]}>
                        <Text style={[styles.altPillText, { color: colors.primary }]}>{Math.round(crop.confidence * 100)}%</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Soil used */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.soilDataUsed")}</Text>
            <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dataGrid}>
                <DataTile label="N"  value={`${result.soil_used.nitrogen}`}   unit="mg/kg" color="#E8F5E9" />
                <DataTile label="P"  value={`${result.soil_used.phosphorus}`} unit="mg/kg" color="#E3F2FD" />
                <DataTile label="K"  value={`${result.soil_used.potassium}`}  unit="mg/kg" color="#FFF8E1" />
                <DataTile label="pH" value={`${result.soil_used.ph}`}         unit=""      color="#FCE4EC" />
              </View>
              <Text style={[styles.sourceTag, { color: colors.textMuted }]}>
                {result.soil_used.source === "isdasoil" ? t("home.soilSourceSatellite") : result.soil_used.source === "manual+isdasoil" ? t("home.soilSourceManualSat") : t("home.soilSourceManual")}
              </Text>
            </View>

            {/* Weather used */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("home.weatherDataUsed")}</Text>
            <View style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.dataGrid}>
                <DataTile label="Temp"     value={`${result.weather_used.temperature}`}         unit="°C" color="#E3F2FD" />
                <DataTile label="Humidity" value={`${result.weather_used.humidity}`}             unit="%"  color="#E8F5E9" />
                <DataTile label="Rainfall" value={`${Math.round(result.weather_used.rainfall)}`} unit="mm" color="#FFF8E1" />
              </View>
              <Text style={[styles.sourceTag, { color: colors.textMuted }]}>{t("home.weatherSource")}</Text>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={handleReset}>
              <Text style={styles.primaryBtnText}>{t("home.newRecommendation")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => navigation.navigate("History")}>
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>{t("home.viewAllPast")}</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom tab bar */}
      <View style={[styles.tabBar, { borderTopColor: colors.borderLight, backgroundColor: colors.tabBar }]}>
        <TabItem emoji="🏠" label={t("common.home")} active colors={colors} />
        <TabItem emoji="📋" label={t("common.history")} colors={colors} onPress={() => navigation.navigate("History")} />
      </View>
    </SafeAreaView>
  );
}

const SourceChip = ({ emoji, label, sub, color }: any) => (
  <View style={[styles.sourceChip, { backgroundColor: color }]}>
    <Text style={styles.sourceEmoji}>{emoji}</Text>
    <Text style={styles.sourceLabel}>{label}</Text>
    <Text style={styles.sourceSub}>{sub}</Text>
  </View>
);

const DataTile = ({ label, value, unit, color }: any) => (
  <View style={[styles.dataTile, { backgroundColor: color }]}>
    <Text style={styles.dataTileLabel}>{label}</Text>
    <Text style={styles.dataTileValue}>{value}<Text style={styles.dataTileUnit}> {unit}</Text></Text>
  </View>
);

const TabItem = ({ emoji, label, active, onPress, colors }: any) => (
  <TouchableOpacity style={styles.tabItem} onPress={onPress}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    <Text style={[styles.tabLabel, { color: active ? colors.accent : colors.textMuted }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe:            { flex: 1 },
  topBar:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 0.5 },
  greeting:        { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  locationRow:     { flexDirection: "row", alignItems: "center" },
  locationPin:     { fontSize: 12 },
  locationText:    { fontSize: 13, fontWeight: "600", maxWidth: 160 },
  locationChevron: { fontSize: 16, fontWeight: "700" },
  langBtn:         { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  langBtnText:     { fontSize: 12, fontWeight: "600" },
  avatarBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText:      { fontSize: 16, fontWeight: "700" },

  body:            { padding: 20, paddingBottom: 32, gap: 16 },

  heroCard:        { backgroundColor: "#2D6A4F", borderRadius: 20, padding: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroLeft:        { flex: 1, paddingRight: 12, gap: 6 },
  heroTitle:       { fontSize: 20, fontWeight: "700", color: "#fff", lineHeight: 27 },
  heroSub:         { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  heroBtn:         { backgroundColor: "#52B788", borderRadius: 30, paddingVertical: 10, paddingHorizontal: 18, alignItems: "center" },
  heroBtnDisabled: { opacity: 0.5 },
  heroBtnText:     { color: "#fff", fontWeight: "700", fontSize: 13 },
  heroEmoji:       { fontSize: 56 },
  clearHeroBtn:    { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 30, paddingVertical: 10, paddingHorizontal: 14, justifyContent: "center", alignItems: "center" },
  clearHeroBtnText:{ color: "#fff", fontWeight: "700", fontSize: 14 },

  sectionTitle:    { fontSize: 17, fontWeight: "700", marginBottom: -4 },

  sourceRow:       { flexDirection: "row", gap: 10 },
  sourceChip:      { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  sourceEmoji:     { fontSize: 20 },
  sourceLabel:     { fontSize: 11, fontWeight: "700", color: "#1a1a1a", textAlign: "center" },
  sourceSub:       { fontSize: 10, color: "#666", textAlign: "center" },

  overrideHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 14, padding: 16, borderWidth: 0.5 },
  overrideTitle:   { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  overrideSub:     { fontSize: 12 },
  overrideChevron: { fontSize: 13 },
  overrideCard:    { borderRadius: 14, padding: 16, borderWidth: 0.5, marginTop: -8, gap: 12 },
  overrideNote:    { fontSize: 12 },
  inputGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  inputGroup:      { width: "47%" },
  inputLabel:      { fontSize: 11, fontWeight: "600", marginBottom: 5 },
  input:           { borderWidth: 0.5, borderRadius: 10, padding: 11, fontSize: 14 },
  clearBtn:        { alignSelf: "center", paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 0.5 },
  clearBtnText:    { fontSize: 12 },

  historyCard:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, padding: 16, borderWidth: 0.5 },
  historyLeft:     { flexDirection: "row", alignItems: "center", gap: 12 },
  historyEmoji:    { fontSize: 28 },
  historyTitle:    { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  historySub:      { fontSize: 12 },
  historyChevron:  { fontSize: 22, fontWeight: "700" },

  barBg:           { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 4, overflow: "hidden" },
  barFill:         { height: "100%", backgroundColor: "#95D5B2", borderRadius: 4 },
  badge:           { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 30, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.25)" },
  badgeText:       { color: "#fff", fontSize: 13, fontWeight: "500" },
  whyBox:          { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, width: "100%" },
  whyText:         { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 20, textAlign: "center" },
  guideBtn:        { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.3)" },
  guideBtnText:    { color: "#fff", fontWeight: "700", fontSize: 13, textAlign: "center" },

  fertCard: { borderRadius: 14, padding: 14, borderWidth: 0.5, gap: 10 },
  fertRow:  { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  fertDot:  { fontSize: 15, fontWeight: "700", marginTop: 1, width: 18 },
  fertText: { fontSize: 13, lineHeight: 20, flex: 1 },
  fertNote: { borderRadius: 10, padding: 12, marginTop: 4 },
  fertNoteText: { fontSize: 12, lineHeight: 18, fontWeight: "500" },

  altRow:          { flexDirection: "row", gap: 10 },
  altCard:         { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", gap: 6, borderWidth: 0.5 },
  altName:         { fontSize: 14, fontWeight: "700", textAlign: "center" },
  altPill:         { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  altPillText:     { fontSize: 12, fontWeight: "700" },

  dataCard:        { borderRadius: 14, padding: 14, borderWidth: 0.5, gap: 12 },
  dataGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dataTile:        { width: "47%", borderRadius: 12, padding: 12, gap: 4 },
  dataTileLabel:   { fontSize: 11, color: "#666", fontWeight: "500" },
  dataTileValue:   { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  dataTileUnit:    { fontSize: 12, fontWeight: "400", color: "#888" },
  sourceTag:       { fontSize: 11, textAlign: "right" },

  primaryBtn:      { borderRadius: 14, padding: 16, alignItems: "center" },
  primaryBtnText:  { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtn:    { borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 0.5 },
  secondaryBtnText:{ fontWeight: "600", fontSize: 14 },

  tabBar:          { flexDirection: "row", borderTopWidth: 0.5, paddingBottom: 24, paddingTop: 10 },
  tabItem:         { flex: 1, alignItems: "center", gap: 3 },
  tabEmoji:        { fontSize: 20 },
  tabLabel:        { fontSize: 11, fontWeight: "600" },
});
