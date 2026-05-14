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
import { forgotPassword, resetPassword } from "../services/api";

export default function ForgotPasswordScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [step, setStep]               = useState<"email" | "reset">("email");
  const [email, setEmail]             = useState("");
  const [token, setToken]             = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm]         = useState("");
  const [loading, setLoading]         = useState(false);

  // ── Step 1: Request reset token ─────────────────
  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert(t("common.error"), t("forgotPassword.enterEmail"));
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        t("forgotPassword.tokenGenerated"),
        t("forgotPassword.tokenMessage", { token: res.token }),
        [{ text: t("common.continue"), onPress: () => setStep("reset") }]
      );
    } catch (e: any) {
      Alert.alert(t("common.error"), e?.response?.data?.detail || t("forgotPassword.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Reset password with token ───────────
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
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🔐</Text>
          <Text style={styles.title}>
            {step === "email" ? t("forgotPassword.titleEmail") : t("forgotPassword.titleReset")}
          </Text>
          <Text style={styles.subtitle}>
            {step === "email"
              ? t("forgotPassword.subtitleEmail")
              : t("forgotPassword.subtitleReset")}
          </Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepContainer}>
          <View style={[styles.stepDot, step === "email" && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === "reset" && styles.stepDotActive]} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {step === "email" ? (
            <>
              <Text style={styles.label}>{t("forgotPassword.emailAddress")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("forgotPassword.emailPlaceholder")}
                placeholderTextColor="#aaa"
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
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t("forgotPassword.sendTokenBtn")}</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>{t("forgotPassword.resetToken")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("forgotPassword.tokenPlaceholder")}
                placeholderTextColor="#aaa"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
              />

              <Text style={styles.label}>{t("forgotPassword.newPassword")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("forgotPassword.passwordPlaceholder")}
                placeholderTextColor="#aaa"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <Text style={styles.label}>{t("forgotPassword.confirmNewPassword")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("forgotPassword.confirmPasswordPlaceholder")}
                placeholderTextColor="#aaa"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t("forgotPassword.resetPasswordBtn")}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep("email")}>
                <Text style={styles.backText}>{t("forgotPassword.backLink")}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>
              {t("forgotPassword.rememberPassword")}{" "}
              <Text style={styles.linkBold}>{t("forgotPassword.logIn")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F0F7F4",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2D6A4F",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#C8E6C9",
  },
  stepDotActive: {
    backgroundColor: "#2D6A4F",
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: "#C8E6C9",
  },
  form: {
    backgroundColor: "#fff",
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
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#333",
  },
  button: {
    backgroundColor: "#2D6A4F",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  backText: {
    color: "#2D6A4F",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  linkText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginTop: 20,
  },
  linkBold: {
    color: "#2D6A4F",
    fontWeight: "bold",
  },
});
