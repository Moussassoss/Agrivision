import React, { useEffect, useRef } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";

type StepType = "water" | "seed" | "prepare" | "fertilize" | "weed" | "harvest" | "store" | "monitor";

export function getStepType(stepText: string): StepType {
  const l = stepText.toLowerCase();
  if (/water|irrigat|arros|amazi|ukunyw/.test(l))         return "water";
  if (/seed|sow|plant|tera|ubikiw|nashe/.test(l))          return "seed";
  if (/soil|till|plow|prepar|harrow|ubutaka|gutegur|guhinga/.test(l)) return "prepare";
  if (/fertiliz|manure|compost|npk|dap|urea|umote|mbolea/.test(l))    return "fertilize";
  if (/weed|pest|spray|fung|insect|ubwatsi|gusamw/.test(l)) return "weed";
  if (/harvest|pick|collect|vuna|isarura/.test(l))          return "harvest";
  if (/store|dry|ubika|ukajya/.test(l))                     return "store";
  return "monitor";
}

const STEP_META: Record<StepType, { emoji: string; color: string; label: string }> = {
  water:     { emoji: "💧", color: "#E3F2FD", label: "Irrigate"  },
  seed:      { emoji: "🌱", color: "#E8F5E9", label: "Plant"     },
  prepare:   { emoji: "🪚", color: "#FFF8E1", label: "Prepare"   },
  fertilize: { emoji: "🌿", color: "#F1F8E9", label: "Fertilize" },
  weed:      { emoji: "🌾", color: "#FFF3E0", label: "Maintain"  },
  harvest:   { emoji: "🧺", color: "#FCE4EC", label: "Harvest"   },
  store:     { emoji: "📦", color: "#EDE7F6", label: "Store"     },
  monitor:   { emoji: "👁️", color: "#E0F7FA", label: "Monitor"   },
};

// ── Water: drops fall and fade ────────────────────────
function WaterAnimation() {
  const drops = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = drops.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 250),
          Animated.timing(d, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0, duration: 100, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.animBox}>
      {drops.map((d, i) => (
        <Animated.Text
          key={i}
          style={{
            fontSize: 18,
            position: "absolute",
            left: 12 + i * 16,
            opacity: d,
            transform: [{ translateY: d.interpolate({ inputRange: [0, 1], outputRange: [-5, 30] }) }],
          }}
        >
          💧
        </Animated.Text>
      ))}
    </View>
  );
}

// ── Seed: grows upward ────────────────────────────────
function SeedAnimation() {
  const grow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(grow, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(grow, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={styles.animBox}>
      <Animated.Text style={{ fontSize: 32, transform: [{ scale: grow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }], opacity: grow }}>
        🌱
      </Animated.Text>
    </View>
  );
}

// ── Prepare: shovel oscillates ────────────────────────
function PrepareAnimation() {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 500, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={styles.animBox}>
      <Animated.Text style={{ fontSize: 32, transform: [{ rotate: rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-25deg", "25deg"] }) }] }}>
        ⛏️
      </Animated.Text>
    </View>
  );
}

// ── Fertilize: dots burst outward ─────────────────────
function FertilizeAnimation() {
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(burst, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(burst, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  const dots = [
    { dx: -18, dy: -18 }, { dx: 0, dy: -22 }, { dx: 18, dy: -18 },
    { dx: -22, dy: 0  }, { dx: 22, dy: 0   }, { dx: -18, dy: 18 },
    { dx: 0,   dy: 22 }, { dx: 18, dy: 18  },
  ];

  return (
    <View style={styles.animBox}>
      <Text style={{ fontSize: 16, position: "absolute" }}>🌿</Text>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: "#4CAF50",
            opacity: burst,
            transform: [
              { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, dot.dx] }) },
              { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, dot.dy] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ── Harvest: bounce ───────────────────────────────────
function HarvestAnimation() {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -14, duration: 350, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={styles.animBox}>
      <Animated.Text style={{ fontSize: 32, transform: [{ translateY: bounce }] }}>
        🧺
      </Animated.Text>
    </View>
  );
}

// ── Weed / Monitor / Store: gentle pulse ───────────────
function PulseAnimation({ emoji }: { emoji: string }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, []);

  return (
    <View style={styles.animBox}>
      <Animated.Text style={{ fontSize: 32, transform: [{ scale: pulse }] }}>
        {emoji}
      </Animated.Text>
    </View>
  );
}

// ── Public component ──────────────────────────────────
export function StepAnimation({ type, stepIndex }: { type: StepType; stepIndex: number }) {
  const meta = STEP_META[type];

  const inner = () => {
    switch (type) {
      case "water":     return <WaterAnimation />;
      case "seed":      return <SeedAnimation />;
      case "prepare":   return <PrepareAnimation />;
      case "fertilize": return <FertilizeAnimation />;
      case "harvest":   return <HarvestAnimation />;
      default:          return <PulseAnimation emoji={meta.emoji} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: meta.color }]}>
      {inner()}
      <Text style={styles.label}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    height: 80,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    gap: 4,
  },
  animBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: "#555",
    textAlign: "center",
  },
});
