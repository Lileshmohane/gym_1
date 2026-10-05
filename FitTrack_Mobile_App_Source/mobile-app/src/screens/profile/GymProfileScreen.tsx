import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useGymProfile } from "../../api/hooks";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { colors, spacing, typography } from "../../theme/tokens";

export default function GymProfileScreen() {
  const { data, isLoading, isError, refetch } = useGymProfile();

  if (isLoading)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );

  if (isError || !data) {
    return (
      <View style={[styles.screen, { padding: spacing.lg, justifyContent: "center" }]}>
        <EmptyState
          icon="alert-circle-outline"
          iconColor={colors.warning}
          message="Couldn't load gym details."
        />
        <Button label="Retry" variant="ghost" onPress={() => refetch()} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>GYM WORKSPACE</Text>
      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.subtitle}>Facility & Subscription Profile</Text>

      <Card>
        <Detail label="Contact Email" value={data.email} />
        <Detail label="Phone Number" value={data.phone} />
        <Detail label="Facility Address" value={data.address || "Not provided"} last />
      </Card>

      <Card>
        <Detail label="Account Status" value={data.status} />
        <Detail label="Subscription Tier" value={data.planTier} last />
      </Card>
    </ScrollView>
  );
}

function Detail({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.detail, !last && styles.divider]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  eyebrow: {
    ...typography.label,
    fontSize: 11,
    color: colors.primary,
    marginBottom: 4,
  },
  title: { ...typography.display, fontSize: 28, color: colors.text },
  subtitle: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  detail: { paddingVertical: spacing.sm },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { ...typography.label, fontSize: 11, color: colors.textDim },
  value: { ...typography.body, color: colors.text, marginTop: 4, fontWeight: "600" },
});