import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { useMyPayments, Payment } from "../../api/hooks";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function PaymentHistoryScreen() {
  const { data: payments, isLoading } = useMyPayments();

  if (isLoading)
    return (
      <View style={[styles.wrap, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Ionicons name="receipt" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>BILLING HISTORY</Text>
        </View>
        <Text style={styles.title}>Payment History</Text>
      </View>

      {!payments?.length ? (
        <EmptyState
          icon="receipt-outline"
          iconColor={colors.primary}
          message="No payments recorded yet."
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          renderItem={({ item }: { item: Payment }) => {
            const isCompleted = item.status === "COMPLETED";
            return (
              <Card style={styles.paymentCard}>
                <View style={styles.paymentLeft}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isCompleted
                          ? "rgba(46, 230, 166, 0.15)"
                          : "rgba(255, 197, 61, 0.15)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={isCompleted ? "checkmark-circle" : "time"}
                      size={20}
                      color={isCompleted ? colors.success : colors.warning}
                    />
                  </View>
                  <View>
                    <Text style={styles.paymentTitle}>Gym Pass Fee</Text>
                    <Text style={styles.date}>{item.paymentDate}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.amount,
                    { color: isCompleted ? colors.success : colors.warning },
                  ]}
                >
                  ₹{item.amount.toLocaleString("en-IN")}
                </Text>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 54 },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
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
  title: { ...typography.display, fontSize: 30, color: colors.text },
  paymentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  date: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    ...typography.h2,
    fontSize: 16,
    fontWeight: "700",
  },
});
