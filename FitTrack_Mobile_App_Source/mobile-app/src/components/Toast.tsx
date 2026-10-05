import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, Pressable, View } from "react-native";
import { colors, radius, spacing, typography } from "../theme/tokens";

export type ToastVariant = "success" | "error" | "info";

export function Toast({
  title,
  body,
  visible,
  variant = "success",
  onDismiss,
}: {
  title: string;
  body?: string;
  visible: boolean;
  variant?: ToastVariant;
  onDismiss: () => void;
}) {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    if (!visible) return;
    Animated.spring(translateY, {
      toValue: 0,
      damping: 16,
      mass: 0.8,
      useNativeDriver: true,
    }).start();

    // Stays 2.5 seconds per Section 8 of Design Guide
    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -140,
        duration: 250,
        useNativeDriver: true,
      }).start(onDismiss);
    }, 2500);

    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  const barColor =
    variant === "error"
      ? colors.accent // Flame Coral (#FF6B4A)
      : variant === "info"
      ? colors.primary // Volt Violet (#7C5CFF)
      : colors.success; // Mint (#2EE6A6)

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }] }]}>
      <Pressable onPress={onDismiss} style={styles.card}>
        {/* Accent left indicator bar */}
        <View style={[styles.indicatorBar, { backgroundColor: barColor }]} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {!!body && <Text style={styles.body}>{body}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 54,
    paddingHorizontal: spacing.md,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.card, // Slate (#1E2230)
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border, // Steel (#2C3145)
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  indicatorBar: {
    width: 6,
  },
  textContainer: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  title: {
    ...typography.h2,
    fontSize: 15,
    color: colors.text, // Chalk (#F2F3F7)
  },
  body: {
    ...typography.caption,
    color: colors.textDim, // Dust (#A0A6BA)
    marginTop: 3,
  },
});
