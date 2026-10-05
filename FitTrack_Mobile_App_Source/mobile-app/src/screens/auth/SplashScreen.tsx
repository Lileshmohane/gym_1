import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, typography } from "../../theme/tokens";

export default function SplashScreen() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <View style={styles.wrap}>
      <View style={styles.logoWrap}>
        <Ionicons name="barbell" size={48} color={colors.primary} />
      </View>
      <Text style={styles.title}>FITTRACK PRO</Text>
      <Text style={styles.subtitle}>GYM PERFORMANCE & MANAGEMENT</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(124, 92, 255, 0.15)",
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    ...typography.display,
    fontSize: 26,
    color: colors.text,
    letterSpacing: 1,
  },
  subtitle: {
    ...typography.label,
    fontSize: 11,
    color: colors.textDim,
    marginTop: 6,
    letterSpacing: 1.5,
  },
});
