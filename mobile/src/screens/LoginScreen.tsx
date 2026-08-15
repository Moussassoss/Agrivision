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
} from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import AppAlert, { AppAlertConfig } from "../components/AppAlert";

export default function LoginScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const [alertCfg, setAlertCfg] = useState<AppAlertConfig | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const showAlert = (cfg: AppAlertConfig) => { setAlertCfg(cfg); setAlertVisible(true); };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({ type: "warning", title: t("common.error"), message: t("login.fillAllFields") });
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (e: any) {
      showAlert({
        type: "error",
        title: t("login.loginFailed"),
        message: e?.response?.data?.detail || t("login.incorrectCredentials"),
      });
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
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoSymbol}>C</Text>
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>CropVana</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("login.subtitle")}</Text>
        </View>

        {/* Form */}
        <View style={[styles.form, { backgroundColor: colors.background }]}>
          <Text style={[styles.label, { color: colors.text }]}>{t("login.email")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder={t("login.emailPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>{t("login.password")}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder={t("login.passwordPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>{t("login.forgotPassword")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t("login.loginBtn")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>
              {t("login.noAccount")}{" "}
              <Text style={[styles.linkBold, { color: colors.primary }]}>{t("login.signUp")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AppAlert visible={alertVisible} config={alertCfg} onDismiss={() => setAlertVisible(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoSymbol: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  form: {
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
  },
  forgotText: {
    fontSize: 13,
    textAlign: "right",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2D6A4F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  linkText: {
    textAlign: "center",
    fontSize: 14,
    marginTop: 20,
  },
  linkBold: {
    fontWeight: "bold",
  },
});
