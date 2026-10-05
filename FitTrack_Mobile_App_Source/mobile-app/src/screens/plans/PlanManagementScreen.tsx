import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCreateGymPlan, useGymPlans } from "../../api/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function PlanManagementScreen() {
  const role = useAuthStore((state) => state.user?.role);
  const canCreate = role === "GYM_OWNER";
  const { data: plans, isLoading, isError, refetch } = useGymPlans();
  const createPlan = useCreateGymPlan();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");

  const submit = async () => {
    const durationDays = Number(duration);
    const amount = Number(price);
    if (
      !name.trim() ||
      !Number.isInteger(durationDays) ||
      durationDays < 1 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      Alert.alert(
        "Check plan details",
        "Enter a plan name, a whole-number duration (days), and a valid price."
      );
      return;
    }
    try {
      await createPlan.mutateAsync({ name: name.trim(), durationDays, price: amount });
      setName("");
      setDuration("");
      setPrice("");
      setShowForm(false);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      Alert.alert("Couldn't create plan", message ?? "Check the details and try again.");
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.heading}>
        <View>
          <View style={styles.badgePill}>
            <Ionicons name="card" size={14} color={colors.primary} />
            <Text style={styles.badgeText}>MEMBERSHIP</Text>
          </View>
          <Text style={styles.title}>Gym Plans</Text>
          <Text style={styles.subtitle}>
            {canCreate ? "Configure membership options for members" : "Available plans at your gym"}
          </Text>
        </View>
        {canCreate && !showForm && (
          <Button
            label="+ Add Plan"
            size="sm"
            onPress={() => setShowForm(true)}
            style={styles.addButton}
          />
        )}
      </View>

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>New Membership Plan</Text>
          <Field label="Plan Name" value={name} onChangeText={setName} placeholder="e.g. 1 Month Unlimited" />
          <Field label="Duration (Days)" value={duration} onChangeText={setDuration} placeholder="30" keyboardType="number-pad" />
          <Field label="Price (₹)" value={price} onChangeText={setPrice} placeholder="1499" keyboardType="decimal-pad" />
          <View style={styles.actions}>
            <Button
              label="Cancel"
              variant="ghost"
              size="sm"
              onPress={() => setShowForm(false)}
              style={styles.action}
              disabled={createPlan.isPending}
            />
            <Button
              label={createPlan.isPending ? "Saving…" : "Save Plan"}
              size="sm"
              onPress={submit}
              style={styles.action}
              disabled={createPlan.isPending}
            />
          </View>
        </Card>
      )}

      {isLoading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {isError && (
        <EmptyState
          icon="alert-circle-outline"
          iconColor={colors.warning}
          message="Couldn't load gym plans."
        />
      )}
      {isError && <Button label="Retry" variant="ghost" onPress={() => refetch()} />}
      {!isLoading && !isError && plans?.length === 0 && (
        <EmptyState
          icon="card-outline"
          iconColor={colors.primary}
          message="No active plans are available yet."
        />
      )}

      {plans?.map((plan) => (
        <Card key={plan.id} style={styles.planCard}>
          <View style={styles.planTop}>
            <View style={styles.planIconWrap}>
              <Ionicons name="fitness-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.duration}>
                {plan.durationDays} days · {plan.status.toLowerCase()}
              </Text>
            </View>
            <Text style={styles.price}>
              ₹{plan.price.toLocaleString("en-IN")}
            </Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "number-pad" | "decimal-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor={colors.textDim}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 54, paddingBottom: spacing.xl },
  heading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
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
  subtitle: { ...typography.caption, color: colors.textDim, marginTop: 2 },
  addButton: { paddingHorizontal: spacing.md },
  formCard: {
    marginBottom: spacing.md,
    borderColor: colors.primary,
  },
  formTitle: { ...typography.h2, fontSize: 17, color: colors.text, marginBottom: spacing.sm },
  field: { marginTop: spacing.sm },
  label: { ...typography.label, fontSize: 11, color: colors.textDim, marginBottom: 4 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
  loader: { marginTop: spacing.xl },
  planCard: { marginBottom: spacing.sm, padding: spacing.md },
  planTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: "rgba(124, 92, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  planInfo: { flex: 1 },
  planName: { ...typography.h2, fontSize: 16, color: colors.text },
  price: { ...typography.h2, fontSize: 18, color: colors.success },
  duration: { ...typography.caption, color: colors.textDim, marginTop: 2 },
});