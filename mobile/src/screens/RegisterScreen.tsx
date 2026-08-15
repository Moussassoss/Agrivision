import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AppAlert, { AppAlertConfig } from "../components/AppAlert";

export default function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const { colors } = useTheme();
  const [fullName, setFullName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [termsAccepted, setTerms]   = useState(false);

  const [alertCfg, setAlertCfg] = useState<AppAlertConfig | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const showAlert = (cfg: AppAlertConfig) => { setAlertCfg(cfg); setAlertVisible(true); };

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirm) {
      showAlert({ type: "warning", title: t("common.error"), message: t("register.fillRequired") });
      return;
    }
    if (!termsAccepted) {
      showAlert({ type: "warning", title: t("common.error"), message: t("register.mustAcceptTerms") });
      return;
    }
    if (password !== confirm) {
      showAlert({ type: "warning", title: t("common.error"), message: t("register.passwordMismatch") });
      return;
    }
    if (password.length < 8) {
      showAlert({ type: "warning", title: t("common.error"), message: t("register.passwordTooShort") });
      return;
    }
    setLoading(true);
    try {
      await signUp({
        full_name: fullName.trim(),
        email:     email.trim().toLowerCase(),
        password,
      });
    } catch (e: any) {
      showAlert({
        type: "error",
        title: t("register.registrationFailed"),
        message: e?.response?.data?.detail || t("register.somethingWentWrong"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoSymbol}>C</Text>
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>{t("register.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("register.subtitle")}</Text>
        </View>

        {/* Form */}
        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>{t("register.fullName")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder={t("register.fullNamePlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t("register.email")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder={t("register.emailPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>{t("register.password")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder={t("register.passwordPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={[styles.label, { color: colors.text }]}>{t("register.confirmPassword")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder={t("register.confirmPasswordPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          {/* Terms & Privacy acceptance */}
          <TouchableOpacity style={styles.termsRow} onPress={() => setTerms(!termsAccepted)} activeOpacity={0.7}>
            <View style={[styles.checkbox, { borderColor: colors.primary }, termsAccepted && { backgroundColor: colors.primary }]}>
              {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              {t("register.agreePrefix")}{" "}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={() => Linking.openURL("https://moussassoss.github.io/Agrivision/privacy-policy.html")}
              >
                {t("register.privacyPolicy")}
              </Text>
              {" "}{t("register.and")}{" "}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={() => Linking.openURL("https://moussassoss.github.io/Agrivision/terms-of-service.html")}
              >
                {t("register.termsOfService")}
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, (loading || !termsAccepted) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading || !termsAccepted}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t("register.createAccountBtn")}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              {t("register.alreadyHaveAccount")}{" "}
              <Text style={[styles.linkBold, { color: colors.primary }]}>{t("register.logIn")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppAlert visible={alertVisible} config={alertCfg} onDismiss={() => setAlertVisible(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, justifyContent: "center", padding: 24 },
  header:         { alignItems: "center", marginBottom: 32 },
  logoCircle:     { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  logoSymbol:     { fontSize: 32, fontWeight: "800", color: "#fff" },
  title:          { fontSize: 28, fontWeight: "bold" },
  subtitle:       { fontSize: 14, marginTop: 4 },
  form:           { borderRadius: 16, padding: 24, borderWidth: 0.5, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  label:          { fontSize: 14, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input:          { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15 },
  button:         { backgroundColor: "#2D6A4F", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: "#fff", fontWeight: "bold", fontSize: 16 },
  termsRow:       { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 20, marginBottom: 4 },
  checkbox:       { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  checkmark:      { color: "#fff", fontSize: 13, fontWeight: "700", lineHeight: 15 },
  termsText:      { flex: 1, fontSize: 13, lineHeight: 19 },
  termsLink:      { fontWeight: "600", textDecorationLine: "underline" },
  linkText:       { textAlign: "center", fontSize: 14, marginTop: 20 },
  linkBold:       { fontWeight: "bold" },
});
