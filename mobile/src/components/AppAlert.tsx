import React, { useEffect, useRef } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from "react-native";

export type AlertType = "success" | "error" | "warning" | "confirm" | "info";

export interface AppAlertConfig {
  type?: AlertType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface Props {
  visible: boolean;
  config: AppAlertConfig | null;
  onDismiss: () => void;
}

const TYPE_META: Record<AlertType, { circle: string; symbol: string }> = {
  success: { circle: "#4CAF50", symbol: "✓" },
  error:   { circle: "#E53935", symbol: "✕" },
  warning: { circle: "#FF9800", symbol: "!" },
  confirm: { circle: "#2D6A4F", symbol: "?" },
  info:    { circle: "#1976D2", symbol: "i" },
};

export default function AppAlert({ visible, config, onDismiss }: Props) {
  const scale   = useRef(new Animated.Value(0.88)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.88);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!config) return null;

  const type = config.type ?? "info";
  const meta = TYPE_META[type];
  const hasCancel = config.cancelText !== undefined || type === "confirm";

  const confirm = () => { onDismiss(); config.onConfirm?.(); };
  const cancel  = () => { onDismiss(); config.onCancel?.(); };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={cancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={hasCancel ? undefined : cancel}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>

          <View style={[styles.iconCircle, { backgroundColor: meta.circle }]}>
            <Text style={styles.iconSymbol}>{meta.symbol}</Text>
          </View>

          <Text style={styles.title}>{config.title}</Text>
          {config.message ? <Text style={styles.message}>{config.message}</Text> : null}

          <View style={[styles.btnRow, hasCancel && styles.btnRowTwo]}>
            {hasCancel && (
              <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
                <Text style={styles.cancelBtnText}>{config.cancelText ?? "Cancel"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: meta.circle }, hasCancel && styles.confirmBtnHalf]}
              onPress={confirm}
            >
              <Text style={styles.confirmBtnText}>{config.confirmText ?? "OK"}</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconSymbol: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 4,
  },
  btnRow: {
    width: "100%",
    marginTop: 8,
  },
  btnRowTwo: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#F0F0F0",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  confirmBtn: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    width: "100%",
  },
  confirmBtnHalf: {
    flex: 1,
    width: undefined,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
