import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { forgotPassword, resetPassword, deleteAccount } from "../services/api";
import AppAlert, { AppAlertConfig } from "../components/AppAlert";

type PasswordStep = "idle" | "sending" | "awaitingCode" | "resetting" | "done";

export default function ProfileScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { colors } = useTheme();

  const [passwordStep, setPasswordStep]   = useState<PasswordStep>("idle");
  const [resetToken, setResetToken]       = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPass, setConfirmPass]     = useState("");
  const [locStatus, setLocStatus]         = useState<string | null>(null);
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting]           = useState(false);

  const [alertCfg, setAlertCfg] = useState<AppAlertConfig | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const showAlert = (cfg: AppAlertConfig) => { setAlertCfg(cfg); setAlertVisible(true); };

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
        showAlert({ type: "error", title: t("common.error"), message: t("profile.resetTokenError") });
        setPasswordStep("idle");
      }
      return;
    }

    if (passwordStep === "awaitingCode") {
      if (!resetToken.trim()) {
        showAlert({ type: "warning", title: t("common.error"), message: t("profile.enterToken") });
        return;
      }
      if (newPassword.length < 8) {
        showAlert({ type: "warning", title: t("common.error"), message: t("profile.passwordTooShort") });
        return;
      }
      if (newPassword !== confirmPass) {
        showAlert({ type: "warning", title: t("common.error"), message: t("profile.passwordMismatch") });
        return;
      }
      setPasswordStep("resetting");
      try {
        await resetPassword(resetToken.trim(), newPassword);
        setPasswordStep("done");
        setResetToken("");
        setNewPassword("");
        setConfirmPass("");
        showAlert({ type: "success", title: t("profile.passwordChanged"), message: t("profile.passwordChangedMsg") });
      } catch {
        showAlert({ type: "error", title: t("common.error"), message: t("profile.resetError") });
        setPasswordStep("awaitingCode");
      }
    }

    if (passwordStep === "done") {
      setPasswordStep("idle");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmWord = language === "rw" ? "SIBA" : "DELETE";
    if (deleteConfirm.trim().toUpperCase() !== confirmWord) {
      showAlert({ type: "warning", title: t("common.error"), message: t("profile.deleteAccountTypeError") });
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount();
      showAlert({
        type: "success",
        title: t("profile.deleteAccountSuccess"),
        confirmText: "OK",
        onConfirm: () => signOut(),
      });
    } catch {
      showAlert({ type: "error", title: t("common.error"), message: t("profile.deleteAccountError") });
      setDeleting(false);
    }
  };

  const handleLogout = () => {
    showAlert({
      type: "confirm",
      title: t("profile.logoutConfirmTitle"),
      message: t("profile.logoutConfirmMsg"),
      confirmText: t("profile.logout"),
      cancelText: t("common.cancel"),
      onConfirm: signOut,
    });
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
            <InfoRow label={t("profile.name")}  value={user?.full_name || "—"} colors={colors} />
            <InfoRow label={t("profile.email")} value={user?.email    || "—"} colors={colors} />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.settings")}</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Language toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
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

            {/* Location */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Text style={styles.locationPin}>📍</Text>
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
          <View style={[styles.howItWorksIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.howItWorksIconText}>?</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: colors.primary }]}>{t("profile.howItWorks")}</Text>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t("profile.howItWorksSub")}</Text>
          </View>
          <Text style={[styles.chevron, { color: colors.primary }]}>›</Text>
        </TouchableOpacity>

        {/* Change password */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.changePassword")}</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {(passwordStep === "idle" || passwordStep === "done") && (
              <View>
                <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>{t("profile.changePasswordHint")}</Text>
                <TouchableOpacity style={styles.outlineBtn} onPress={handleChangePassword}>
                  <Text style={styles.outlineBtnText}>{t("profile.sendResetCode")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {passwordStep === "sending" && (
              <View style={styles.centeredRow}>
                <ActivityIndicator color="#2D6A4F" />
                <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>{t("profile.sendingCode")}</Text>
              </View>
            )}

            {passwordStep === "awaitingCode" && (
              <View style={{ gap: 12 }}>
                <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>{t("profile.codeSentHint")}</Text>

                <View>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("profile.resetCode")}</Text>
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
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("profile.newPassword")}</Text>
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
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t("profile.confirmPassword")}</Text>
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
                <Text style={[styles.passwordHint, { color: colors.textSecondary }]}>{t("profile.updatingPassword")}</Text>
              </View>
            )}

          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("profile.legal")}</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, gap: 0 }]}>
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => Linking.openURL("https://moussassoss.github.io/Agrivision/privacy-policy.html")}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t("profile.privacyPolicy")}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t("profile.privacyPolicySub")}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => Linking.openURL("https://moussassoss.github.io/Agrivision/terms-of-service.html")}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>{t("profile.termsOfService")}</Text>
                <Text style={[styles.settingValue, { color: colors.textSecondary }]}>{t("profile.termsOfServiceSub")}</Text>
              </View>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete account */}
        <View style={styles.section}>
          {!showDeleteZone ? (
            <TouchableOpacity
              style={styles.deleteRevealBtn}
              onPress={() => setShowDeleteZone(true)}
            >
              <Text style={styles.deleteRevealText}>{t("profile.deleteAccount")}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.infoCard, { backgroundColor: "#FFF5F5", borderColor: "#FFCDD2", borderWidth: 1 }]}>
              <Text style={styles.deleteDangerTitle}>{t("profile.deleteAccount")}</Text>
              <Text style={[styles.deleteHint, { color: colors.textSecondary }]}>{t("profile.deleteAccountHint")}</Text>
              <TextInput
                style={styles.deleteInput}
                value={deleteConfirm}
                onChangeText={setDeleteConfirm}
                placeholder={t("profile.deleteAccountConfirmPlaceholder")}
                placeholderTextColor="#ccc"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.deleteBtnText}>{t("profile.deleteAccountBtn")}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowDeleteZone(false); setDeleteConfirm(""); }} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t("profile.logout")}</Text>
        </TouchableOpacity>

      </ScrollView>

      <AppAlert visible={alertVisible} config={alertCfg} onDismiss={() => setAlertVisible(false)} />
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value, colors }: { label: string; value: string; colors: any }) => (
  <View style={styles.infoRow}>
    <View style={{ flex: 1 }}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
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
  },
  backBtn:  { width: 60 },
  backText: { fontSize: 17, color: "#4CAF50", fontWeight: "600" },
  topTitle: { fontSize: 16, fontWeight: "700" },

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
  sectionTitle: { fontSize: 16, fontWeight: "700" },

  infoCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    gap: 12,
  },
  infoRow:   { flexDirection: "row", alignItems: "center" },
  infoLabel: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: "600" },

  settingRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  locationPin: { fontSize: 16 },
  settingLabel:{ fontSize: 14, fontWeight: "600", marginBottom: 2 },
  settingValue:{ fontSize: 12 },
  chevron:     { fontSize: 20, fontWeight: "700" },

  toggleBtn:     { backgroundColor: "#E8F5E9", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  toggleBtnText: { fontSize: 13, color: "#2D6A4F", fontWeight: "700" },

  divider: { height: 0.5 },

  howItWorksIcon:     { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  howItWorksIconText: { fontSize: 20, fontWeight: "800", color: "#fff" },

  passwordHint: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  inputLabel:   { fontSize: 12, fontWeight: "600", marginBottom: 6 },
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

  outlineBtn:     { borderRadius: 12, padding: 13, alignItems: "center", borderWidth: 1, borderColor: "#2D6A4F" },
  outlineBtnText: { color: "#2D6A4F", fontWeight: "700", fontSize: 14 },

  primaryBtn:     { backgroundColor: "#2D6A4F", borderRadius: 12, padding: 14, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  cancelBtn:     { alignItems: "center", paddingVertical: 6 },
  cancelBtnText: { fontSize: 13, color: "#aaa" },

  legalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },

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

  deleteRevealBtn:  { alignItems: "center", paddingVertical: 8 },
  deleteRevealText: { fontSize: 13, color: "#B71C1C", fontWeight: "500" },

  deleteDangerTitle: { fontSize: 15, fontWeight: "700", color: "#B71C1C", marginBottom: 6 },
  deleteHint:        { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  deleteInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 12,
    letterSpacing: 2,
  },
  deleteBtn: {
    backgroundColor: "#C62828",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  deleteBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
