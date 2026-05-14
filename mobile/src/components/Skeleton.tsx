import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { isDark } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const baseColor = isDark ? "#2A4035" : "#E0E0E0";

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: baseColor, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={16} width="70%" />
          <Skeleton height={12} width="45%" />
        </View>
      </View>
      <Skeleton height={8} borderRadius={4} style={{ marginTop: 12 }} />
      <View style={[styles.row, { marginTop: 12 }]}>
        <Skeleton width="30%" height={28} borderRadius={14} />
        <Skeleton width="30%" height={28} borderRadius={14} />
        <Skeleton width="30%" height={28} borderRadius={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "#EBEBEB",
    gap: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
