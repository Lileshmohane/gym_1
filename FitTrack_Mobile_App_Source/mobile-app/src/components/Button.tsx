import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, typography } from "../theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "accent";

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  textColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: "md" | "sm";
}

export function Button({
  label,
  onPress,
  variant = "primary",
  style,
  textStyle,
  disabled = false,
  textColor,
  icon,
  size = "md",
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      mass: 0.8,
    }).start();
  };

  const pressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      mass: 0.8,
    }).start();
  };

  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const isGhost = variant === "ghost";
  const isSuccess = variant === "success";
  const isAccent = variant === "accent";

  const height = size === "sm" ? 44 : 52;
  const buttonRadius = radius.md; // 16

  // Resolve text color per Section 6
  let resolvedTextColor = textColor;
  if (!resolvedTextColor) {
    if (disabled) resolvedTextColor = colors.textDim;
    else if (isPrimary || isAccent) resolvedTextColor = "#FFFFFF";
    else if (isSecondary) resolvedTextColor = colors.primary;
    else if (isSuccess) resolvedTextColor = colors.bg;
    else if (isGhost) resolvedTextColor = colors.text;
    else resolvedTextColor = "#FFFFFF";
  }

  const content = (
    <View style={[styles.innerContent, { gap: 8 }]}>
      {icon && (
        <Ionicons
          name={icon}
          size={size === "sm" ? 18 : 20}
          color={resolvedTextColor}
        />
      )}
      <Text
        style={[
          styles.label,
          { color: resolvedTextColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={[
          styles.base,
          {
            height,
            borderRadius: buttonRadius,
            opacity: disabled ? 0.6 : 1,
          },
          // Plain styling for non-primary/non-gradient
          !isPrimary && {
            backgroundColor: disabled
              ? colors.border
              : isSecondary
              ? "transparent"
              : isGhost
              ? colors.card
              : isSuccess
              ? colors.success
              : colors.accent,
            borderWidth: isSecondary ? 2 : isGhost ? 1 : 0,
            borderColor: isSecondary ? colors.primary : colors.border,
          },
        ]}
      >
        {isPrimary && !disabled ? (
          <LinearGradient
            colors={["#7C5CFF", "#FF6B4A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              StyleSheet.absoluteFill,
              styles.gradientWrap,
              { borderRadius: buttonRadius },
            ]}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  gradientWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.h2,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
