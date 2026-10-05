import React from "react";
import { View, Text, StyleSheet, ViewStyle, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, typography } from "../theme/tokens";

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

// Workout & Hero Photo Card per Section 4 of Design Guide
export function WorkoutPhotoCard({
  title,
  meta,
  uri,
  onPress,
  badge,
  height = 180,
  style,
}: {
  title: string;
  meta?: string;
  uri: string;
  onPress?: () => void;
  badge?: string;
  height?: number;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.photoCard,
        { height },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(18,20,28,0.92)"]}
        style={StyleSheet.absoluteFill}
      />
      {badge && (
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>{badge}</Text>
        </View>
      )}
      <View style={styles.photoCardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        {meta && <Text style={styles.cardMeta}>{meta}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  photoCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoCardContent: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  cardTitle: {
    ...typography.display,
    fontSize: 22,
    color: colors.text,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 4,
  },
  cardBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  cardBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
