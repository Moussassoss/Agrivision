import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { forgotPassword, resetPassword } from "../services/api";

type PasswordStep = "idle" | "sending" | "awaitingCode" | "resetting" | "done";

export default function ProfileScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { colors, isDark, toggleTheme } = useTheme();

  const [passwordStep, setPasswordStep] = useState<PasswordStep>("idle");
  const [resetToken, setResetToken]     = useState("");
  const [newPassword, setNewPassword]   = useState("");
  const [confirmPass, setConfirmPass]   = useState("");
  const [locStatus, setLocStatus]       = useState<string | null>(null);

  const handleRequestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setLocStatus(t("profile.locationGranted"));
    } else {
      setLocStatus(t("profile.locationDenied"));
    }
  };

  const handleChangePassword = async () => {
    if (passwordStep === "idle") {
      setPasswordStep("sending");
      try {
        await forgotPassword(user!.email);
        setPasswordStep("awaitingCode");
      } catch {
        Alert.alert(t("common.error"), t("profile.resetTokenError"));
        setPasswordStep("idle");
      }
      return;
    }

    if (passwordStep === "awaitingCode") {
      if (!resetToken.trim()) {
        Alert.alert(t("common.error"), t("profile.enterToken"));
        return;
      }
      if (newPassword.length < 8) {
        Alert.alert(t("common.error"), t("profile.passwordTooShort"));
        return;
      }
      if (newPassword !== confirmPass) {
        Alert.alert(t("common.error"), t("profile.passwordMismatch"));
        return;
      }
      setPasswordStep("resetting");
      try {
        await resetPassword(resetToken.trim(), newPassword);
        setPasswordStep("done");
        setResetToken("");
        setNewPassword("");
        setConfirmPass("");
        Alert.alert(t("profile.passwordChanged"), t("profile.passwordChangedMsg"));
      } catch {
        Alert.alert(t("common.error"), t("profile.resetError"));
        setPasswordStep("awaitingCode");
      }
    }

    if (passwordStep === "done") {
      setPasswordStep("idle");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t("profile.logoutConfirmTitle"),
      t("profile.logoutConfirmMsg"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.logout"),
          style: "destructive",
          onPress: signOut,
        },
      ]
    );
  };

  const cancelPasswordChange = () => {
    setPasswordStep("idle");
    setResetToken("");
    setNewPassword("");
    setConfirmPass("");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.background} />

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>{t("profile.title")}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {user?.full_name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <Text style={styles.fullName}>{user?.full_name}</Text>
          <Text style={styles.emailTag}>{user?.email}</Text>
        </View>

        {/* User info card */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.accountInfo")}</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <InfoRow icon="👤" label={t("profile.name")}  value={user?.full_name || "—"} />
            <InfoRow icon="📧" label={t("profile.email")} value={user?.email    || "—"} />
            {user?.phone && (
              <InfoRow icon="📱" label={t("profile.phone")} value={user.phone} />
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.settings")}</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Language toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>🌐</Text>
                <View>
                  <Text style={styles.settingLabel}>{t("profile.language")}</Text>
                  <Text style={styles.settingValue}>
                    {language === "en" ? "English" : "Ikinyarwanda"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.toggleBtn} onPress={toggleLanguage}>
                <Text style={styles.toggleBtnText}>
                  {language === "en" ? "🇷🇼 RW" : "🇬🇧 EN"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Dark mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>{isDark ? "🌙" : "☀️"}</Text>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{t("profile.darkMode")}</Text>
                  <Text style={[styles.settingValue, { color: colors.textSecondary }]}>
                    {isDark ? t("profile.darkModeOn") : t("profile.darkModeOff")}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: colors.primarySurface }]} onPress={toggleTheme}>
                <Text style={[styles.toggleBtnText, { color: colors.primary }]}>{isDark ? "🌙" : "☀️"}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Location */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingIcon}>📍</Text>
                <View>
                  <Text style={styles.settingLabel}>{t("profile.locationAccess")}</Text>
                  {locStatus && (
                    <Text style={styles.settingValue}>{locStatus}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.toggleBtn} onPress={handleRequestLocation}>
                <Text style={styles.toggleBtnText}>{t("profile.request")}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* How it works */}
        <TouchableOpacity
          style={[styles.infoCard, { backgroundColor: colors.primarySurface, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }]}
          onPress={() => navigation.navigate("HowItWorks")}
        >
          <Text style={{ fontSize: 24 }}>🔬</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.primary }]}>{t("profile.howItWorks")}</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t("profile.howItWorksSub")}</Text>
          </View>
          <Text style={[styles.settingIcon, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>

        {/* Change password */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.changePassword")}</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {(passwordStep === "idle" || passwordStep === "done") && (
              <View>
                <Text style={styles.passwordHint}>{t("profile.changePasswordHint")}</Text>
                <TouchableOpacity style={styles.outlineBtn} onPress={handleChangePassword}>
                  <Text style={styles.outlineBtnText}>{t("profile.sendResetCode")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {passwordStep === "sending" && (
              <View style={styles.centeredRow}>
                <ActivityIndicator color="#2D6A4F" />
                <Text style={styles.passwordHint}>{t("profile.sendingCode")}</Text>
              </View>
            )}

            {passwordStep === "awaitingCode" && (
              <View style={{ gap: 12 }}>
                <Text style={styles.passwordHint}>{t("profile.codeSentHint")}</Text>

                <View>
                  <Text style={styles.inputLabel}>{t("profile.resetCode")}</Text>
                  <TextInput
                    style={styles.input}
                    value={resetToken}
                    onChangeText={setResetToken}
                    placeholder={t("profile.resetCodePlaceholder")}
                    placeholderTextColor="#ccc"
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>{t("profile.newPassword")}</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    placeholderTextColor="#ccc"
                    secureTextEntry
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>{t("profile.confirmPassword")}</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPass}
                    onChangeText={setConfirmPass}
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    placeholderTextColor="#ccc"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword}>
                  <Text style={styles.primaryBtnText}>{t("profile.updatePassword")}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={cancelPasswordChange} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {passwordStep === "resetting" && (
              <View style={styles.centeredRow}>
                <ActivityIndicator color="#2D6A4F" />
                <Text style={styles.passwordHint}>{t("profile.updatingPassword")}</Text>
              </View>
            )}

          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>🚪  {t("profile.logout")}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

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
  backBtn:  { width: 60 },
  backText: { fontSize: 17, color: "#4CAF50", fontWeight: "600" },
  topTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },

  body: { padding: 20, paddingBottom: 48, gap: 20 },

  avatarSection: { alignItems: "center", gap: 8, paddingTop: 8 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2D6A4F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { fontSize: 36, fontWeight: "700", color: "#fff" },
  fullName:     { fontSize: 22, fontWeight: "700", color: "#1a1a1a" },
  emailTag:     { fontSize: 14, color: "#888" },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },

  infoCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
    gap: 12,
  },
  infoRow:   { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon:  { fontSize: 20 },
  infoLabel: { fontSize: 11, color: "#888", fontWeight: "500", marginBottom: 2 },
  infoValue: { fontSize: 15, color: "#1a1a1a", fontWeight: "600" },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  settingIcon:  { fontSize: 20 },
  settingLabel: { fontSize: 14, color: "#1a1a1a", fontWeight: "600", marginBottom: 2 },
  settingValue: { fontSize: 12, color: "#888" },

  toggleBtn: {
    backgroundColor: "#E8F5E9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  toggleBtnText: { fontSize: 13, color: "#2D6A4F", fontWeight: "700" },

  divider: { height: 0.5, backgroundColor: "#EBEBEB" },

  passwordHint: { fontSize: 13, color: "#888", lineHeight: 19, marginBottom: 10 },

  inputLabel: { fontSize: 12, fontWeight: "600", color: "#555", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#DCDCDC",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1a1a1a",
  },

  centeredRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  outlineBtn: {
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2D6A4F",
  },
  outlineBtnText: { color: "#2D6A4F", fontWeight: "700", fontSize: 14 },

  primaryBtn: {
    backgroundColor: "#2D6A4F",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  cancelBtn:     { alignItems: "center", paddingVertical: 6 },
  cancelBtnText: { fontSize: 13, color: "#aaa" },

  logoutBtn: {
    backgroundColor: "#FFF0F0",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#FFCDD2",
    marginTop: 4,
  },
  logoutBtnText: { color: "#D32F2F", fontWeight: "700", fontSize: 15 },
});
