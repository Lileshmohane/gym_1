import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, typography } from "../theme/tokens";

interface GoalRingProps {
  progress?: number; // 0.0 to 1.0
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function GoalRing({
  progress = 0.75,
  size = 130,
  strokeWidth = 12,
  label,
  sublabel,
}: GoalRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const center = size / 2;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress]);

  // Stroke offset for the progress circle
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track (Steel) */}
        <Circle
          cx={center}
          cy={center}
          r={radiusVal}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc (Volt Violet) */}
        <Circle
          cx={center}
          cy={center}
          r={radiusVal}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={styles.contentWrap}>
        <Text style={styles.label}>
          {label ?? `${Math.round(clampedProgress * 100)}%`}
        </Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.display,
    fontSize: 26,
    color: colors.text,
  },
  sublabel: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
