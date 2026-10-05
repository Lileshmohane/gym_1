import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { isRunningInExpoGo } from "expo";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { sendLocalTestNotification } from "../../notifications/pushNotifications";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function NotificationSettingsScreen() {
  const runningInExpoGo = isRunningInExpoGo();
  const [permission, setPermission] = useState<string | null>(
    runningInExpoGo ? "unavailable" : null
  );

  useEffect(() => {
    if (runningInExpoGo) return;

    let cancelled = false;
    void import("expo-notifications")
      .then((Notifications) => Notifications.getPermissionsAsync())
      .then((res) => {
        if (!cancelled) setPermission(res.status);
      })
      .catch(() => {
        if (!cancelled) setPermission("unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [runningInExpoGo]);

  if (permission === null)
    return (
      <View style={[styles.wrap, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );

  const denied = permission !== "granted";

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Notification Settings</Text>

      {permission === "unavailable" ? (
        <Card style={styles.warningCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={styles.warningTitle}>Expo Go Notice</Text>
          </View>
          <Text style={styles.warningText}>
            Full background push testing requires an EAS development build and is simulated in Expo Go.
          </Text>
        </Card>
      ) : denied ? (
        <Card style={styles.warningCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text style={styles.warningTitle}>Permissions Disabled</Text>
          </View>
          <Text style={styles.warningText}>
            Notifications are turned off at the device system level. You won't receive workout or renewal alerts.
          </Text>
          <Button
            label="Open System Settings"
            variant="ghost"
            style={{ marginTop: spacing.md }}
            onPress={() => Linking.openSettings()}
          />
        </Card>
      ) : (
        <Card style={styles.successCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.successTitle}>Notifications Active</Text>
          </View>
          <Text style={styles.cardText}>
            You will receive workout reminders, streak milestones, and membership renewal notifications.
          </Text>
        </Card>
      )}

      {/* Notification Categories Card */}
      <Card>
        <Text style={styles.sectionHeading}>Active Alert Types</Text>
        <AlertRow icon="fitness" label="Workout Reminders" color={colors.primary} />
        <AlertRow icon="flame" label="Streak Alerts" color={colors.accent} />
        <AlertRow icon="card" label="Membership Expiry (3d, 1d)" color={colors.warning} />
        <AlertRow icon="trophy" label="Personal Records & PRs" color={colors.success} last />
      </Card>

      <Button
        label="Send Test Alert Now"
        variant="primary"
        icon="notifications"
        style={{ marginTop: spacing.md }}
        disabled={denied}
        onPress={async () => {
          const result = await sendLocalTestNotification();
          if (result === "unavailable") {
            Alert.alert("Development build required", "Notification testing is simulated in Expo Go.");
          } else if (result === "denied") {
            Alert.alert("Permission needed", "Enable notifications for this app in system settings first.");
          }
        }}
      />
      <Text style={styles.testHint}>
        Triggers an immediate local test notification to verify OS sound and channel behavior.
      </Text>
    </View>
  );
}

function AlertRow({
  icon,
  label,
  color,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.alertRow, !last && styles.alertBorder]}>
      <View style={styles.alertLeft}>
        <View style={[styles.alertIconBox, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.alertLabel}>{label}</Text>
      </View>
      <Ionicons name="checkmark" size={18} color={colors.success} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
  },
  title: {
    ...typography.display,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  warningCard: {
    borderColor: colors.warning,
    backgroundColor: "rgba(255, 197, 61, 0.08)",
  },
  warningTitle: {
    ...typography.h2,
    fontSize: 15,
    color: colors.warning,
  },
  warningText: {
    ...typography.caption,
    color: colors.textDim,
    lineHeight: 18,
  },
  successCard: {
    borderColor: colors.success,
    backgroundColor: "rgba(46, 230, 166, 0.08)",
  },
  successTitle: {
    ...typography.h2,
    fontSize: 15,
    color: colors.success,
  },
  cardText: {
    ...typography.caption,
    color: colors.textDim,
    lineHeight: 18,
  },
  sectionHeading: {
    ...typography.label,
    fontSize: 11,
    color: colors.textDim,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
  },
  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  alertBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  alertLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  alertLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
  testHint: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: spacing.sm,
    textAlign: "center",
  },
});
