import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { useMySubscription } from "../../api/hooks";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function MembershipDetailScreen() {
  const { data: subscription } = useMySubscription();
  if (!subscription) return null;

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ padding: spacing.lg, paddingTop: 54 }}>
      <View style={styles.badgePill}>
        <Ionicons name="card" size={14} color={colors.primary} />
        <Text style={styles.badgeText}>YOUR SUBSCRIPTION</Text>
      </View>
      <Text style={styles.title}>Membership</Text>

      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.plan}>{subscription.planName}</Text>
            <Text style={styles.price}>₹{subscription.price} / month</Text>
          </View>
          <StatusBadge status={subscription.status} />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Start Date</Text>
          <Text style={styles.value}>{subscription.startDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Renewal Date</Text>
          <Text style={styles.value}>{subscription.endDate}</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 92, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  badgeText: {
    ...typography.label,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: { ...typography.display, fontSize: 30, color: colors.text, marginBottom: spacing.md },
  card: { padding: spacing.lg },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  plan: { fontSize: 20, fontWeight: "700", color: colors.text },
  price: { ...typography.caption, color: colors.success, marginTop: 4, fontSize: 15, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  label: { color: colors.textDim, fontSize: 14 },
  value: { color: colors.text, fontWeight: "600", fontSize: 14 },
});
