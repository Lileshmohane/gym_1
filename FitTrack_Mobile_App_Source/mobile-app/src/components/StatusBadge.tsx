import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { radius, statusColor, SubscriptionStatus, typography } from "../theme/tokens";

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [status]);

  const label: Record<SubscriptionStatus, string> = {
    ACTIVE: "● Active",
    EXPIRING: "● Expiring soon",
    EXPIRED: "● Expired",
    CANCELLED: "● Cancelled",
    PENDING_PAYMENT: "● Pending payment",
  };

  const color = statusColor[status] ?? "#A0A6BA";

  return (
    <Animated.View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: `${color}40`, opacity }]}>
      <Text style={[styles.text, { color }]}>{label[status] ?? status}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  text: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
