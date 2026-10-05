import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, typography, spacing } from "../theme/tokens";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title?: string;
  message: string;
}

export function EmptyState({
  icon = "information-circle-outline",
  iconColor,
  title,
  message,
}: EmptyStateProps) {
  const resolvedColor = iconColor ?? colors.primary;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: `${resolvedColor}15`,
            borderColor: `${resolvedColor}30`,
          },
        ]}
      >
        <Ionicons name={icon} size={36} color={resolvedColor} />
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  message: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});
