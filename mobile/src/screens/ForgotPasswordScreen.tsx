import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { forgotPassword, resetPassword } from "../services/api";

export default function ForgotPasswordScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [step, setStep]               = useState<"email" | "reset">("email");
  const [email, setEmail]             = useState("");
  const [token, setToken]             = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm]         = useState("");
  const [loading, setLoading]         = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert(t("common.error"), t("forgotPassword.enterEmail"));
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        t("forgotPassword.codeSentTitle"),
        t("forgotPassword.codeSentMessage"),
        [{ text: t("common.continue"), onPress: () => setStep("reset") }]
      );
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || t("forgotPassword.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token || !newPassword || !confirm) {
      Alert.alert(t("common.error"), t("forgotPassword.fillAllFields"));
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert(t("common.error"), t("forgotPassword.passwordMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert(t("common.error"), t("forgotPassword.passwordTooShort"));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim(), newPassword);
      Alert.alert(
        t("forgotPassword.successTitle"),
        t("forgotPassword.successMessage"),
        [{ text: t("forgotPassword.logInBtn"), onPress: () => navigation.navigate("Login") }]
      );
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || t("forgotPassword.invalidToken"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🔐</Text>
          <Text style={[styles.title, { color: colors.primary }]}>
            {step === "email" ? t("forgotPassword.titleEmail") : t("forgotPassword.titleReset")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === "email"
              ? t("forgotPassword.subtitleEmail")
              : t("forgotPassword.subtitleReset")}
          </Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepContainer}>
          <View style={[styles.stepDot, { backgroundColor: colors.border }, step === "email" && { backgroundColor: colors.primary, width: 16, height: 16, borderRadius: 8 }]} />
          <View style={[styles.stepLine, { backgroundColor: colors.border }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.border }, step === "reset" && { backgroundColor: colors.primary, width: 16, height: 16, borderRadius: 8 }]} />
        </View>

        {/* Form */}
        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {step === "email" ? (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t("forgotPassword.emailAddress")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t("forgotPassword.emailPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("forgotPassword.sendTokenBtn")}</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t("forgotPassword.resetToken")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t("forgotPassword.tokenPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />
              <Text style={[styles.label, { color: colors.text }]}>{t("forgotPassword.newPassword")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t("forgotPassword.passwordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <Text style={[styles.label, { color: colors.text }]}>{t("forgotPassword.confirmNewPassword")}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder={t("forgotPassword.confirmPasswordPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("forgotPassword.resetPasswordBtn")}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep("email")}>
                <Text style={[styles.backText, { color: colors.primary }]}>{t("forgotPassword.backLink")}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              {t("forgotPassword.rememberPassword")}{" "}
              <Text style={[styles.linkBold, { color: colors.primary }]}>{t("forgotPassword.logIn")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flexGrow: 1, justifyContent: "center", padding: 24 },
  header:          { alignItems: "center", marginBottom: 24 },
  logo:            { fontSize: 56, marginBottom: 8 },
  title:           { fontSize: 28, fontWeight: "bold" },
  subtitle:        { fontSize: 14, textAlign: "center", marginTop: 6, lineHeight: 20, paddingHorizontal: 16 },
  stepContainer:   { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24, gap: 8 },
  stepDot:         { width: 12, height: 12, borderRadius: 6 },
  stepLine:        { width: 40, height: 2 },
  form:            { borderRadius: 16, padding: 24, borderWidth: 0.5, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  label:           { fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input:           { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15 },
  button:          { backgroundColor: "#2D6A4F", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  buttonDisabled:  { opacity: 0.6 },
  buttonText:      { color: "#fff", fontWeight: "bold", fontSize: 16 },
  backText:        { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 16 },
  linkText:        { textAlign: "center", fontSize: 14, marginTop: 20 },
  linkBold:        { fontWeight: "bold" },
});
