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
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirm) {
      Alert.alert(t("common.error"), t("register.fillRequired"));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t("common.error"), t("register.passwordMismatch"));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t("common.error"), t("register.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      await signUp({
        full_name: fullName.trim(),
        email:     email.trim().toLowerCase(),
        password,
        phone:     phone.trim() || undefined,
      });
    } catch (e: any) {
      Alert.alert(
        t("register.registrationFailed"),
        e?.response?.data?.detail || t("register.somethingWentWrong")
      );
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
          <Text style={styles.logo}>🌱</Text>
          <Text style={styles.title}>{t("register.title")}</Text>
          <Text style={styles.subtitle}>{t("register.subtitle")}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>{t("register.fullName")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("register.fullNamePlaceholder")}
            placeholderTextColor="#aaa"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>{t("register.email")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("register.emailPlaceholder")}
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>{t("register.phone")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("register.phonePlaceholder")}
            placeholderTextColor="#aaa"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>{t("register.password")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("register.passwordPlaceholder")}
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>{t("register.confirmPassword")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("register.confirmPasswordPlaceholder")}
            placeholderTextColor="#aaa"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t("register.createAccountBtn")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>
              {t("register.alreadyHaveAccount")}{" "}
              <Text style={styles.linkBold}>{t("register.logIn")}</Text>
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
    marginBottom: 32,
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
    marginTop: 4,
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
